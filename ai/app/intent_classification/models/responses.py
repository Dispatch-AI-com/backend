"""
Intent Classification Response Models

Pydantic models for API responses.
"""

from pydantic import BaseModel, Field
from typing import Dict, Any, List
from .intent_types import IntentType


class IntentClassificationResponse(BaseModel):
    """Response model for intent classification

    Attributes:
        intent: Classified intent type (scam/faq/other)
        confidence: Confidence score between 0.0 and 1.0
        reasoning: Brief explanation of classification decision
        metadata: Additional classification metadata (keywords, characteristics)
    """

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

    class Config:
        json_schema_extra = {
            "example": {
                "intent": "faq",
                "confidence": 0.92,
                "reasoning": "Student asking about office hours, simple FAQ question",
                "metadata": {
                    "matched_keywords": ["office hours"],
                    "matched_characteristics": ["Asking about office hours or availability"]
                }
            }
        }


class IntentDefinition(BaseModel):
    """Intent definition model for documentation and testing

    Attributes:
        name: Intent name (scam/faq/other)
        description: Intent description
        characteristics: List of characteristics that define this intent
        positive_examples: Examples that should be classified as this intent
        negative_examples: Examples that should NOT be classified as this intent
        keywords: Key indicator words for this intent
    """

    name: str = Field(..., description="Intent name")
    description: str = Field(..., description="Intent description")
    characteristics: List[str] = Field(..., description="Intent characteristics")
    positive_examples: List[str] = Field(..., description="Positive examples")
    negative_examples: List[str] = Field(..., description="Negative examples")
    keywords: List[str] = Field(..., description="Key indicator words")

    class Config:
        json_schema_extra = {
            "example": {
                "name": "faq",
                "description": "Common student questions that can be answered by FAQ system",
                "characteristics": [
                    "Asking about office hours or availability",
                    "Inquiring about enrollment deadlines"
                ],
                "positive_examples": [
                    "What are your office hours?",
                    "When is the enrollment deadline?"
                ],
                "negative_examples": [
                    "I want to leave a message",
                    "Transfer money immediately"
                ],
                "keywords": [
                    "office hours",
                    "deadline",
                    "tuition"
                ]
            }
        }
