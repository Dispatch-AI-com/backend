from fastapi import APIRouter, HTTPException, status, Depends

from ...services.service_factory import get_ai_service
from ...services.ai_service import AIService, AIServiceError
from ...utils.validators.validation import validate_call_sid, validate_conversation_data
from ...models.request_models import SummaryIn
from ...models.response_models import SummaryOut


router = APIRouter(
    prefix="/summary",
    tags=["Call Summary"],
    responses={404: {"description": "Not found"}},
)


@router.post(
    "/",
    response_model=SummaryOut,
    status_code=status.HTTP_200_OK,
    summary="Generate AI-powered call summary from conversation data",
)
async def generate_call_summary(
    body: SummaryIn,
    ai_service: AIService = Depends(get_ai_service)
) -> SummaryOut:
    """Generate AI-powered call summary using DDD architecture."""
    # Validate input
    if not validate_call_sid(body.callSid):
        raise HTTPException(422, detail="Invalid call SID format")
    
    # Convert Pydantic models to dictionaries for service layer
    conversation_data = [
        {
            "speaker": msg.speaker,
            "message": msg.message,
            "timestamp": msg.timestamp
        }
        for msg in body.conversation
    ]
    
    if not validate_conversation_data(conversation_data):
        raise HTTPException(422, detail="Invalid conversation data format")

    try:
        summary = await ai_service.generate_call_summary(
            call_sid=body.callSid,
            conversation_data=conversation_data,
            service_info=body.serviceInfo
        )
        
        return SummaryOut(
            summary=summary.summary,
            keyPoints=summary.key_points,
            sentiment="neutral",  # 默认值，可以后续从 AI 分析中获取
            actionItems=[]  # 默认值，可以后续从 AI 分析中获取
        )
    except ValueError as e:
        raise HTTPException(422, detail=str(e))
    except AIServiceError as e:
        raise HTTPException(500, detail=f"AI service error: {str(e)}")
    except Exception as e:
        print(f"Error generating AI summary for {body.callSid}: {str(e)}")
        raise HTTPException(500, detail=f"Unexpected error: {str(e)}")


@router.get(
    "/health",
    status_code=status.HTTP_200_OK,
    summary="Health check for call summary service",
)
async def summary_health_check():
    """Health check endpoint for call summary service."""
    return {"status": "healthy", "service": "call_summary"}