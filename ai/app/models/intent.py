"""
Intent Classification Models

Data models for intent classification in student service conversations.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum
from models.call import Message


class IntentType(str, Enum):
    """Intent type enumeration"""
    SCAM_CALL = "scam_call"
    INQUIRY = "inquiry"
    LEAVE_MESSAGE = "leave_message"


class IntentClassificationRequest(BaseModel):
    """Request model for intent classification"""
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


class IntentClassificationResponse(BaseModel):
    """Response model for intent classification"""
    intent: IntentType = Field(
        ...,
        description="Classified intent type"
    )
    confidence: float = Field(
        ...,
        description="Confidence score between 0.0 and 1.0",
        ge=0.0,
        le=1.0
    )
    reasoning: str = Field(
        ...,
        description="Brief explanation of classification decision"
    )
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Additional classification metadata"
    )


class IntentDefinition(BaseModel):
    """Intent definition model for documentation and testing"""
    name: str = Field(..., description="Intent name")
    description: str = Field(..., description="Intent description")
    characteristics: List[str] = Field(..., description="Intent characteristics")
    positive_examples: List[str] = Field(..., description="Positive examples")
    negative_examples: List[str] = Field(..., description="Negative examples")
    keywords: List[str] = Field(..., description="Key indicator words")
