from typing import Optional
from enum import Enum

from .llm_adapter import LLMAdapter, OpenAILLMAdapter, MockLLMAdapter


class LLMProvider(Enum):
    """Supported LLM providers."""
    OPENAI = "openai"
    MOCK = "mock"


class LLMFactory:
    """Factory for creating LLM adapters."""

    @staticmethod
    def create_adapter(
        provider: LLMProvider,
        api_key: Optional[str] = None,
        **kwargs
    ) -> LLMAdapter:
        """Create an LLM adapter based on the provider."""
        
        if provider == LLMProvider.OPENAI:
            return OpenAILLMAdapter(api_key=api_key)
        elif provider == LLMProvider.MOCK:
            mock_response = kwargs.get("mock_response", "Mock response")
            return MockLLMAdapter(mock_response=mock_response)
        else:
            raise ValueError(f"Unsupported LLM provider: {provider}")

    @staticmethod
    def create_default_adapter(api_key: Optional[str] = None) -> LLMAdapter:
        """Create the default LLM adapter (OpenAI)."""
        return LLMFactory.create_adapter(LLMProvider.OPENAI, api_key=api_key)