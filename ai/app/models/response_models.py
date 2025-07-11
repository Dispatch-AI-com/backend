from typing import List
from pydantic import BaseModel, Field


class MessageOut(BaseModel):
    """Chat message output model."""
    replyText: str = Field(..., description="Assistant response")


class SummaryOut(BaseModel):
    """Summary generation output model."""
    summary: str = Field(..., description="Generated conversation summary")
    keyPoints: List[str] = Field(..., description="Key points from the conversation")
    sentiment: str = Field(..., description="Overall conversation sentiment")
    actionItems: List[str] = Field(..., description="Required follow-up actions")