# app/routers/ai.py
from typing import List, Tuple
import json
import re
from fastapi import APIRouter, Request, HTTPException, status
from pydantic import BaseModel, Field
from ..services.llm import chain
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
        "email": callskeleton.user.userInfo.get("email"),
        "service": callskeleton.user.service.name if callskeleton.user.service else None,
        "service_time": callskeleton.user.serviceBookedTime,
        "current_step": "collect_name",  # 默认第一步
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

    # 3. 判断当前步骤 - 传递call_sid实现实时Redis更新
    if not state["name_complete"]:
        state = cs_agent.process_name_collection(state, call_sid=data.callSid)
    elif not state["phone_complete"]:
        state = cs_agent.process_phone_collection(state, call_sid=data.callSid)
    elif not state["address_complete"]:
        state = cs_agent.process_address_collection(state, call_sid=data.callSid)
    elif not state["email_complete"]:
        state = cs_agent.process_email_collection(state, call_sid=data.callSid)
    elif not state["service_complete"]:
        state = cs_agent.process_service_collection(state, call_sid=data.callSid)
    elif not state["time_complete"]:
        state = cs_agent.process_time_collection(state, call_sid=data.callSid)
    else:
        state["conversation_complete"] = True

    # 4. 生成AI回复
    ai_message = state["last_llm_response"]["response"] if state["last_llm_response"] else "抱歉，系统繁忙，请稍后再试。"
    ai_response = {
        "speaker": "AI",
        "message": ai_message,
        "startedAt": datetime.utcnow().isoformat() + "Z"
    }

    # 5. 🗑️ 移除批量更新逻辑 - 现在使用实时更新
    # 注意：客户信息和对话历史已在各个步骤中实时更新到Redis
    # 无需再返回CallSkeleton数据给TS，数据已保存在Redis中

    # 6. 返回AI回复 (CallSkeleton数据已通过实时更新保存到Redis)
    return {
        "aiResponse": ai_response
    }


class MessageOut(BaseModel):
    replyText: str = Field(..., description="Assistant response")


class ConversationMessage(BaseModel):
    speaker: str = Field(..., description="Speaker type: AI or customer")
    message: str = Field(..., description="Message content")
    timestamp: str = Field(..., description="Message timestamp")


class SummaryIn(BaseModel):
    callSid: str = Field(..., description="Twilio CallSid – unique call ID")
    conversation: List[ConversationMessage] = Field(
        ..., description="Full conversation history"
    )
    serviceInfo: dict = Field(default={}, description="Service booking information")


class SummaryOut(BaseModel):
    summary: str = Field(..., description="Call summary")
    keyPoints: List[str] = Field(..., description="Key points from the conversation")


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


@router.post(
    "/summary",
    response_model=SummaryOut,
    status_code=status.HTTP_200_OK,
    summary="Generate AI-powered call summary from conversation data",
)
async def summary_endpoint(body: SummaryIn) -> SummaryOut:
    try:
        # Convert conversation to text format for AI analysis
        conversation_text = format_conversation_for_ai(body.conversation)

        # Create prompt for AI summarization
        summary_prompt = create_summary_prompt(conversation_text, body.serviceInfo)

        # Generate AI summary using the LLM chain
        ai_response = await chain.ainvoke({"user_input": summary_prompt})

        # Parse AI response to extract summary and key points
        summary, keyPoints = parse_ai_summary_response(ai_response)

        return SummaryOut(summary=summary, keyPoints=keyPoints)

    except Exception as e:
        print(f"Error generating AI summary for {body.callSid}: {str(e)}")
        # Fallback to basic summary if AI fails
        return generate_fallback_summary(body)


# Helper functions for AI summary generation


def format_conversation_for_ai(conversation: List[ConversationMessage]) -> str:
    """Convert conversation messages to text format for AI analysis."""
    formatted_lines = []
    for msg in conversation:
        speaker_label = "Assistant" if msg.speaker.upper() == "AI" else "Customer"
        formatted_lines.append(f"{speaker_label}: {msg.message}")
    return "\n".join(formatted_lines)


def create_summary_prompt(conversation_text: str, service_info: dict) -> str:
    """Create AI prompt for conversation summarization."""
    service_context = ""
    if service_info:
        service_name = service_info.get("name", "Unknown service")
        service_booked = service_info.get("booked", False)
        service_context = f"\nService discussed: {service_name}\nService was {'booked' if service_booked else 'not booked'}"

    return f"""
Please analyze this customer service call conversation and provide a summary with key points.

CONVERSATION:
{conversation_text}
{service_context}

Please respond in the following JSON format:
{{
    "summary": "A concise 2-3 sentence summary of the call",
    "keyPoints": ["Key point 1", "Key point 2", "Key point 3"]
}}

Focus on:
- What the customer needed
- What services were discussed
- Whether any booking was made
- The outcome of the call
- Any follow-up actions needed
"""


def parse_ai_summary_response(ai_response: str) -> Tuple[str, List[str]]:
    """Parse AI response to extract summary and key points."""
    try:
        # Try to extract JSON from the AI response
        json_match = re.search(r"\{.*\}", ai_response, re.DOTALL)
        if json_match:
            json_str = json_match.group()
            parsed = json.loads(json_str)
            summary = parsed.get("summary", "Call completed successfully")
            key_points = parsed.get("keyPoints", ["Customer inquiry handled"])
            return summary, key_points
    except (json.JSONDecodeError, AttributeError):
        pass

    # Fallback parsing if JSON extraction fails
    lines = ai_response.split("\n")
    summary = "Call completed successfully"
    key_points = ["Customer inquiry handled"]

    for line in lines:
        if "summary" in line.lower():
            summary = line.split(":", 1)[-1].strip().strip('"')
        elif line.strip().startswith("-") or line.strip().startswith("•"):
            key_points.append(line.strip().lstrip("-•").strip())

    return summary, key_points[:5]  # Limit to 5 key points


def generate_fallback_summary(body: SummaryIn) -> SummaryOut:
    """Generate basic summary when AI fails."""
    conversation_count = len(body.conversation)
    service_name = (
        body.serviceInfo.get("name", "service") if body.serviceInfo else "service"
    )

    summary = f"Customer service call completed with {conversation_count} exchanges regarding {service_name}."

    key_points = [
        f"Customer contacted for {service_name} inquiry",
        f"Conversation included {conversation_count} exchanges",
    ]

    if body.serviceInfo and body.serviceInfo.get("booked"):
        key_points.append("Service booking was completed")
        summary += " Service was successfully booked."
    else:
        key_points.append("Service inquiry discussed")

    return SummaryOut(summary=summary, keyPoints=key_points)
