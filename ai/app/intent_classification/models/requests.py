"""
Intent Classification Request Models

Pydantic models for API requests.
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from models.call import Message


class IntentClassificationRequest(BaseModel):
    """Request model for intent classification

    Attributes:
        callSid: Optional Twilio CallSid to fetch conversation history from Redis
        messages: Optional conversation history as list of messages
        currentMessage: The current user message to classify (required)
    """

    callSid: Optional[str] = Field(
        None,
        description="Optional CallSid to fetch history from Redis"
    )
    messages: Optional[List[Message]] = Field(
        None,
        description="Optional conversation history"
    )
    currentMessage: str = Field(
        ...,
        description="Current user message to classify"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "currentMessage": "What are your office hours?",
                "callSid": "CA1234567890abcdef1234567890abcdef"
            }
        }
