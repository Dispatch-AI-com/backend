from typing import List, Dict, Any
from pydantic import BaseModel, Field


class MessageIn(BaseModel):
    """Chat message input model."""
    callSid: str = Field(..., description="Twilio CallSid – unique call ID")
    message: str = Field(..., description="Customer utterance")


class ConversationMessage(BaseModel):
    """Individual conversation message."""
    speaker: str = Field(..., description="Speaker type: AI or customer")
    message: str = Field(..., description="Message content")
    timestamp: str = Field(..., description="Message timestamp")


class SummaryIn(BaseModel):
    """Summary generation input model."""
    callSid: str = Field(..., description="Twilio CallSid – unique call ID")
    conversation: List[ConversationMessage] = Field(
        ..., description="Full conversation history"
    )
    serviceInfo: Dict[str, Any] = Field(default={}, description="Service booking information")