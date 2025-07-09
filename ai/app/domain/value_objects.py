from dataclasses import dataclass
from typing import Optional
import re


@dataclass(frozen=True)
class CallSid:
    """Value object for Twilio Call SID."""
    value: str

    def __post_init__(self):
        if not self.value or not self.value.strip():
            raise ValueError("Call SID cannot be empty")
        # Basic validation for Twilio Call SID format
        if not re.match(r'^CA[a-f0-9]{32}$', self.value):
            # If it doesn't match exact format, at least check it's not empty
            if len(self.value) < 10:
                raise ValueError("Call SID must be at least 10 characters long")

    def __str__(self) -> str:
        return self.value


@dataclass(frozen=True)
class MessageContent:
    """Value object for message content."""
    value: str

    def __post_init__(self):
        if not self.value or not self.value.strip():
            raise ValueError("Message content cannot be empty")

    def __str__(self) -> str:
        return self.value.strip()

    @property
    def word_count(self) -> int:
        return len(self.value.split())

    @property
    def is_question(self) -> bool:
        return self.value.strip().endswith('?')


@dataclass(frozen=True)
class SummaryText:
    """Value object for summary text."""
    value: str

    def __post_init__(self):
        if not self.value or not self.value.strip():
            raise ValueError("Summary text cannot be empty")
        if len(self.value) > 1000:
            raise ValueError("Summary text cannot exceed 1000 characters")

    def __str__(self) -> str:
        return self.value.strip()

    @property
    def word_count(self) -> int:
        return len(self.value.split())


@dataclass(frozen=True)
class KeyPoint:
    """Value object for a key point in a summary."""
    value: str

    def __post_init__(self):
        if not self.value or not self.value.strip():
            raise ValueError("Key point cannot be empty")
        if len(self.value) > 200:
            raise ValueError("Key point cannot exceed 200 characters")

    def __str__(self) -> str:
        return self.value.strip()


@dataclass(frozen=True)
class AIPrompt:
    """Value object for AI prompts."""
    value: str
    context: Optional[str] = None

    def __post_init__(self):
        if not self.value or not self.value.strip():
            raise ValueError("AI prompt cannot be empty")

    def __str__(self) -> str:
        return self.value

    def with_context(self, context: str) -> 'AIPrompt':
        """Create a new AIPrompt with additional context."""
        return AIPrompt(value=self.value, context=context)

    def format_with_context(self) -> str:
        """Format prompt with context if available."""
        if self.context:
            return f"{self.context}\n\n{self.value}"
        return self.value