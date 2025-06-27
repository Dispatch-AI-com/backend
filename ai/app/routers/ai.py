# app/routers/ai.py
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from ..services.llm import chain  # make sure this exists and is async

router = APIRouter(
    prefix="/ai",
    tags=["AI"],
    responses={404: {"description": "Not found"}},
)


class MessageIn(BaseModel):
    callSid: str = Field(..., description="Twilio CallSid – unique call ID")
    message: str = Field(..., description="Customer utterance")


class MessageOut(BaseModel):
    replyText: str = Field(..., description="Assistant response")


@router.post(
    "/chat",
    response_model=MessageOut,
    status_code=status.HTTP_200_OK,
    summary="Generate assistant response via LLM",
)
async def chat_endpoint(body: MessageIn) -> MessageOut:
    if not body.message.strip():
        raise HTTPException(422, detail="`message` must not be empty")

    reply = await chain.ainvoke({"user_input": body.message})
    print(f"callSid: {body.callSid}, reply: {reply}")
    return MessageOut(replyText=reply)


@router.post(
    "/reply",
    response_model=MessageOut,
    status_code=status.HTTP_200_OK,
    summary="Echo reply (placeholder)",
)
async def reply_endpoint(body: MessageIn) -> MessageOut:
    replyText = body.message + ",Please say next i will repeat it"

    return MessageOut(replyText=replyText)
