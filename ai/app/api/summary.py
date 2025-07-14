from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from ..services.call_summary import summary_service

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
    """Generate AI-powered call summary - compatible with telephony service."""
    try:
        # Convert conversation messages to simple format
        conversation_data = [
            {"speaker": msg.speaker, "message": msg.message, "timestamp": msg.timestamp}
            for msg in request.conversation
        ]

        summary_result = await summary_service.generate_summary(
            call_sid=request.callSid,
            conversation_data=conversation_data,
            service_info=request.serviceInfo,
        )

        return SummaryResponse(
            summary=summary_result["summary"],
            keyPoints=summary_result.get(
                "key_points", summary_result.get("keyPoints", [])
            ),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
