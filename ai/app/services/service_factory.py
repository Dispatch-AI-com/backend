from typing import Optional

from ..core.config import get_settings
from ..infrastructure.llm_factory import LLMFactory, LLMProvider
from ..infrastructure.llm_adapter import LLMAdapter
from .ai_service import AIService


class ServiceFactory:
    """Factory for creating application services."""

    def __init__(self):
        self.settings = get_settings()
        self._llm_adapter: Optional[LLMAdapter] = None
        self._ai_service: Optional[AIService] = None

    def get_llm_adapter(self) -> LLMAdapter:
        """Get or create LLM adapter."""
        if self._llm_adapter is None:
            if self.settings.llm_provider == "openai":
                provider = LLMProvider.OPENAI
            else:
                provider = LLMProvider.MOCK
            
            self._llm_adapter = LLMFactory.create_adapter(
                provider=provider,
                api_key=self.settings.openai_api_key
            )
        
        return self._llm_adapter

    def get_ai_service(self) -> AIService:
        """Get or create AI service."""
        if self._ai_service is None:
            llm_adapter = self.get_llm_adapter()
            self._ai_service = AIService(llm_adapter=llm_adapter)
        
        return self._ai_service

    def reset(self):
        """Reset all cached services (useful for testing)."""
        self._llm_adapter = None
        self._ai_service = None


# Global service factory instance
service_factory = ServiceFactory()


def get_ai_service() -> AIService:
    """Get AI service instance."""
    return service_factory.get_ai_service()


def get_llm_adapter() -> LLMAdapter:
    """Get LLM adapter instance."""
    return service_factory.get_llm_adapter()