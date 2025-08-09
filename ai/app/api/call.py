from fastapi import APIRouter
from pydantic import BaseModel, Field
from datetime import datetime, timezone

router = APIRouter(
    prefix="/ai",
    tags=["AI"],
    responses={404: {"description": "Not found"}},
)


# Simple message model
class Message(BaseModel):
    speaker: str
    message: str
    startedAt: str

# AI conversation input model
class ConversationInput(BaseModel):
    callSid: str = Field(..., description="Twilio CallSid – unique call ID")
    customerMessage: Message = Field(..., description="Customer message object")


# Simple reply input model (for telephony service)
class ReplyInput(BaseModel):
    callSid: str = Field(..., description="Twilio CallSid – unique call ID")
    message: str = Field(..., description="User message text")


@router.post("/conversation")
async def ai_conversation(data: ConversationInput):
    """Stubbed AI conversation endpoint - returns success response"""
    ai_response = {
        "speaker": "AI",
        "message": "I'm currently being updated. Please try again later.",
        "startedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    }
    return {"aiResponse": ai_response}


@router.post("/reply")
async def ai_reply(data: ReplyInput):
    """Stubbed AI reply endpoint - returns simple response"""
    return {"replyText": "I'm currently being updated. Please try again later."}
