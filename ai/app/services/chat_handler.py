from openai import AsyncOpenAI
import json
from typing import Optional
from config import get_settings

settings = get_settings()


class ChatHandler:
    def __init__(self):
        if settings.llm_provider == "openai":
            self.client = AsyncOpenAI(api_key=settings.openai_api_key)
        else:
            self.client = None

    async def chat(self, message: str, context: Optional[str] = None) -> str:
        if settings.llm_provider == "mock":
            return f"Mock response to: {message}"

        if self.client is None:
            raise Exception("LLM client not initialized")

        try:
            prompt = message
            if context:
                prompt = f"Context: {context}\n\nUser: {message}"

            response = await self.client.chat.completions.create(
                model=settings.openai_model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=settings.openai_max_tokens,
                temperature=settings.openai_temperature,
            )
            content = response.choices[0].message.content
            if content is None:
                raise Exception("Empty response from LLM")
            return content
        except Exception as e:
            raise Exception(f"LLM service error: {str(e)}")






chat_handler = ChatHandler()
