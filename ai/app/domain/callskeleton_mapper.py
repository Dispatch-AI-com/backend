from typing import Dict, Any, List
from ..models import CallSkeleton, UserState, UserInfo, Service, Company, Message
from datetime import datetime


def state_to_callskeleton(
    state: Dict[str, Any],
    callSid: str,
    services: List[Service],
    company: Company,
    createdAt: str
) -> CallSkeleton:
    """将内部状态转换为CallSkeleton格式"""
    
    # 构建用户信息
    user_info = UserInfo(
        name=state.get("name"),
        phone=state.get("phone"),
        address=state.get("address"),
        email=state.get("email")
    )
    
    # 构建选择的服务
    selected_service = None
    if state.get("service") and state.get("service_complete"):
        # 从可用服务中查找匹配的服务
        for service in services:
            if service.name.lower() == state.get("service", "").lower():
                selected_service = service
                break
        
        # 如果没找到匹配的服务，创建一个新的
        if not selected_service and state.get("service"):
            selected_service = Service(
                id=f"service_{state.get('service')}",
                name=state.get("service"),
                price=None,
                description=f"{state.get('service')} service"
            )
    
    # 构建用户状态
    user_state = UserState(
        service=selected_service,
        serviceBookedTime=state.get("service_time"),
        userInfo=user_info
    )
    
    # 构建消息历史
    history = []
    for msg in state.get("conversation_history", []):
        message = Message(
            speaker="customer" if msg.get("role") == "user" else "AI",
            message=msg.get("content", ""),
            startedAt=msg.get("timestamp", datetime.utcnow().isoformat() + "Z")
        )
        history.append(message)
    
    # 构建CallSkeleton
    call_skeleton = CallSkeleton(
        callSid=callSid,
        services=services,
        company=company,
        user=user_state,
        history=history,
        servicebooked=state.get("conversation_complete", False),
        confirmEmailsent=False,  # 这个字段在当前逻辑中还未实现
        createdAt=createdAt
    )
    
    return call_skeleton