"""
LLM Service for handling interactions with various Large Language Model providers using Langchain.

Supports: Azure OpenAI, OpenAI, Google Gemini, DeepSeek (via OpenAI-compatible API).
Provider selection and configuration are managed via environment variables (see config.py).
"""
import logging
import time
from typing import Dict, List, Optional, Any, Union

# Langchain Core and Provider Imports
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_openai import AzureChatOpenAI, ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
# Note: DeepSeek might require a specific package later, using ChatOpenAI for now.

from pydantic import BaseModel

from app.core.config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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
