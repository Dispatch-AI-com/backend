from fastapi import APIRouter, Request, HTTPException
from ..services.llm import chain
from pydantic import BaseModel
from ..models import Message, CallSkeleton, Service, Company
from ..redis_client import get_call_skeleton, set_call_skeleton
from ..dialog_manager import process_customer_message
from ..chatr2v3 import CustomerServiceLangGraph
from ..callskeleton_mapper import state_to_callskeleton
from datetime import datetime

router = APIRouter(
    prefix="/ai",
    tags=["AI"],
    responses={404: {"description": "Not found"}},
)


class MessageIn(BaseModel):
    callSid: str = Field(..., description="Twilio CallSid – unique call ID")
    message: str = Field(..., description="Customer utterance")


    response = await chain.ainvoke({"user_input": user_input})
    return {"response": response}


# 新增接口：AI对话调度
class ConversationInput(BaseModel):
    callSid: str
    customerMessage: Message

# 全局客服对象
cs_agent = CustomerServiceLangGraph()

@router.post("/conversation")
async def ai_conversation(data: ConversationInput):
    # 1. 获取CallSkeleton
    try:
        callskeleton_dict = get_call_skeleton(data.callSid)
        callskeleton = CallSkeleton.parse_obj(callskeleton_dict)
    except Exception:
        raise HTTPException(status_code=404, detail="CallSkeleton not found")
    
    # 2. 构造/恢复AI内部state
    state = {
        "name": callskeleton.user.userInfo.get("name"),
        "phone": callskeleton.user.userInfo.get("phone"),
        "address": callskeleton.user.userInfo.get("address"),
        "service": callskeleton.user.service.name if callskeleton.user.service else None,
        "service_time": callskeleton.user.serviceBookedTime,
        "current_step": "collect_name",  # 默认第一步
        "name_attempts": 0,
        "phone_attempts": 0,
        "address_attempts": 0,
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
        "service_complete": bool(callskeleton.user.service),
        "time_complete": bool(callskeleton.user.serviceBookedTime),
        "conversation_complete": callskeleton.servicebooked,
        "service_available": True,
        "time_available": True,
        "name_timestamp": None,
        "phone_timestamp": None,
        "address_timestamp": None,
        "service_timestamp": None,
        "time_timestamp": None,
    }
    # 恢复历史
    for msg in callskeleton.history:
        state["conversation_history"].append({
            "role": "user" if msg.speaker == "customer" else "assistant",
            "content": msg.message,
            "timestamp": msg.startedAt
        })
    # 追加本轮用户输入
    state["conversation_history"].append({
        "role": "user",
        "content": data.customerMessage.message,
        "timestamp": data.customerMessage.startedAt
    })
    state["last_user_input"] = data.customerMessage.message

    # 3. 判断当前步骤
    if not state["name_complete"]:
        state = cs_agent.process_name_collection(state)
    elif not state["phone_complete"]:
        state = cs_agent.process_phone_collection(state)
    elif not state["address_complete"]:
        state = cs_agent.process_address_collection(state)
    elif not state["service_complete"]:
        state = cs_agent.process_service_collection(state)
    elif not state["time_complete"]:
        state = cs_agent.process_time_collection(state)
    else:
        state["conversation_complete"] = True

    # 4. 生成AI回复
    ai_message = state["last_llm_response"]["response"] if state["last_llm_response"] else "抱歉，系统繁忙，请稍后再试。"
    ai_response = {
        "speaker": "AI",
        "message": ai_message,
        "startedAt": datetime.utcnow().isoformat() + "Z"
    }

    # 5. 映射为CallSkeleton格式
    updated_callskeleton = state_to_callskeleton(
        state,
        callSid=callskeleton.callSid,
        services=callskeleton.services,
        company=callskeleton.company,
        createdAt=callskeleton.createdAt
    )

    # 6. 存回Redis
    set_call_skeleton(data.callSid, updated_callskeleton)

    # 7. 返回
    return {
        "aiResponse": ai_response,
        "updatedCallSkeleton": updated_callskeleton
    }
