from fastapi import APIRouter, HTTPException, status, Depends

from ...services.service_factory import get_ai_service
from ...services.ai_service import AIService, AIServiceError
from ...utils.validators.validation import validate_call_sid, validate_message_content
from ...models.request_models import MessageIn
from ...models.response_models import MessageOut


router = APIRouter(
    prefix="/chat",
    tags=["Chat"],
    responses={404: {"description": "Not found"}},
)


@router.post(
    "/",
    response_model=MessageOut,
    status_code=status.HTTP_200_OK,
    summary="Generate assistant response via LLM",
)
async def generate_chat_response(
    body: MessageIn,
    ai_service: AIService = Depends(get_ai_service)
) -> MessageOut:
    """Generate assistant response via LLM using DDD architecture."""
    # Validate input
    if not validate_call_sid(body.callSid):
        raise HTTPException(422, detail="Invalid call SID format")
    
    if not validate_message_content(body.message):
        raise HTTPException(422, detail="Message content must not be empty")

    try:
        reply = await ai_service.generate_chat_response(body.callSid, body.message)
        print(f"callSid: {body.callSid}, reply: {reply}")
        return MessageOut(replyText=reply)
    except AIServiceError as e:
        raise HTTPException(500, detail=f"AI service error: {str(e)}")
    except Exception as e:
        raise HTTPException(500, detail=f"Unexpected error: {str(e)}")


@router.post(
    "/reply",
    response_model=MessageOut,
    status_code=status.HTTP_200_OK,
    summary="Echo reply (placeholder for testing)",
)
async def echo_reply(body: MessageIn) -> MessageOut:
    """Echo reply endpoint - kept for backward compatibility and testing."""
    # Validate input
    if not validate_call_sid(body.callSid):
        raise HTTPException(422, detail="Invalid call SID format")
    
    if not validate_message_content(body.message):
        raise HTTPException(422, detail="Message content must not be empty")

    reply_text = body.message + ", Please say next i will repeat it"
    return MessageOut(replyText=reply_text)


@router.get(
    "/health",
    status_code=status.HTTP_200_OK,
    summary="Health check for chat service",
)
async def chat_health_check():
    """Health check endpoint for chat service."""
    return {"status": "healthy", "service": "chat"}


@router.post(
    "/emergency",
    response_model=MessageOut,
    status_code=status.HTTP_200_OK,
    summary="Generate emergency response via LLM",
)
async def generate_emergency_response(
    body: MessageIn,
    ai_service: AIService = Depends(get_ai_service)
) -> MessageOut:
    """Generate emergency-specific response via LLM."""
    # Validate input
    if not validate_call_sid(body.callSid):
        raise HTTPException(422, detail="Invalid call SID format")
    
    if not validate_message_content(body.message):
        raise HTTPException(422, detail="Message content must not be empty")

    try:
        # For emergency responses, we could use a different prompt template
        # or service method in the future
        reply = await ai_service.generate_chat_response(body.callSid, body.message)
        print(f"Emergency callSid: {body.callSid}, reply: {reply}")
        return MessageOut(replyText=reply)
    except AIServiceError as e:
        raise HTTPException(500, detail=f"AI service error: {str(e)}")
    except Exception as e:
        raise HTTPException(500, detail=f"Unexpected error: {str(e)}")


@router.post(
    "/customer-service",
    response_model=MessageOut,
    status_code=status.HTTP_200_OK,
    summary="Generate customer service response via LLM",
)
async def generate_customer_service_response(
    body: MessageIn,
    ai_service: AIService = Depends(get_ai_service)
) -> MessageOut:
    """Generate customer service-specific response via LLM."""
    # Validate input
    if not validate_call_sid(body.callSid):
        raise HTTPException(422, detail="Invalid call SID format")
    
    if not validate_message_content(body.message):
        raise HTTPException(422, detail="Message content must not be empty")

    try:
        # For customer service responses, we could use a different prompt template
        # or service method in the future
        reply = await ai_service.generate_chat_response(body.callSid, body.message)
        print(f"Customer service callSid: {body.callSid}, reply: {reply}")
        return MessageOut(replyText=reply)
    except AIServiceError as e:
        raise HTTPException(500, detail=f"AI service error: {str(e)}")
    except Exception as e:
        raise HTTPException(500, detail=f"Unexpected error: {str(e)}")