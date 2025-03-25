"""
LLM Service for handling interactions with Azure OpenAI API
"""
import logging
import time
from typing import Dict, List, Optional, Any, Union

from langchain_openai import AzureChatOpenAI
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
    Service for interacting with Azure OpenAI LLM
    """
    
    def __init__(self):
        """
        Initialize Azure OpenAI model
        """
        try:
            self.llm = AzureChatOpenAI(
                deployment_name=settings.AZURE_OPENAI_DEPLOYMENT_NAME,
                azure_endpoint=settings.AZURE_OPENAI_API_BASE,
                openai_api_key=settings.AZURE_OPENAI_API_KEY,
                openai_api_version=settings.AZURE_OPENAI_API_VERSION,
                temperature=0.5,
                max_tokens=4096
            )
            logger.info("Azure OpenAI LLM initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Azure OpenAI LLM: {str(e)}")
            raise
    
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
        Generate response from a single prompt with retry logic
        
        Args:
            prompt: Input prompt
            max_retries: Maximum number of retry attempts
            timeout: Timeout in seconds
            
        Returns:
            str: Generated response
        """
        start_time = time.time()
        
        for attempt in range(max_retries + 1):
            try:
                logger.info(f"Invoking LLM (attempt {attempt+1}/{max_retries+1})")
                
                # Check if we've exceeded the timeout
                if time.time() - start_time > timeout:
                    logger.error(f"LLM invocation timed out after {timeout} seconds")
                    return f"Error: LLM invocation timed out after {timeout} seconds"
                
                # Invoke the LLM
                response = self.llm.invoke(prompt)
                
                # Log success
                logger.info(f"LLM invocation successful (attempt {attempt+1})")
                
                return response.content
                
            except Exception as e:
                logger.error(f"Error invoking Azure OpenAI (attempt {attempt+1}/{max_retries+1}): {str(e)}")
                
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
            # Convert messages to the format expected by LangChain
            formatted_messages = []
            for message in messages:
                if message['role'] == 'user':
                    formatted_messages.append(("human", message['content']))
                elif message['role'] == 'assistant':
                    formatted_messages.append(("ai", message['content']))
                else:
                    formatted_messages.append(("system", message['content']))
            
            response = self.llm.invoke(formatted_messages)
            return response.content
        except Exception as e:
            logger.error(f"Error invoking Azure OpenAI with chat history: {str(e)}")
            error_message = f"Error generating response: {str(e)}"
            return error_message