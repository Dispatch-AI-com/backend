from fastapi import APIRouter, HTTPException
from datetime import datetime
import time
from models.chat import ChatRequest, ChatResponse
from services.llm_service import llm_service

router = APIRouter(prefix="/ai", tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        start_time = time.time()

        response_text = await llm_service.generate_response(request.message)

        duration = int((time.time() - start_time) * 1000)

        return ChatResponse(
            replyText=response_text,
            timestamp=datetime.now().isoformat(),
            duration=duration,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
