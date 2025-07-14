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

# AI对话调度接口输入模型
class ConversationInput(BaseModel):
    callSid: str = Field(..., description="Twilio CallSid – unique call ID")
    customerMessage: Message = Field(..., description="Customer message object")

# 全局客服对象
cs_agent = CustomerServiceLangGraph()

@router.post("/conversation")
async def ai_conversation(data: ConversationInput):
    """AI对话调度接口
    
    纯API接口，负责：
    1. 接收前端请求
    2. 获取和转换CallSkeleton数据
    3. 调用统一的workflow处理
    4. 返回AI回复
    
    所有业务逻辑都委托给chatr2v3模块处理。
    """
    # 1. 获取CallSkeleton数据
    try:
        callskeleton_dict = get_call_skeleton(data.callSid)
        callskeleton = CallSkeleton.parse_obj(callskeleton_dict)
    except Exception:
        raise HTTPException(status_code=404, detail="CallSkeleton not found")
    
    # 2. 构造AI工作流状态
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
    
    # 3. 恢复对话历史
    for msg in callskeleton.history:
        state["conversation_history"].append({
            "role": "user" if msg.speaker == "customer" else "assistant",
            "content": msg.message,
            "timestamp": msg.startedAt
        })
    
    # 4. 添加当前用户输入到对话历史
    state["conversation_history"].append({
        "role": "user",
        "content": data.customerMessage.message,
        "timestamp": data.customerMessage.startedAt
    })
    state["last_user_input"] = data.customerMessage.message

    # 5. 调用统一的workflow处理 - 所有业务逻辑委托给chatr2v3
    updated_state = cs_agent.process_customer_workflow(state, call_sid=data.callSid)

    # 6. 生成AI回复
    ai_message = updated_state["last_llm_response"]["response"] if updated_state["last_llm_response"] else "抱歉，系统繁忙，请稍后再试。"
    ai_response = {
        "speaker": "AI",
        "message": ai_message,
        "startedAt": datetime.utcnow().isoformat() + "Z"
    }

    # 7. 返回AI回复
    # 注意：客户信息和对话历史已通过workflow在Redis中实时更新
    return {
        "aiResponse": ai_response
    }