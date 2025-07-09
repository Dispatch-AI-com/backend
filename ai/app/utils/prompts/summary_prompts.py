from typing import Optional

def create_summary_prompt_template(
    conversation_text: str,
    service_info: Optional[dict] = None,
    language: str = "chinese"
) -> str:
    """Create AI prompt for conversation summarization."""
    
    # Service context
    service_context = ""
    if service_info:
        service_name = service_info.get("name", "Unknown service")
        service_booked = service_info.get("booked", False)
        service_context = f"\nService discussed: {service_name}\nService was {'booked' if service_booked else 'not booked'}"

    # Language-specific templates
    if language == "english":
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
    
    # Default Chinese template
    return f"""
请分析以下客服电话对话并提供摘要和关键点。

对话内容:
{conversation_text}
{service_context}

请按以下JSON格式回复:
{{
    "summary": "对通话的简洁2-3句摘要",
    "keyPoints": ["关键点1", "关键点2", "关键点3"]
}}

重点关注:
- 客户需要什么
- 讨论了哪些服务
- 是否完成了预订
- 通话的结果
- 需要的后续行动
"""


def create_emergency_summary_prompt(
    conversation_text: str,
    emergency_type: str,
    service_info: Optional[dict] = None
) -> str:
    """Create emergency-specific summary prompt."""
    
    service_context = ""
    if service_info:
        service_name = service_info.get("name", emergency_type)
        service_booked = service_info.get("booked", False)
        eta = service_info.get("eta", "Unknown")
        service_context = f"\nEmergency service: {service_name}\nService status: {'Dispatched' if service_booked else 'Not dispatched'}\nETA: {eta}"

    return f"""
Please analyze this emergency service call and provide a detailed summary.

EMERGENCY TYPE: {emergency_type}

CONVERSATION:
{conversation_text}
{service_context}

Please respond in the following JSON format:
{{
    "summary": "Emergency summary with severity, location, and response",
    "keyPoints": ["Emergency details", "Customer location", "Response time", "Service status"],
    "urgency": "high|medium|low",
    "location": "Customer location if provided",
    "serviceDispatched": true/false
}}

Focus on:
- Type and severity of emergency
- Customer location and contact details
- Response time and service dispatch status
- Any safety concerns or special instructions
- Follow-up actions required
"""


def create_service_booking_prompt(
    conversation_text: str,
    service_type: str,
    booking_details: Optional[dict] = None
) -> str:
    """Create service booking summary prompt."""
    
    booking_context = ""
    if booking_details:
        date = booking_details.get("date", "Not specified")
        time = booking_details.get("time", "Not specified")
        location = booking_details.get("location", "Not specified")
        booking_context = f"\nBooking details:\nDate: {date}\nTime: {time}\nLocation: {location}"

    return f"""
Please analyze this service booking conversation and provide a comprehensive summary.

SERVICE TYPE: {service_type}

CONVERSATION:
{conversation_text}
{booking_context}

Please respond in the following JSON format:
{{
    "summary": "Service booking summary with customer needs and booking status",
    "keyPoints": ["Service requested", "Booking details", "Customer requirements", "Booking status"],
    "serviceType": "{service_type}",
    "bookingConfirmed": true/false,
    "customerSatisfaction": "satisfied|neutral|dissatisfied"
}}

Focus on:
- Specific service requested
- Booking date, time, and location
- Customer requirements or special requests
- Booking confirmation status
- Customer satisfaction level
- Payment or pricing discussed
"""