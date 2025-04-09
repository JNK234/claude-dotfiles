"""
Configuration settings for the FastAPI application
"""
import os
import secrets
from typing import List, Optional # Remove Self import

from pydantic import AnyHttpUrl, model_validator # Import model_validator
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """
    Application configuration settings
    """
    # General info
    PROJECT_NAME: str = "InferenceMD API"
    PROJECT_DESCRIPTION: str = "Medical diagnosis system using causal inference with LLMs"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", secrets.token_urlsafe(32))
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    ALGORITHM: str = "HS256"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./inferenceMD.db")
    
    # CORS - Renamed field to avoid auto-parsing conflicts
    # Default CORS origins (used if RENDER_FRONTEND_URL is not set)
    ALLOWED_CORS_ORIGINS: List[str] = ["http://localhost:3000"] 
    # Field to capture the frontend URL from Render environment variable (set via render.yaml)
    RENDER_FRONTEND_URL: Optional[str] = None 
    # Field to capture the custom frontend URL (set manually in Render Env Vars)
    CUSTOM_FRONTEND_URL: Optional[str] = None 
    
    @model_validator(mode='after')
    def set_allowed_cors_origins(self) -> 'Settings': # Use string literal for forward reference
        """
        Constructs the ALLOWED_CORS_ORIGINS list based on Render-provided
        and custom URLs from environment variables.
        """
        origins = set() # Use a set to avoid duplicates
        
        # Add default localhost for local development (optional, can be removed if not needed)
        # origins.add("http://localhost:3000") 

        # Add Render's dynamic URL if available
        if self.RENDER_FRONTEND_URL:
            cleaned_render_url = self.RENDER_FRONTEND_URL.strip()
            if cleaned_render_url:
                origins.add(cleaned_render_url)
        
        # Add the custom domain URL if available
        if self.CUSTOM_FRONTEND_URL:
            cleaned_custom_url = self.CUSTOM_FRONTEND_URL.strip()
            if cleaned_custom_url:
                origins.add(cleaned_custom_url)

        # If any origins were added, use them. Otherwise, keep the default.
        if origins:
            self.ALLOWED_CORS_ORIGINS = list(origins)
        # If neither RENDER_FRONTEND_URL nor CUSTOM_FRONTEND_URL were set, 
        # ALLOWED_CORS_ORIGINS will retain its class-level default ["http://localhost:3000"]
            
        return self

    # LLM Service
    # --- Existing Azure OpenAI Settings (Unchanged) ---
    AZURE_OPENAI_API_KEY: str = os.getenv("AZURE_OPENAI_API_KEY", "")
    AZURE_OPENAI_API_BASE: str = os.getenv("AZURE_OPENAI_API_BASE", "")
    AZURE_OPENAI_API_VERSION: str = os.getenv("AZURE_OPENAI_API_VERSION", "2023-05-15")
    AZURE_OPENAI_DEPLOYMENT_NAME: str = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME", "") # Specific deployment for Azure

    # --- New Multi-Provider LLM Configuration ---
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "azure").lower() # 'azure', 'openai', 'gemini', 'deepseek'
    # LLM_MODEL_NAME is used for non-Azure providers. Azure uses AZURE_OPENAI_DEPLOYMENT_NAME.
    LLM_MODEL_NAME: str = os.getenv("LLM_MODEL_NAME", "gpt-4") # e.g., "gpt-4", "gemini-pro", "deepseek-chat"

    # --- Provider Specific API Keys & Settings ---
    # OpenAI
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")

    # Google Gemini
    GOOGLE_API_KEY: Optional[str] = os.getenv("GOOGLE_API_KEY")

    # DeepSeek (Assuming OpenAI-compatible API structure)
    DEEPSEEK_API_KEY: Optional[str] = os.getenv("DEEPSEEK_API_KEY")
    DEEPSEEK_API_BASE: Optional[str] = os.getenv("DEEPSEEK_API_BASE", "https://api.deepseek.com/v1") # Verify actual endpoint

    # --- General LLM Parameters ---
    LLM_TEMPERATURE: float = float(os.getenv("LLM_TEMPERATURE", 0.5))
    LLM_MAX_TOKENS: int = int(os.getenv("LLM_MAX_TOKENS", 4096))
    LLM_TIMEOUT: int = int(os.getenv("LLM_TIMEOUT", 120)) # Increased default timeout
    LLM_MAX_RETRIES: int = int(os.getenv("LLM_MAX_RETRIES", 2))

    # File Storage
    REPORTS_DIR: str = os.getenv("REPORTS_DIR", "reports")
    NOTES_DIR: str = os.getenv("NOTES_DIR", "notes")
    
    # Static files
    STATIC_DIR: str = os.getenv("STATIC_DIR", "static")
    
    # Workflow settings
    # Map 9 backend stages to 4 frontend stages
    STAGE_MAPPING: dict = {
        # Backend stage -> Frontend stage
        "initial": "Patient Info",
        "extraction": "Patient Info",
        "causal_analysis": "Patient Info",
        "validation": "Patient Info",
        "counterfactual": "Diagnosis",
        "diagnosis": "Diagnosis",
        "treatment_planning": "Treatment",
        "patient_specific": "Treatment",
        "final_plan": "Treatment",
        # Special case for report generation
        "complete": "Generate Note"
    }
    
    class Config:
        case_sensitive = True
        env_file = ".env"

# Initialize settings
settings = Settings()
