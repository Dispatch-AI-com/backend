from pydantic import Field
from pydantic_settings import BaseSettings
from typing import Optional
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

    # LLM Configuration
    llm_provider: LLMProvider = Field(default=LLMProvider.OPENAI)
    openai_api_key: Optional[str] = Field(default=None)
    openai_model: str = Field(default="gpt-4o")
    openai_max_tokens: int = Field(default=2500)
    openai_temperature: float = Field(default=0.0)

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
