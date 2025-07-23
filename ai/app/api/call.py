from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, ValidationError
from models.call import Message, CallSkeleton, Address
from services.redis_service import get_call_skeleton
from services.call_handler import CustomerServiceLangGraph, CustomerServiceState
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

def _is_address_complete(address: Address | None) -> bool:
    """Check if address object has all required components"""
    print(f"🔍 _is_address_complete called with: {address}")
    print(f"🔍 Address type: {type(address)}")
    
    if not address:
        print(f"🔍 Address is None or empty")
        return False
    
    # Check if all required fields are present and not empty
    required_fields = ['street_number', 'street_name', 'suburb', 'state', 'postcode']
    
    for field in required_fields:
        value = getattr(address, field, None)
        print(f"🔍 Field {field}: '{value}' (type: {type(value)})")
        if not value or (isinstance(value, str) and not value.strip()):
            print(f"🔍 Field {field} is empty or invalid")
            return False
    
    print(f"🔍 All address fields are complete")
    return True

@router.post("/conversation")
async def ai_conversation(data: ConversationInput):
    """AI conversation dispatch endpoint
    
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
    
    # 2. Construct AI workflow state
    user_info = callskeleton.user.userInfo if callskeleton.user.userInfo else None
    
    # Debug address information
    address_complete_status = _is_address_complete(user_info.address if user_info else None)
    print(f"🔍 Address from Redis: {user_info.address if user_info else 'None'}")
    print(f"🔍 Address complete status: {address_complete_status}")
    
    state: CustomerServiceState = {
        "name": user_info.name if user_info else None,
        "phone": user_info.phone if user_info else None,
        "address": user_info.address if user_info else None,
        "email": user_info.email if user_info else None,
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
        "last_user_input": data.customerMessage.message,
        "last_llm_response": None,
        "name_complete": bool(user_info.name if user_info else None),
        "phone_complete": bool(user_info.phone if user_info else None),
        "address_complete": address_complete_status,
        "email_complete": bool(user_info.email if user_info else None),
        "service_complete": bool(callskeleton.user.service),
        "time_complete": bool(callskeleton.user.serviceBookedTime),
        "conversation_complete": callskeleton.servicebooked,
        "service_available": True,
        "time_available": True,
        # Address collection fields
        "address_components": {
            "street_number": None,
            "street_name": None,
            "suburb": None,
            "state": None,
            "postcode": None
        },
        "address_collection_step": "street",
    }
    
    # 3. Set current user input
    state["last_user_input"] = data.customerMessage.message

    # 5. Call unified workflow processing - all business logic delegated to call_handler
    updated_state = cs_agent.process_customer_workflow(state, call_sid=data.callSid)

    # 6. Generate AI response
    ai_message = updated_state["last_llm_response"]["response"] if updated_state["last_llm_response"] else "Sorry, system is busy, please try again later."
    ai_response = {
        "speaker": "AI",
        "message": ai_message,
        "startedAt": datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
    }

    # 7. Return AI response
    # Note: Customer information and conversation history are updated in Redis in real-time through workflow
    return {
        "aiResponse": ai_response
    }

@router.post("/reply")
async def ai_reply(data: ReplyInput):
    """Simple AI reply endpoint for telephony service
    
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