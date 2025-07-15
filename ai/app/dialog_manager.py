import re
from .models import Message, CallSkeleton, UserInfo, Service
from datetime import datetime
from typing import Tuple
from .services.llm import chain
import asyncio

def extract_name_from_message(message: str) -> str:
    """从客户消息中提取姓名"""
    # 简单的姓名提取逻辑，可以根据需要优化
    patterns = [
        r"我叫(.+?)(?:，|,|。|\.|$)",
        r"我是(.+?)(?:，|,|。|\.|$)",
        r"我的名字是(.+?)(?:，|,|。|\.|$)",
        r"称呼我(.+?)(?:，|,|。|\.|$)"
    ]
    for pattern in patterns:
        match = re.search(pattern, message)
        if match:
            return match.group(1).strip()
    return ""

def extract_phone_from_message(message: str) -> str:
    """从客户消息中提取电话号码"""
    # 匹配各种电话号码格式
    phone_pattern = r"(\d{3,4}[-\s]?\d{3,4}[-\s]?\d{4}|\d{10,11})"
    match = re.search(phone_pattern, message)
    if match:
        return match.group(1).replace(" ", "").replace("-", "")
    return ""

def extract_address_from_message(message: str) -> str:
    """从客户消息中提取地址"""
    # 简单的地址提取逻辑
    address_keywords = ["地址", "住在", "位于", "在", "到"]
    for keyword in address_keywords:
        if keyword in message:
            # 提取关键词后的内容
            parts = message.split(keyword)
            if len(parts) > 1:
                address = parts[1].strip()
                # 清理标点符号
                address = re.sub(r"[，,。\.！!？?]", "", address)
                if address:
                    return address
    return ""

def extract_service_from_message(message: str, available_services: list[Service]) -> Service:
    """从客户消息中提取服务选择"""
    for service in available_services:
        if service.name in message:
            return service
    return None

def extract_time_from_message(message: str) -> str:
    """从客户消息中提取预约时间"""
    # 简单的时间提取逻辑
    time_patterns = [
        r"(\d{1,2}月\d{1,2}日)",
        r"(\d{1,2}号)",
        r"(今天|明天|后天)",
        r"(\d{1,2}点\d{0,2}分?)",
        r"(\d{1,2}:\d{2})"
    ]
    for pattern in time_patterns:
        match = re.search(pattern, message)
        if match:
            return match.group(1)
    return ""

def build_llm_prompt(skeleton: CallSkeleton, customer_message: str) -> str:
    """构建发送给 LLM 的完整提示"""
    
    # 获取当前状态
    userinfo = skeleton.user.userInfo or UserInfo()
    company = skeleton.company
    services = skeleton.services
    
    # 构建对话历史
    history_text = ""
    for msg in skeleton.history[-6:]:  # 最近6轮对话
        speaker = "客户" if msg.speaker == "customer" else "AI"
        history_text += f"{speaker}: {msg.message}\n"
    
    # 构建当前状态信息
    status_info = f"""
当前状态:
- 公司: {company.name}
- 客户姓名: {userinfo.name or '未收集'}
- 客户电话: {userinfo.phone or '未收集'}
- 客户地址: {userinfo.address or '未收集'}
- 已选服务: {skeleton.user.service.name if skeleton.user.service else '未选择'}
- 预约时间: {skeleton.user.serviceBookedTime or '未预约'}
- 是否已预约: {skeleton.servicebooked}

可用服务:
"""
    for service in services:
        status_info += f"- {service.name}: {service.description or '无描述'}\n"
    
    # 构建完整提示
    prompt = f"""
你是一个专业的客服AI助手，负责帮助客户预约服务。

{status_info}

对话历史:
{history_text}

客户最新消息: {customer_message}

请根据当前状态和客户消息，生成合适的回复。回复要求：
1. 自然、友好、专业
2. 根据当前收集的信息状态，引导客户提供下一步需要的信息
3. 如果信息收集完整，引导客户确认预约
4. 回复要简洁明了，适合语音播报

请直接回复对话内容，不要包含任何解释或标记。
"""
    
    return prompt

async def process_customer_message(skeleton: CallSkeleton, customer_msg: Message) -> Tuple[Message, CallSkeleton]:
    """处理客户消息，调用 LLM 生成回复并更新状态"""
    
    # 1. 记录客户消息
    skeleton.history.append(customer_msg)
    
    # 2. 构建发送给 LLM 的提示
    llm_prompt = build_llm_prompt(skeleton, customer_msg.message)
    
    # 3. 调用 LLM 生成回复
    try:
        llm_response = await chain.ainvoke({"user_input": llm_prompt})
        ai_text = llm_response.strip()
    except Exception as e:
        # 如果 LLM 调用失败，使用备用回复
        print(f"LLM 调用失败: {e}")
        ai_text = "抱歉，我现在有点忙，请您稍后再试。"
    
    # 4. 从客户消息中提取信息并更新状态
    userinfo = skeleton.user.userInfo or UserInfo()
    
    # 提取姓名
    if not userinfo.name:
        extracted_name = extract_name_from_message(customer_msg.message)
        if extracted_name:
            userinfo.name = extracted_name
    
    # 提取电话
    if not userinfo.phone:
        extracted_phone = extract_phone_from_message(customer_msg.message)
        if extracted_phone:
            userinfo.phone = extracted_phone
    
    # 提取地址
    if not userinfo.address:
        extracted_address = extract_address_from_message(customer_msg.message)
        if extracted_address:
            userinfo.address = extracted_address
    
    # 提取服务选择
    if not skeleton.user.service:
        extracted_service = extract_service_from_message(customer_msg.message, skeleton.services)
        if extracted_service:
            skeleton.user.service = extracted_service
    
    # 提取预约时间
    if not skeleton.user.serviceBookedTime:
        extracted_time = extract_time_from_message(customer_msg.message)
        if extracted_time:
            skeleton.user.serviceBookedTime = extracted_time
    
    # 检查是否确认预约
    if not skeleton.servicebooked and "确认" in customer_msg.message.lower():
        skeleton.servicebooked = True
    
    # 5. 更新用户信息
    skeleton.user.userInfo = userinfo
    
    # 6. 生成AI回复消息
    ai_msg = Message(
        speaker="AI",
        message=ai_text,
        startedAt=datetime.utcnow().isoformat() + "Z"
    )
    skeleton.history.append(ai_msg)
    
    return ai_msg, skeleton 