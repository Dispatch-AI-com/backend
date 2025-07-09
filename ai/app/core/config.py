from pydantic import Field
from pydantic_settings import BaseSettings
from typing import Optional
from enum import Enum


class Environment(str, Enum):
    """Application environment."""
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"


class LLMProvider(str, Enum):
    """Supported LLM providers."""
    OPENAI = "openai"
    MOCK = "mock"


class Settings(BaseSettings):
    """Application settings."""
    
    # Environment
    environment: Environment = Environment.DEVELOPMENT
    debug: bool = Field(default=True, description="Enable debug mode")
    
    # API Configuration
    api_title: str = Field(default="AI Service API", description="API title")
    api_version: str = Field(default="1.0.0", description="API version")
    api_prefix: str = Field(default="/api", description="API prefix")
    
    # LLM Configuration
    llm_provider: LLMProvider = Field(default=LLMProvider.OPENAI, description="LLM provider")
    openai_api_key: Optional[str] = Field(default=None, description="OpenAI API key")
    openai_model: str = Field(default="gpt-4o", description="OpenAI model")
    openai_max_tokens: int = Field(default=2500, description="OpenAI max tokens")
    openai_temperature: float = Field(default=0.0, description="OpenAI temperature")
    
    # CORS Configuration
    cors_origins: list = Field(default=["*"], description="CORS allowed origins")
    cors_methods: list = Field(default=["*"], description="CORS allowed methods")
    cors_headers: list = Field(default=["*"], description="CORS allowed headers")
    
    # Security Configuration
    enable_auth: bool = Field(default=False, description="Enable authentication")
    auth_token: str = Field(default="fake-super-secret-token", description="Auth token")
    
    # Logging Configuration
    log_level: str = Field(default="INFO", description="Logging level")
    log_format: str = Field(default="%(asctime)s - %(name)s - %(levelname)s - %(message)s", description="Log format")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


# Global settings instance
settings = Settings()


def get_settings() -> Settings:
    """Get application settings."""
    return settings