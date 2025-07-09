from dataclasses import dataclass
from datetime import datetime
from typing import List, Optional, Dict, Any
from enum import Enum


class SpeakerType(Enum):
    AI = "AI"
    CUSTOMER = "customer"


@dataclass
class ConversationMessage:
    """Domain entity representing a message in a conversation."""
    speaker: SpeakerType
    message: str
    timestamp: datetime

    def __post_init__(self):
        if not self.message.strip():
            raise ValueError("Message content cannot be empty")

    @property
    def is_ai_message(self) -> bool:
        return self.speaker == SpeakerType.AI

    @property
    def is_customer_message(self) -> bool:
        return self.speaker == SpeakerType.CUSTOMER


@dataclass
class ServiceInfo:
    """Value object for service booking information."""
    name: str
    booked: bool = False
    additional_info: Optional[Dict[str, Any]] = None


@dataclass
class CallSummary:
    """Domain entity representing a call summary."""
    call_sid: str
    summary: str
    key_points: List[str]
    created_at: datetime
    service_info: Optional[ServiceInfo] = None

    def __post_init__(self):
        if not self.call_sid.strip():
            raise ValueError("Call SID cannot be empty")
        if not self.summary.strip():
            raise ValueError("Summary cannot be empty")
        if not self.key_points:
            raise ValueError("Key points cannot be empty")


@dataclass
class Call:
    """Domain entity representing a phone call."""
    call_sid: str
    conversation: List[ConversationMessage]
    service_info: Optional[ServiceInfo] = None
    created_at: Optional[datetime] = None
    summary: Optional[CallSummary] = None

    def __post_init__(self):
        if not self.call_sid.strip():
            raise ValueError("Call SID cannot be empty")
        if self.created_at is None:
            self.created_at = datetime.utcnow()

    @property
    def message_count(self) -> int:
        return len(self.conversation)

    @property
    def customer_messages(self) -> List[ConversationMessage]:
        return [msg for msg in self.conversation if msg.is_customer_message]

    @property
    def ai_messages(self) -> List[ConversationMessage]:
        return [msg for msg in self.conversation if msg.is_ai_message]

    def add_message(self, message: ConversationMessage) -> None:
        """Add a new message to the conversation."""
        self.conversation.append(message)

    def has_summary(self) -> bool:
        """Check if the call has a summary."""
        return self.summary is not None

    def generate_conversation_text(self) -> str:
        """Generate formatted conversation text for AI processing."""
        formatted_lines = []
        for msg in self.conversation:
            speaker_label = "Assistant" if msg.is_ai_message else "Customer"
            formatted_lines.append(f"{speaker_label}: {msg.message}")
        return "\n".join(formatted_lines)