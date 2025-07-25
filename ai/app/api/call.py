from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, ValidationError
from app.models.call import Message, CallSkeleton, Address
from app.services.redis_service import get_call_skeleton
from app.services.call_handler import CustomerServiceLangGraph, CustomerServiceState
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

def _extract_address_components_from_redis(user_info) -> dict:
    """Extract address components from Redis UserInfo - Updated for 8-step workflow"""
    address_components = {
        "street": None,
        "suburb": None, 
        "state": None,
        "postcode": None
    }
    
    if user_info and user_info.address:
        address = user_info.address
        # Combine street number and name
        if hasattr(address, 'street_number') and hasattr(address, 'street_name'):
            if address.street_number and address.street_name:
                address_components["street"] = f"{address.street_number} {address.street_name}".strip()
        
        if hasattr(address, 'suburb') and address.suburb:
            address_components["suburb"] = address.suburb
        if hasattr(address, 'state') and address.state:
            address_components["state"] = address.state
        if hasattr(address, 'postcode') and address.postcode:
            address_components["postcode"] = address.postcode
    
    return address_components

def _check_address_completion_status(address_components: dict) -> dict:
    """Check completion status for each address component - Updated for 8-step workflow"""
    return {
        "street_complete": bool(address_components.get("street")),
        "suburb_complete": bool(address_components.get("suburb")),
        "state_complete": bool(address_components.get("state")),
        "postcode_complete": bool(address_components.get("postcode"))
    }

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
    except ValueError as e:
        # Redis中没找到CallSkeleton - 业务逻辑错误，不是资源不存在
        raise HTTPException(status_code=422, detail="CallSkeleton not found")
    except ValidationError as e:
        # 数据格式错误
        raise HTTPException(status_code=400, detail=f"Invalid CallSkeleton data format: {str(e)}")
    except Exception as e:
        # 其他服务器错误
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
    
    # 2. Construct AI workflow state - Updated for 8-step workflow
    user_info = callskeleton.user.userInfo if callskeleton.user.userInfo else None
    
    # Extract address components from Redis
    address_components = _extract_address_components_from_redis(user_info)
    address_completion_status = _check_address_completion_status(address_components)
    
    # Extract service information from CallSkeleton
    current_service = callskeleton.user.service
    available_services = [
        {
            "id": svc.id,
            "name": svc.name,
            "price": svc.price,
            "description": svc.description
        }
        for svc in callskeleton.services
    ]
    
    print(f"🔍 Address components from Redis: {address_components}")
    print(f"🔍 Address completion status: {address_completion_status}")
    print(f"🔍 Available services: {len(available_services)} services")
    print(f"🔍 Current selected service: {current_service.name if current_service else 'None'}")
    
    state: CustomerServiceState = {
        "name": user_info.name if user_info else None,
        "phone": user_info.phone if user_info else None,
        "street": address_components.get("street"),
        "suburb": address_components.get("suburb"),
        "state": address_components.get("state"),
        "postcode": address_components.get("postcode"),
        "service": current_service.name if current_service else None,
        "service_id": current_service.id if current_service else None,
        "service_price": current_service.price if current_service else None,
        "service_description": current_service.description if current_service else None,
        "available_services": available_services,
        "service_time": callskeleton.user.serviceBookedTime,
        "current_step": "collect_name",
        "name_attempts": 0,
        "phone_attempts": 0,
        "street_attempts": 0,
        "suburb_attempts": 0,
        "state_attempts": 0,
        "postcode_attempts": 0,
        "service_attempts": 0,
        "time_attempts": 0,
        "max_attempts": 3,
        "service_max_attempts": 3,
        "last_user_input": data.customerMessage.message,
        "last_llm_response": None,
        "name_complete": bool(user_info.name if user_info else None),
        "phone_complete": bool(user_info.phone if user_info else None),
        "street_complete": address_completion_status["street_complete"],
        "suburb_complete": address_completion_status["suburb_complete"],
        "state_complete": address_completion_status["state_complete"],
        "postcode_complete": address_completion_status["postcode_complete"],
        "service_complete": bool(callskeleton.user.service),
        "time_complete": bool(callskeleton.user.serviceBookedTime),
        "conversation_complete": callskeleton.servicebooked,
        "service_available": True,
        "time_available": True,
    }
    
    # 3. Set current user input
    state["last_user_input"] = data.customerMessage.message

    # 4. Call unified workflow processing - all business logic delegated to call_handler
    updated_state = cs_agent.process_customer_workflow(state, call_sid=data.callSid)

    # 5. Generate AI response
    ai_message = updated_state["last_llm_response"]["response"] if updated_state["last_llm_response"] else "Sorry, system is busy, please try again later."
    ai_response = {
        "speaker": "AI",
        "message": ai_message,
        "startedAt": datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
    }

    # 6. Return AI response
    # Note: Customer information and conversation history are updated in Redis in real-time through workflow
    return {
        "aiResponse": ai_response
    }

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
        startedAt=datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
    )
    
    # Use the existing conversation logic
    conversation_data = ConversationInput(
        callSid=data.callSid,
        customerMessage=customer_message
    )
    
    # Call the main conversation handler
    result = await ai_conversation(conversation_data)
    
    # Return in format expected by telephony service
    return {
        "replyText": result["aiResponse"]["message"]
    }