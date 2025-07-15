from pydantic import Field
from pydantic_settings import BaseSettings
from typing import Optional, List
from enum import Enum


class Environment(str, Enum):
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"


class LLMProvider(str, Enum):
    OPENAI = "openai"
    MOCK = "mock"


class Settings(BaseSettings):
    # Environment
    environment: Environment = Environment.DEVELOPMENT
    debug: bool = Field(default=True)

    # API Configuration
    api_title: str = Field(default="AI Service API")
    api_version: str = Field(default="1.0.0")
    api_prefix: str = Field(default="/api")

    # Redis Configuration
    redis_host: str = Field(default="localhost")
    redis_port: int = Field(default=6379)
    redis_db: int = Field(default=0)

    # LLM Configuration
    llm_provider: LLMProvider = Field(default=LLMProvider.OPENAI)
    openai_api_key: Optional[str] = Field(default=None)
    openai_model: str = Field(default="gpt-4o")
    openai_max_tokens: int = Field(default=2500)
    openai_temperature: float = Field(default=0.0)

    # Business Configuration - Customer Info Collection
    max_attempts: int = Field(default=3)
    service_max_attempts: int = Field(default=3)
    
    # Supported Service Types
    supported_services: List[str] = Field(default=[
        'clean', 'cleaning', 
        'garden', 'gardening', 
        'plumber', 'plumbing', 
        'electric', 'electrical', 
        'repair'
    ])
    
    # Supported Time Keywords
    supported_time_keywords: List[str] = Field(default=[
        'tomorrow', 'morning', 'afternoon', 'evening',
        'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
    ])
    
    # Name Validation Configuration
    min_name_length: int = Field(default=2)
    max_name_length: int = Field(default=50)
    
    # Phone Number Validation Configuration
    min_phone_length: int = Field(default=10)
    max_phone_length: int = Field(default=15)
    
    # Address Validation Configuration
    min_address_length: int = Field(default=5)
    max_address_length: int = Field(default=200)
    
    # Email Validation Configuration
    email_regex_pattern: str = Field(default=r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    
    # Conversation History Configuration
    max_conversation_context: int = Field(default=3)

    # CORS Configuration
    cors_origins: list = Field(default=["*"])
    cors_methods: list = Field(default=["*"])
    cors_headers: list = Field(default=["*"])

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


settings = Settings()


def get_settings() -> Settings:
    return settings
