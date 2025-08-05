from pydantic import Field
from pydantic_settings import BaseSettings
from typing import Optional, List


class Settings(BaseSettings):
    # Environment
    environment: str = Field(default="development")
    debug: bool = Field(default=True)

    # API Configuration
    api_title: str = Field(default="AI Service API")
    api_version: str = Field(default="1.0.0")
    api_prefix: str = Field(default="/api")

    # Redis Configuration
    redis_host: str = Field(default="localhost")
    redis_port: int = Field(default=6379)
    redis_db: int = Field(default=0)
    redis_url: Optional[str] = Field(default=None)
    redis_socket_timeout: int = Field(default=5)

    # LLM Configuration
    llm_provider: str = Field(default="openai")
    openai_api_key: Optional[str] = Field(default=None)
    openai_model: str = Field(default="gpt-4.1-mini")
    openai_max_tokens: int = Field(default=2500)
    openai_temperature: float = Field(default=0.0)

    # Business Configuration - Customer Info Collection
    max_attempts: int = Field(default=3)
    service_max_attempts: int = Field(default=3)

    # Supported Service Types
    supported_services: List[str] = Field(
        default=[
            "clean",
            "cleaning",
            "garden",
            "gardening",
            "plumber",
            "plumbing",
            "electric",
            "electrical",
            "repair",
        ]
    )

    # Supported Time Keywords
    supported_time_keywords: List[str] = Field(
        default=[
            "tomorrow",
            "morning",
            "afternoon",
            "evening",
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
            "sunday",
        ]
    )

    # Conversation History Configuration
    max_conversation_context: int = Field(default=3)

    # CORS Configuration
    cors_origins: list = Field(default=["*"])
    cors_methods: list = Field(default=["*"])
    cors_headers: list = Field(default=["*"])


settings = Settings()


def get_settings() -> Settings:
    return settings
