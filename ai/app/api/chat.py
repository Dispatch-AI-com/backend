from fastapi import APIRouter
from datetime import datetime
from pydantic import BaseModel

router = APIRouter(prefix="/ai", tags=["chat"])


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    replyText: str
    timestamp: str
    duration: int


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Stubbed chat endpoint - returns success response"""
    return ChatResponse(
        replyText="I'm currently being updated. Please try again later.",
        timestamp=datetime.now().isoformat(),
        duration=50,
    )
