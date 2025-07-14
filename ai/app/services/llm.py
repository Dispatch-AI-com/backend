from openai import AsyncOpenAI
import json
from typing import Optional
from config import get_settings

settings = get_settings()


class LLMService:
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



    async def generate_summary_with_prompt(self, prompt: str) -> dict:
        """Generate summary using a custom prompt format."""
        if settings.llm_provider == "mock":
            return {
                "summary": "Mock conversation summary with new prompt format",
                "keyPoints": ["Mock key point 1", "Mock key point 2"],
            }

        if self.client is None:
            raise Exception("LLM client not initialized")

        try:
            response = await self.client.chat.completions.create(
                model=settings.openai_model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=settings.openai_max_tokens,
                temperature=settings.openai_temperature,
            )

            content = response.choices[0].message.content
            if content is None:
                raise Exception("Empty response from LLM")

            # Try to parse JSON response, fallback to structured format
            try:
                result = json.loads(content)
                # Convert keyPoints to key_points for consistency with existing code
                if "keyPoints" in result and "key_points" not in result:
                    result["key_points"] = result["keyPoints"]
                return result
            except json.JSONDecodeError:
                # Fallback to basic structure if JSON parsing fails
                return {
                    "summary": content,
                    "key_points": ["Key point extracted from AI response"],
                }
        except Exception as e:
            raise Exception(f"Summary generation error: {str(e)}")


llm_service = LLMService()
