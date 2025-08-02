from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, ValidationError
from models.call import Message, CallSkeleton
from services.redis_service import get_call_skeleton
from services.call_handler import CustomerServiceLangGraph
from custom_types import CustomerServiceState
from datetime import datetime, timezone

router = APIRouter(
    prefix="/ai",
    tags=["AI"],
    responses={404: {"description": "Not found"}},
)


# AI conversation input model
class ConversationInput(BaseModel):
    callSid: str = Field(..., description="Twilio CallSid – unique call ID")
    customerMessage: Message = Field(..., description="Customer message object")


# Simple reply input model (for telephony service)
class ReplyInput(BaseModel):
    callSid: str = Field(..., description="Twilio CallSid – unique call ID")
    message: str = Field(..., description="User message text")


# Global customer service agent
cs_agent = CustomerServiceLangGraph()


@router.post("/conversation")
async def ai_conversation(data: ConversationInput):
    """AI conversation dispatch endpoint - Updated for 8-step workflow

    Pure API endpoint responsible for:
    1. Receiving frontend requests
    2. Getting and converting CallSkeleton data
    3. Calling unified workflow processing
    4. Returning AI response

    All business logic is delegated to call_handler module.
    """
    # 1. Get CallSkeleton data
    try:
        callskeleton_dict = get_call_skeleton(data.callSid)
        callskeleton = CallSkeleton.model_validate(callskeleton_dict)
    except ValueError:
        # Redis中没找到CallSkeleton - 业务逻辑错误，不是资源不存在
        raise HTTPException(status_code=422, detail="CallSkeleton not found")
    except ValidationError as e:
        # 数据格式错误
        raise HTTPException(
            status_code=400, detail=f"Invalid CallSkeleton data format: {str(e)}"
        )
    except Exception as e:
        # 其他服务器错误
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

    # 2. Construct AI workflow state - 5-step workflow
    user_info = callskeleton.user.userInfo if callskeleton.user.userInfo else None

    # Extract service information from CallSkeleton
    current_service = callskeleton.user.service
    available_services = [
        {
            "id": svc.id,
            "name": svc.name,
            "price": svc.price,
            "description": svc.description,
        }
        for svc in callskeleton.services
    ]

    print(f"🔍 Available services: {len(available_services)} services")
    print(
        f"🔍 Current selected service: {current_service.name if current_service else 'None'}"
    )

    # Convert message history to the format expected by extractors
    message_history = []
    if callskeleton.history:
        for msg in callskeleton.history[-8:]:  # Last 8 messages for context
            message_history.append({
                "role": "user" if msg.speaker == "customer" else "assistant",
                "content": msg.message
            })
    
    state: CustomerServiceState = {
        "name": user_info.name if user_info else None,
        "phone": user_info.phone if user_info else None,
        "address": user_info.address if user_info else None,
        "service": current_service.name if current_service else None,
        "service_id": current_service.id if current_service else None,
        "service_price": current_service.price if current_service else None,
        "service_description": current_service.description if current_service else None,
        "available_services": available_services,
        "service_time": callskeleton.user.serviceBookedTime,
        "current_step": "collect_name",
        "name_attempts": 0,
        "phone_attempts": 0,
        "address_attempts": 0,
        "service_attempts": 0,
        "time_attempts": 0,
        "max_attempts": 3,
        "service_max_attempts": 3,
        "last_user_input": data.customerMessage.message,
        "last_llm_response": None,
        "name_complete": bool(user_info.name if user_info else None),
        "phone_complete": bool(user_info.phone if user_info else None),
        "address_complete": bool(user_info.address if user_info else None),
        "service_complete": bool(callskeleton.user.service),
        "time_complete": bool(callskeleton.user.serviceBookedTime),
        "conversation_complete": callskeleton.servicebooked,
        "service_available": True,
        "time_available": True,
        "message_history": message_history,  # Add message history to state
    }

    # 3. Set current user input
    state["last_user_input"] = data.customerMessage.message

    # 4. Call unified workflow processing - all business logic delegated to call_handler
    updated_state = await cs_agent.process_customer_workflow(state, call_sid=data.callSid)

    # 5. Generate AI response
    ai_message = (
        updated_state["last_llm_response"]["response"]
        if updated_state["last_llm_response"]
        else "Sorry, system is busy, please try again later."
    )
    ai_response = {
        "speaker": "AI",
        "message": ai_message,
        "startedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    }

    # 6. Check if conversation is complete to signal hangup
    should_hangup = updated_state.get("conversation_complete", False)

    # 7. Return AI response with hangup signal if conversation is complete
    response_data = {"aiResponse": ai_response}

    if should_hangup:
        response_data["shouldHangup"] = True

    return response_data


@router.post("/reply")
async def ai_reply(data: ReplyInput):
    """Simple AI reply endpoint for telephony service - Updated for 8-step workflow

    This endpoint provides a simplified interface that matches
    what the telephony service expects:
    - Input: { callSid, message }
    - Output: { replyText }
    """
    # Convert simple input to our internal format
    customer_message = Message(
        speaker="customer",
        message=data.message,
        startedAt=datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    )

    # Use the existing conversation logic
    conversation_data = ConversationInput(
        callSid=data.callSid, customerMessage=customer_message
    )

    # Call the main conversation handler
    result = await ai_conversation(conversation_data)

    # Return in format expected by telephony service
    return {"replyText": result["aiResponse"]["message"]}
