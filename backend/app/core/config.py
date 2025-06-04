"""
Application configuration settings
"""
import os
import secrets
from functools import lru_cache
from typing import List, Optional

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings"""
    
    # Application settings
    app_name: str = "MedhastraAI API"
    version: str = "1.0.0"
    debug: bool = Field(False, env="DEBUG")
    host: str = Field("0.0.0.0", env="HOST")
    port: int = Field(8000, env="PORT")
    
    # Legacy support for existing environment variables
    PROJECT_NAME: str = "Medhastra AI API"
    PROJECT_DESCRIPTION: str = "Medical diagnosis system using causal inference with LLMs"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api"
    
    # Supabase configuration
    supabase_url: str = Field(..., env="SUPABASE_URL")
    supabase_anon_key: str = Field(..., env="SUPABASE_ANON_KEY")
    supabase_service_role_key: str = Field(..., env="SUPABASE_SERVICE_ROLE_KEY")
    supabase_jwt_secret: str = Field(..., env="SUPABASE_JWT_SECRET")
    
    # Legacy Supabase support
    SUPABASE_URL: Optional[str] = Field(None, env="SUPABASE_URL")
    SUPABASE_JWT_SECRET: Optional[str] = Field(None, env="SUPABASE_JWT_SECRET")
    SUPABASE_SERVICE_KEY: Optional[str] = Field(None, env="SUPABASE_SERVICE_ROLE_KEY")
    
    # Database configuration (using Supabase PostgreSQL)
    database_url: Optional[str] = Field(None, env="SUPABASE_DATABASE_URL")
    database_host: str = Field("localhost", env="SUPABASE_DB_HOST")
    database_port: int = Field(5432, env="SUPABASE_DB_PORT")
    database_name: str = Field("postgres", env="SUPABASE_DB_NAME")
    database_user: str = Field("postgres", env="SUPABASE_DB_USER")
    database_password: str = Field("", env="SUPABASE_DB_PASSWORD")
    
    # Legacy database support
    DATABASE_URL: Optional[str] = Field(None, env="SUPABASE_DATABASE_URL")
    DATABASE_HOST: str = Field("localhost", env="SUPABASE_DB_HOST")
    DATABASE_PORT: int = Field(5432, env="SUPABASE_DB_PORT")
    DATABASE_NAME: str = Field("postgres", env="SUPABASE_DB_NAME")
    DATABASE_USER: str = Field("postgres", env="SUPABASE_DB_USER")
    DATABASE_PASSWORD: str = Field("", env="SUPABASE_DB_PASSWORD")
    
    # Security settings
    secret_key: str = Field(default_factory=lambda: secrets.token_urlsafe(32), env="SECRET_KEY")
    SECRET_KEY: str = Field(default_factory=lambda: secrets.token_urlsafe(32), env="SECRET_KEY")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = Field(30, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(60 * 24 * 7, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    
    # API Keys
    openai_api_key: Optional[str] = Field(None, env="OPENAI_API_KEY")
    anthropic_api_key: Optional[str] = Field(None, env="ANTHROPIC_API_KEY")
    
    # Legacy LLM configuration
    AZURE_OPENAI_API_KEY: str = Field("", env="AZURE_OPENAI_API_KEY")
    AZURE_OPENAI_API_BASE: str = Field("", env="AZURE_OPENAI_API_BASE")
    AZURE_OPENAI_API_VERSION: str = Field("2023-05-15", env="AZURE_OPENAI_API_VERSION")
    AZURE_OPENAI_DEPLOYMENT_NAME: str = Field("", env="AZURE_OPENAI_DEPLOYMENT_NAME")
    
    LLM_PROVIDER: str = Field("gemini", env="LLM_PROVIDER")
    LLM_MODEL_NAME: str = Field("gemini-2.5-pro-preview-03-25", env="LLM_MODEL_NAME")
    OPENAI_API_KEY: Optional[str] = Field(None, env="OPENAI_API_KEY")
    GOOGLE_API_KEY: Optional[str] = Field(None, env="GOOGLE_API_KEY")
    DEEPSEEK_API_KEY: Optional[str] = Field(None, env="DEEPSEEK_API_KEY")
    DEEPSEEK_API_BASE: str = Field("https://api.deepseek.com/v1", env="DEEPSEEK_API_BASE")
    
    LLM_TEMPERATURE: float = Field(0.5, env="LLM_TEMPERATURE")
    LLM_MAX_TOKENS: int = Field(4096, env="LLM_MAX_TOKENS")
    LLM_TIMEOUT: int = Field(120, env="LLM_TIMEOUT")
    LLM_MAX_RETRIES: int = Field(2, env="LLM_MAX_RETRIES")
    
    # File storage
    upload_dir: str = Field("uploads", env="UPLOAD_DIR")
    max_file_size: int = Field(10 * 1024 * 1024, env="MAX_FILE_SIZE")  # 10MB
    REPORTS_DIR: str = Field("reports", env="REPORTS_DIR")
    NOTES_DIR: str = Field("notes", env="NOTES_DIR")
    STATIC_DIR: str = Field("static", env="STATIC_DIR")
    
    # CORS settings
    allowed_origins: List[str] = Field(
        ["http://localhost:3000", "http://127.0.0.1:3000"],
        env="ALLOWED_ORIGINS"
    )
    ALLOWED_CORS_ORIGINS: List[str] = Field(
        ["http://localhost:5173"],
        env="ALLOWED_CORS_ORIGINS"
    )
    RENDER_FRONTEND_URL: Optional[str] = Field(None, env="RENDER_FRONTEND_URL")
    CUSTOM_FRONTEND_URL: Optional[str] = Field(None, env="CUSTOM_FRONTEND_URL")
    
    # Redis configuration (for caching)
    redis_url: Optional[str] = Field(None, env="REDIS_URL")
    
    # Email configuration
    email_host: Optional[str] = Field(None, env="EMAIL_HOST")
    email_port: Optional[int] = Field(None, env="EMAIL_PORT")
    email_username: Optional[str] = Field(None, env="EMAIL_USERNAME")
    email_password: Optional[str] = Field(None, env="EMAIL_PASSWORD")
    
    # Legacy email configuration
    MAIL_USERNAME: Optional[str] = Field(None, env="MAIL_USERNAME")
    MAIL_PASSWORD: Optional[str] = Field(None, env="MAIL_PASSWORD")
    MAIL_FROM: Optional[str] = Field(None, env="MAIL_FROM")
    MAIL_PORT: int = Field(587, env="MAIL_PORT")
    MAIL_SERVER: Optional[str] = Field(None, env="MAIL_SERVER")
    MAIL_FROM_NAME: str = Field("Medhastra AI Contact", env="MAIL_FROM_NAME")
    MAIL_STARTTLS: bool = Field(True, env="MAIL_STARTTLS")
    MAIL_SSL_TLS: bool = Field(False, env="MAIL_SSL_TLS")
    USE_CREDENTIALS: bool = Field(True, env="USE_CREDENTIALS")
    VALIDATE_CERTS: bool = Field(True, env="VALIDATE_CERTS")
    TEMPLATE_FOLDER: Optional[str] = Field(None, env="TEMPLATE_FOLDER")
    
    # Application-specific settings
    diagnosis_stages: List[str] = [
        "initial",
        "symptom_analysis", 
        "differential_diagnosis",
        "investigation_plan",
        "final_diagnosis"
    ]
    
    # Model configuration
    default_model: str = Field("gpt-4", env="DEFAULT_MODEL")
    max_tokens: int = Field(2000, env="MAX_TOKENS")
    temperature: float = Field(0.7, env="TEMPERATURE")
    
    # Rate limiting
    rate_limit_requests: int = Field(100, env="RATE_LIMIT_REQUESTS")
    rate_limit_window: int = Field(3600, env="RATE_LIMIT_WINDOW")  # 1 hour
    
    # Logging
    log_level: str = Field("INFO", env="LOG_LEVEL")
    log_format: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    # Legacy JWT configuration
    SUPABASE_JWT_ALGORITHMS: List[str] = ["HS256"]
    SUPABASE_JWT_AUDIENCE: str = Field("authenticated", env="SUPABASE_JWT_AUDIENCE")
    SUPABASE_ISSUER: Optional[str] = None
    
    # Legacy workflow settings
    STAGE_MAPPING: dict = {
        "initial": "Patient Info",
        "extraction": "Patient Info",
        "causal_analysis": "Patient Info",
        "validation": "Patient Info",
        "counterfactual": "Diagnosis",
        "diagnosis": "Diagnosis",
        "treatment_planning": "Treatment",
        "patient_specific": "Treatment",
        "final_plan": "Treatment",
        "complete": "Generate Note"
    }
    
    @property
    def supabase_database_url(self) -> str:
        """Construct the Supabase database URL"""
        if self.database_url:
            return self.database_url
        return (
            f"postgresql://{self.database_user}:{self.database_password}"
            f"@{self.database_host}:{self.database_port}/{self.database_name}"
        )
    
    @property
    def async_database_url(self) -> str:
        """Async database URL for SQLAlchemy"""
        return self.supabase_database_url.replace("postgresql://", "postgresql+asyncpg://")
    
    @property
    def DATABASE_URL_PSYCOPG(self) -> str:
        """Legacy support for async database URL"""
        return self.async_database_url
    
    @model_validator(mode='after')
    def validate_settings(self) -> 'Settings':
        """Validate and set derived settings"""
        # Set legacy database URL if not provided
        if not self.DATABASE_URL:
            self.DATABASE_URL = self.supabase_database_url
        
        # Set legacy Supabase settings for backward compatibility
        if not self.SUPABASE_URL:
            self.SUPABASE_URL = self.supabase_url
        if not self.SUPABASE_JWT_SECRET:
            self.SUPABASE_JWT_SECRET = self.supabase_jwt_secret
        if not self.SUPABASE_SERVICE_KEY:
            self.SUPABASE_SERVICE_KEY = self.supabase_service_role_key
        
        # Set Supabase issuer
        if self.supabase_url:
            self.SUPABASE_ISSUER = f"{self.supabase_url}/auth/v1"
        
        # Handle CORS origins
        origins = set(self.ALLOWED_CORS_ORIGINS)
        if self.RENDER_FRONTEND_URL:
            origins.add(self.RENDER_FRONTEND_URL.strip())
        if self.CUSTOM_FRONTEND_URL:
            origins.add(self.CUSTOM_FRONTEND_URL.strip())
        if origins:
            self.ALLOWED_CORS_ORIGINS = list(origins)
        
        return self
    
    class Config:
        env_file = ".env"
        case_sensitive = False
        env_prefix = ""


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()