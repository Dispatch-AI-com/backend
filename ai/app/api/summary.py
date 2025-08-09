from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Any

router = APIRouter(prefix="/ai", tags=["ai-summary"])


class ConversationMessage(BaseModel):
    speaker: str
    message: str
    timestamp: str


class SummaryRequest(BaseModel):
    callSid: str
    conversation: List[ConversationMessage]
    serviceInfo: Dict[str, Any]


class SummaryResponse(BaseModel):
    summary: str
    keyPoints: List[str]


@router.post("/summary", response_model=SummaryResponse)
async def generate_ai_summary(request: SummaryRequest):
    """Stubbed summary endpoint - returns basic response"""
    return SummaryResponse(
        summary="Summary generation is temporarily unavailable.",
        keyPoints=["Service is being updated"]
    )
