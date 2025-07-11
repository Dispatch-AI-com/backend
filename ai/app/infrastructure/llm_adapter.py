from abc import ABC, abstractmethod
from typing import Optional
from dotenv import load_dotenv
import os

from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import PromptTemplate
from pydantic import SecretStr

from ..domain.value_objects import AIPrompt


class LLMAdapter(ABC):
    """Abstract base class for LLM adapters."""

    @abstractmethod
    async def generate_response(self, prompt: AIPrompt) -> str:
        """Generate a response from the LLM."""
        pass

    @abstractmethod
    async def generate_chat_response(self, user_input: str) -> str:
        """Generate a chat response from the LLM."""
        pass


class OpenAILLMAdapter(LLMAdapter):
    """OpenAI LLM adapter using LangChain."""

    def __init__(self, api_key: Optional[str] = None):
        load_dotenv()
        api_key_value = api_key or os.getenv("OPENAI_API_KEY")
        if not api_key_value:
            raise ValueError("OpenAI API key is required")
        self.api_key = SecretStr(api_key_value)
        
        self.llm = ChatOpenAI(
            api_key=self.api_key.get_secret_value(),  # type: ignore
            model="gpt-4o",
            streaming=False,
            temperature=0.0
        )
        
        self.parser = StrOutputParser()
        
        # Default chat prompt template
        self.chat_prompt = PromptTemplate(
            input_variables=["user_input"],
            template="你是一个 AI 助手，用户输入：{user_input}\n请给出简洁明了的回复：",
        )
        
        # Create the chat chain
        self.chat_chain = self.chat_prompt | self.llm | self.parser

    async def generate_response(self, prompt: AIPrompt) -> str:
        """Generate a response from the LLM using a custom prompt."""
        try:
            # Create a temporary prompt template for this specific request
            temp_prompt = PromptTemplate(
                input_variables=["content"],
                template="{content}",
            )
            
            chain = temp_prompt | self.llm | self.parser
            response = await chain.ainvoke({"content": prompt.format_with_context()})
            return response
        except Exception as e:
            raise LLMAdapterError(f"Failed to generate LLM response: {str(e)}")

    async def generate_chat_response(self, user_input: str) -> str:
        """Generate a chat response from the LLM."""
        try:
            if not user_input.strip():
                raise ValueError("User input cannot be empty")
            
            response = await self.chat_chain.ainvoke({"user_input": user_input})
            return response
        except Exception as e:
            raise LLMAdapterError(f"Failed to generate chat response: {str(e)}")


class LLMAdapterError(Exception):
    """Exception raised by LLM adapters."""
    pass


class MockLLMAdapter(LLMAdapter):
    """Mock LLM adapter for testing."""

    def __init__(self, mock_response: str = "Mock response"):
        self.mock_response = mock_response

    async def generate_response(self, prompt: AIPrompt) -> str:
        """Return mock response."""
        return self.mock_response

    async def generate_chat_response(self, user_input: str) -> str:
        """Return mock chat response."""
        return f"Mock reply to: {user_input}"