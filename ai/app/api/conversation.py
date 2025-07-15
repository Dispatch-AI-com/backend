from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from ..models import Message, CallSkeleton
from ..infrastructure.redis_client import get_call_skeleton
from ..services.chatr2v3 import CustomerServiceLangGraph
from datetime import datetime

router = APIRouter(
    prefix="/ai",
    tags=["AI"],
    responses={404: {"description": "Not found"}},
)

# AI conversation input model
class ConversationInput(BaseModel):
    callSid: str = Field(..., description="Twilio CallSid – unique call ID")
    customerMessage: Message = Field(..., description="Customer message object")

# Global customer service agent
cs_agent = CustomerServiceLangGraph()

@router.post("/conversation")
async def ai_conversation(data: ConversationInput):
    """AI conversation dispatch endpoint
    
    Pure API endpoint responsible for:
    1. Receiving frontend requests
    2. Getting and converting CallSkeleton data
    3. Calling unified workflow processing
    4. Returning AI response
    
    All business logic is delegated to chatr2v3 module.
    """
    # 1. Get CallSkeleton data
    try:
        callskeleton_dict = get_call_skeleton(data.callSid)
        callskeleton = CallSkeleton.parse_obj(callskeleton_dict)
    except Exception:
        raise HTTPException(status_code=404, detail="CallSkeleton not found")
    
    # 2. Construct AI workflow state
    state = {
        "name": callskeleton.user.userInfo.get("name"),
        "phone": callskeleton.user.userInfo.get("phone"),
        "address": callskeleton.user.userInfo.get("address"),
        "email": callskeleton.user.userInfo.get("email"),
        "service": callskeleton.user.service.name if callskeleton.user.service else None,
        "service_time": callskeleton.user.serviceBookedTime,
        "current_step": "collect_name",
        "name_attempts": 0,
        "phone_attempts": 0,
        "address_attempts": 0,
        "email_attempts": 0,
        "service_attempts": 0,
        "time_attempts": 0,
        "max_attempts": 3,
        "service_max_attempts": 3,
        "conversation_history": [],
        "last_user_input": data.customerMessage.message,
        "last_llm_response": None,
        "name_complete": bool(callskeleton.user.userInfo.get("name")),
        "phone_complete": bool(callskeleton.user.userInfo.get("phone")),
        "address_complete": bool(callskeleton.user.userInfo.get("address")),
        "email_complete": bool(callskeleton.user.userInfo.get("email")),
        "service_complete": bool(callskeleton.user.service),
        "time_complete": bool(callskeleton.user.serviceBookedTime),
        "conversation_complete": callskeleton.servicebooked,
        "service_available": True,
        "time_available": True,
        "name_timestamp": None,
        "phone_timestamp": None,
        "address_timestamp": None,
        "email_timestamp": None,
        "service_timestamp": None,
        "time_timestamp": None,
    }
    
    # 3. Restore conversation history
    for msg in callskeleton.history:
        state["conversation_history"].append({
            "role": "user" if msg.speaker == "customer" else "assistant",
            "content": msg.message,
            "timestamp": msg.startedAt
        })
    
    # 4. Add current user input to conversation history
    state["conversation_history"].append({
        "role": "user",
        "content": data.customerMessage.message,
        "timestamp": data.customerMessage.startedAt
    })
    state["last_user_input"] = data.customerMessage.message

    # 5. Call unified workflow processing - all business logic delegated to chatr2v3
    updated_state = cs_agent.process_customer_workflow(state, call_sid=data.callSid)

    # 6. Generate AI response
    ai_message = updated_state["last_llm_response"]["response"] if updated_state["last_llm_response"] else "Sorry, system is busy, please try again later."
    ai_response = {
        "speaker": "AI",
        "message": ai_message,
        "startedAt": datetime.utcnow().isoformat() + "Z"
    }

    # 7. Return AI response
    # Note: Customer information and conversation history are updated in Redis in real-time through workflow
    return {
        "aiResponse": ai_response
    }