"""
Configuration settings for the FastAPI application
"""
import os
import secrets
from typing import List

from pydantic import AnyHttpUrl, field_validator
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
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]
    
    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: str | List[str]) -> List[str]:
        """
        Parse CORS origins list from string (for environment variables) or list
        """
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                # Try to parse as JSON
                import json
                try:
                    return json.loads(v)
                except:
                    pass
            # Simple string case
            return [item.strip() for item in v.split(",")]
        elif isinstance(v, list):
            return v
        return ["http://localhost:3000"]  # Default fallback
    
    # LLM Service
    AZURE_OPENAI_API_KEY: str = os.getenv("AZURE_OPENAI_API_KEY", "")
    AZURE_OPENAI_API_BASE: str = os.getenv("AZURE_OPENAI_API_BASE", "")
    AZURE_OPENAI_API_VERSION: str = os.getenv("AZURE_OPENAI_API_VERSION", "2023-05-15")
    AZURE_OPENAI_DEPLOYMENT_NAME: str = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME", "")
    
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