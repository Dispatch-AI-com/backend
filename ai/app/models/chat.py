from pydantic import BaseModel
from typing import Optional


class ChatRequest(BaseModel):
    message: str
    callSid: Optional[str] = None


class ChatResponse(BaseModel):
    replyText: str
    timestamp: str
    duration: Optional[int] = None
