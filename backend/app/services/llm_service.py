"""
LLM Service for handling interactions with various Large Language Model providers using Langchain.

Supports: Azure OpenAI, OpenAI, Google Gemini, DeepSeek (via OpenAI-compatible API).
Provider selection and configuration are managed via environment variables (see config.py).
"""
import logging
import time
import asyncio
from typing import Dict, List, Optional, Any, Union, AsyncGenerator
from dataclasses import dataclass

# Langchain Core and Provider Imports
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_openai import AzureChatOpenAI, ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
# Note: DeepSeek might require a specific package later, using ChatOpenAI for now.

from pydantic import BaseModel

from app.core.config import settings
from app.utils.sse import SSEEvent, SSEEventType, create_sse_event, create_medical_chunk_event, create_medical_stage_event

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class StreamChunk:
    """
    Represents a chunk of streamed content from LLM
    """
    content: str
    position: int = 0
    length: int = 0
    is_word_boundary: bool = False
    metadata: Optional[Dict[str, Any]] = None
    
    def __post_init__(self):
        if self.length == 0:
            self.length = len(self.content)


class Message(BaseModel):
    """
    Message model for chat history
    """
    role: str
    content: str

class LLMService:
    """
    Service for interacting with configured LLM provider.

    Uses a factory pattern in __init__ to instantiate the correct
    Langchain chat model based on `settings.LLM_PROVIDER`.
    """
    llm: BaseChatModel # Type hint for the initialized LLM

    def __init__(self):
        """
        Initialize the LLM based on the provider specified in settings.

        Raises:
            ValueError: If the configured provider is unsupported or
                        if required API keys/settings are missing.
            Exception: For any other initialization errors from Langchain.
        """
        provider = settings.LLM_PROVIDER
        model_name = settings.LLM_MODEL_NAME
        temperature = settings.LLM_TEMPERATURE
        max_tokens = settings.LLM_MAX_TOKENS

        logger.info(f"Initializing LLM for provider: {provider}")

        try:
            if provider == "azure":
                # --- Azure OpenAI Initialization ---
                if not all([settings.AZURE_OPENAI_API_KEY, settings.AZURE_OPENAI_API_BASE, settings.AZURE_OPENAI_DEPLOYMENT_NAME]):
                    raise ValueError("Azure OpenAI requires AZURE_OPENAI_API_KEY, AZURE_OPENAI_API_BASE, and AZURE_OPENAI_DEPLOYMENT_NAME.")
                self.llm = AzureChatOpenAI(
                    deployment_name=settings.AZURE_OPENAI_DEPLOYMENT_NAME,
                    azure_endpoint=settings.AZURE_OPENAI_API_BASE,
                    openai_api_key=settings.AZURE_OPENAI_API_KEY,
                    openai_api_version=settings.AZURE_OPENAI_API_VERSION,
                    temperature=temperature,
                    max_tokens=max_tokens
                )
                logger.info(f"Azure OpenAI LLM initialized successfully (Deployment: {settings.AZURE_OPENAI_DEPLOYMENT_NAME})")

            elif provider == "openai":
                # --- OpenAI Initialization ---
                if not settings.OPENAI_API_KEY:
                    raise ValueError("OpenAI provider requires OPENAI_API_KEY.")
                self.llm = ChatOpenAI(
                    model_name=model_name,
                    openai_api_key=settings.OPENAI_API_KEY,
                    temperature=temperature,
                    max_tokens=max_tokens
                )
                logger.info(f"OpenAI LLM initialized successfully (Model: {model_name})")

            elif provider == "gemini":
                # --- Google Gemini Initialization ---
                if not settings.GOOGLE_API_KEY:
                    raise ValueError("Google Gemini provider requires GOOGLE_API_KEY.")
                self.llm = ChatGoogleGenerativeAI(
                    model=model_name, # e.g., "gemini-pro"
                    google_api_key=settings.GOOGLE_API_KEY,
                    temperature=temperature,
                    # Note: Gemini might use 'max_output_tokens' instead of 'max_tokens'
                    # Adjust if needed based on Langchain documentation for ChatGoogleGenerativeAI
                    additional_kwargs={"max_output_tokens": max_tokens} if max_tokens else {}
                )
                logger.info(f"Google Gemini LLM initialized successfully (Model: {model_name})")

            elif provider == "deepseek":
                # --- DeepSeek Initialization (using OpenAI compatibility) ---
                if not settings.DEEPSEEK_API_KEY:
                    raise ValueError("DeepSeek provider requires DEEPSEEK_API_KEY.")
                self.llm = ChatOpenAI(
                    model_name=model_name, # e.g., "deepseek-chat"
                    openai_api_key=settings.DEEPSEEK_API_KEY,
                    openai_api_base=settings.DEEPSEEK_API_BASE, # Use the specific DeepSeek endpoint
                    temperature=temperature,
                    max_tokens=max_tokens
                )
                logger.info(f"DeepSeek LLM initialized successfully (Model: {model_name}, Endpoint: {settings.DEEPSEEK_API_BASE})")

            else:
                raise ValueError(f"Unsupported LLM provider configured: {provider}")

        except ValueError as ve: # Catch config errors specifically
             logger.error(f"Configuration error for LLM provider '{provider}': {str(ve)}")
             raise
        except Exception as e:
            logger.error(f"Failed to initialize LLM for provider '{provider}': {str(e)}")
            # Potentially log more details or traceback here
            raise # Re-raise the exception to halt startup if LLM is critical

    def generate(self, prompt_template: str, **kwargs) -> str:
        """
        Generate response using the LLM with formatted prompt
        
        Args:
            prompt_template: The prompt template to use
            **kwargs: Arguments to format the prompt template
            
        Returns:
            str: Generated response
        """
        # Format the prompt with the provided arguments
        formatted_prompt = prompt_template.format(**kwargs)
        
        return self.invoke(formatted_prompt)
    
    def invoke(self, prompt: str, max_retries: int = 2, timeout: int = 60) -> str:
        """
        Generate response from a single prompt with retry logic, using configured settings.

        Args:
            prompt: Input prompt

        Returns:
            str: Generated response or error message.
        """
        start_time = time.time()
        max_retries = settings.LLM_MAX_RETRIES
        timeout = settings.LLM_TIMEOUT

        for attempt in range(max_retries + 1):
            try:
                logger.info(f"Invoking LLM (Provider: {settings.LLM_PROVIDER}, Attempt {attempt+1}/{max_retries+1})")

                # Check for timeout before making the call
                if time.time() - start_time > timeout:
                    logger.error(f"LLM invocation timed out after {timeout} seconds before attempt {attempt+1}.")
                    return f"Error: LLM invocation timed out after {timeout} seconds"

                # --- Core LLM Invocation ---
                # Use a timeout mechanism if the underlying Langchain model doesn't support it directly
                # For simplicity here, we rely on the overall loop timeout check.
                # More robust solutions might involve asyncio or threading for request timeouts.
                response = self.llm.invoke(prompt)
                # ---------------------------

                elapsed_time = time.time() - start_time
                logger.info(f"LLM invocation successful (Attempt {attempt+1}) in {elapsed_time:.2f} seconds.")

                # Ensure response has 'content' attribute (standard for Langchain chat models)
                if hasattr(response, 'content'):
                    return response.content
                else:
                    logger.error(f"LLM response object does not have 'content' attribute. Response: {response}")
                    return "Error: Received unexpected response format from LLM."

            except Exception as e:
                logger.error(f"Error invoking LLM (Provider: {settings.LLM_PROVIDER}, Attempt {attempt+1}/{max_retries+1}): {str(e)}")

                # If this is the last attempt, return an error message
                if attempt == max_retries:
                    error_message = f"Error generating response after {max_retries+1} attempts: {str(e)}"
                    return error_message

                # Wait before retrying (exponential backoff)
                wait_time = 2 ** attempt
                logger.info(f"Waiting {wait_time} seconds before retrying...")
                time.sleep(wait_time)
    
    def generate_with_history(self, messages: List[Dict[str, str]]) -> str:
        """
        Generate response from a list of messages
        
        Args:
            messages: List of message dictionaries with 'role' and 'content'
            
        Returns:
            str: Generated response
        """
        try:
            # Convert messages to Langchain's expected format (BaseMessage subclasses)
            formatted_messages = []
            for message in messages:
                role = message.get('role', 'user').lower() # Default to user if role is missing
                content = message.get('content', '')
                if role == 'user':
                    formatted_messages.append(HumanMessage(content=content))
                elif role == 'assistant':
                    formatted_messages.append(AIMessage(content=content))
                elif role == 'system':
                     formatted_messages.append(SystemMessage(content=content))
                else:
                    logger.warning(f"Unknown message role '{role}', treating as human message.")
                    formatted_messages.append(HumanMessage(content=content)) # Fallback

            # Invoke the LLM with the message history
            # Note: Retry logic is not applied here, but could be added similarly to invoke()
            response = self.llm.invoke(formatted_messages)

            # Ensure response has 'content' attribute
            if hasattr(response, 'content'):
                return response.content
            else:
                logger.error(f"LLM chat response object does not have 'content' attribute. Response: {response}")
                return "Error: Received unexpected response format from LLM chat."

        except Exception as e:
            logger.error(f"Error invoking LLM (Provider: {settings.LLM_PROVIDER}) with chat history: {str(e)}")
            error_message = f"Error generating response from chat history: {str(e)}"
            return error_message
    
    async def stream_generate(
        self,
        prompt: str,
        chunk_size: int = 8,
        include_metadata: bool = False,
        timeout: Optional[int] = None
    ) -> AsyncGenerator[StreamChunk, None]:
        """
        Generate streaming response from a single prompt
        
        Args:
            prompt: Input prompt
            chunk_size: Target size for word-level chunks
            include_metadata: Whether to include metadata in chunks
            timeout: Optional timeout in seconds
            
        Yields:
            StreamChunk: Individual content chunks
        """
        start_time = time.time()
        max_retries = settings.LLM_MAX_RETRIES
        actual_timeout = timeout or settings.LLM_TIMEOUT
        
        for attempt in range(max_retries + 1):
            try:
                logger.info(f"Starting LLM streaming (Provider: {settings.LLM_PROVIDER}, Attempt {attempt+1}/{max_retries+1})")
                
                # Check for timeout before making the call
                if time.time() - start_time > actual_timeout:
                    logger.error(f"LLM streaming timed out after {actual_timeout} seconds before attempt {attempt+1}")
                    raise asyncio.TimeoutError(f"LLM streaming timed out after {actual_timeout} seconds")
                
                # Create streaming task with timeout
                stream_task = asyncio.create_task(self._stream_with_chunking(
                    prompt, chunk_size, include_metadata
                ))
                
                try:
                    remaining_timeout = actual_timeout - (time.time() - start_time)
                    if remaining_timeout <= 0:
                        raise asyncio.TimeoutError("Timeout exceeded")
                    
                    async for chunk in asyncio.wait_for(stream_task, timeout=remaining_timeout):
                        yield chunk
                    
                    elapsed_time = time.time() - start_time
                    logger.info(f"LLM streaming completed successfully (Attempt {attempt+1}) in {elapsed_time:.2f} seconds")
                    return
                    
                except asyncio.TimeoutError:
                    stream_task.cancel()
                    raise
                
            except Exception as e:
                logger.error(f"Error in LLM streaming (Provider: {settings.LLM_PROVIDER}, Attempt {attempt+1}/{max_retries+1}): {str(e)}")
                
                if attempt == max_retries:
                    raise e
                
                # Wait before retrying (exponential backoff)
                wait_time = 2 ** attempt
                logger.info(f"Waiting {wait_time} seconds before retrying streaming...")
                await asyncio.sleep(wait_time)
    
    async def _stream_with_chunking(
        self,
        prompt: str,
        chunk_size: int,
        include_metadata: bool
    ) -> AsyncGenerator[StreamChunk, None]:
        """
        Internal method to handle streaming with chunking
        """
        position = 0
        accumulated_content = ""
        
        async for response_chunk in self.llm.astream(prompt):
            if hasattr(response_chunk, 'content'):
                new_content = response_chunk.content
                accumulated_content += new_content
                
                # Process content into word-level chunks
                chunks = self._create_word_chunks(
                    new_content, 
                    chunk_size, 
                    position
                )
                
                for chunk in chunks:
                    if include_metadata:
                        chunk.metadata = {
                            "provider": settings.LLM_PROVIDER,
                            "model": settings.LLM_MODEL_NAME,
                            "timestamp": time.time()
                        }
                    
                    yield chunk
                    position += chunk.length
    
    def _create_word_chunks(
        self, 
        text: str, 
        max_size: int, 
        start_position: int = 0
    ) -> List[StreamChunk]:
        """
        Create word-level chunks from text content
        
        Args:
            text: Text to chunk
            max_size: Maximum chunk size in characters
            start_position: Starting position for chunk positions
            
        Returns:
            List[StreamChunk]: List of content chunks
        """
        if not text:
            return []
        
        chunks = []
        position = start_position
        
        # Split on whitespace while preserving it
        words = text.split(' ')
        current_chunk = ""
        
        for i, word in enumerate(words):
            # Add space except for first word
            word_with_space = word if i == 0 else " " + word
            
            # If adding this word would exceed max size and we have content
            if len(current_chunk + word_with_space) > max_size and current_chunk:
                # Create chunk from current content
                is_word_boundary = current_chunk.endswith(' ') or current_chunk.endswith('\n')
                chunks.append(StreamChunk(
                    content=current_chunk,
                    position=position,
                    length=len(current_chunk),
                    is_word_boundary=is_word_boundary
                ))
                
                position += len(current_chunk)
                current_chunk = word_with_space.lstrip()
            else:
                current_chunk += word_with_space
        
        # Add remaining content
        if current_chunk:
            chunks.append(StreamChunk(
                content=current_chunk,
                position=position,
                length=len(current_chunk),
                is_word_boundary=True
            ))
        
        return chunks
    
    async def stream_generate_with_history(
        self,
        messages: List[Dict[str, str]],
        chunk_size: int = 8,
        include_metadata: bool = False,
        timeout: Optional[int] = None
    ) -> AsyncGenerator[StreamChunk, None]:
        """
        Generate streaming response from message history
        
        Args:
            messages: List of message dictionaries with 'role' and 'content'
            chunk_size: Target size for word-level chunks
            include_metadata: Whether to include metadata in chunks
            timeout: Optional timeout in seconds
            
        Yields:
            StreamChunk: Individual content chunks
        """
        try:
            # Convert messages to Langchain's expected format
            formatted_messages = []
            for message in messages:
                role = message.get('role', 'user').lower()
                content = message.get('content', '')
                if role == 'user':
                    formatted_messages.append(HumanMessage(content=content))
                elif role == 'assistant':
                    formatted_messages.append(AIMessage(content=content))
                elif role == 'system':
                    formatted_messages.append(SystemMessage(content=content))
                else:
                    logger.warning(f"Unknown message role '{role}', treating as human message")
                    formatted_messages.append(HumanMessage(content=content))
            
            # Stream with message history
            position = 0
            start_time = time.time()
            actual_timeout = timeout or settings.LLM_TIMEOUT
            
            async for response_chunk in self.llm.astream(formatted_messages):
                # Check timeout
                if time.time() - start_time > actual_timeout:
                    raise asyncio.TimeoutError(f"Streaming timed out after {actual_timeout} seconds")
                
                if hasattr(response_chunk, 'content'):
                    new_content = response_chunk.content
                    
                    # Process content into chunks
                    chunks = self._create_word_chunks(
                        new_content,
                        chunk_size,
                        position
                    )
                    
                    for chunk in chunks:
                        if include_metadata:
                            chunk.metadata = {
                                "provider": settings.LLM_PROVIDER,
                                "model": settings.LLM_MODEL_NAME,
                                "timestamp": time.time(),
                                "has_history": True
                            }
                        
                        yield chunk
                        position += chunk.length
                        
        except Exception as e:
            logger.error(f"Error in LLM streaming with history (Provider: {settings.LLM_PROVIDER}): {str(e)}")
            raise e
    
    async def stream_to_sse_events(
        self,
        prompt: str,
        stage_id: Optional[str] = None,
        target_panel: str = "reasoning",
        chunk_size: int = 8
    ) -> AsyncGenerator[SSEEvent, None]:
        """
        Stream response as SSE events for direct consumption by frontend
        
        Args:
            prompt: Input prompt
            stage_id: Optional workflow stage identifier
            target_panel: Target UI panel (reasoning or chat)
            chunk_size: Target size for word-level chunks
            
        Yields:
            SSEEvent: Formatted SSE events
        """
        try:
            # Send start event
            start_event = create_medical_stage_event(
                SSEEventType.START,
                stage_id or "streaming",
                "LLM Response Streaming",
                target_panel
            )
            yield start_event
            
            # Stream content chunks
            position = 0
            async for chunk in self.stream_generate(prompt, chunk_size):
                chunk_event = create_medical_chunk_event(
                    chunk.content,
                    position,
                    chunk.is_word_boundary,
                    stage_id
                )
                yield chunk_event
                position += chunk.length
            
            # Send end event
            end_event = create_medical_stage_event(
                SSEEventType.END,
                stage_id or "streaming",
                "LLM Response Complete",
                target_panel,
                total_chunks=position
            )
            yield end_event
            
        except Exception as e:
            logger.error(f"Error in SSE event streaming: {str(e)}")
            # Send error event
            error_event = create_sse_event(
                SSEEventType.ERROR,
                {
                    "message": str(e),
                    "stage_id": stage_id,
                    "target_panel": target_panel
                }
            )
            yield error_event
