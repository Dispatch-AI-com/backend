import re
from models.call import Message, CallSkeleton, UserInfo, Service
from datetime import datetime, timezone
from typing import Tuple, Optional
from .llm_service import llm_service

def extract_name_from_message(message: str) -> str:
    """Extract customer name from message"""
    # Simple name extraction logic, can be optimized as needed
    patterns = [
        r"my name is (.+?)(?:,|\.|\.|$)",
        r"i am (.+?)(?:,|\.|\.|$)",
        r"call me (.+?)(?:,|\.|\.|$)",
        r"i'm (.+?)(?:,|\.|\.|$)"
    ]
    for pattern in patterns:
        match = re.search(pattern, message.lower())
        if match:
            return match.group(1).strip().title()
    return ""

def extract_phone_from_message(message: str) -> str:
    """Extract phone number from customer message"""
    # Match various phone number formats
    phone_pattern = r"(\d{3,4}[-\s]?\d{3,4}[-\s]?\d{4}|\d{10,11})"
    match = re.search(phone_pattern, message)
    if match:
        return match.group(1).replace(" ", "").replace("-", "")
    return ""

def extract_address_from_message(message: str) -> str:
    """Extract address from customer message"""
    # Simple address extraction logic
    address_keywords = ["address", "live at", "located at", "at", "to"]
    message_lower = message.lower()
    for keyword in address_keywords:
        if keyword in message_lower:
            # Extract content after keyword
            parts = message_lower.split(keyword)
            if len(parts) > 1:
                address = parts[1].strip()
                # Clean punctuation
                address = re.sub(r"[,\.!?]", "", address)
                if address:
                    return address.title()
    return ""

def extract_service_from_message(message: str, available_services: list[Service]) -> Optional[Service]:
    """Extract service selection from customer message"""
    message_lower = message.lower()
    for service in available_services:
        if service.name.lower() in message_lower:
            return service
    return None

def extract_time_from_message(message: str) -> str:
    """Extract appointment time from customer message"""
    # Simple time extraction logic
    time_patterns = [
        r"(\d{1,2}/\d{1,2})",  # MM/DD format
        r"(\d{1,2}th|\d{1,2}st|\d{1,2}nd|\d{1,2}rd)",  # 1st, 2nd, 3rd, etc.
        r"(today|tomorrow|next week)",
        r"(\d{1,2}:\d{2})",  # HH:MM format
        r"(\d{1,2}\s*(?:am|pm))",  # 12am, 1pm, etc.
    ]
    message_lower = message.lower()
    for pattern in time_patterns:
        match = re.search(pattern, message_lower)
        if match:
            return match.group(1)
    return ""

def build_llm_prompt(skeleton: CallSkeleton, customer_message: str) -> str:
    """Build complete prompt to send to LLM"""
    
    # Get current state
    userinfo = skeleton.user.userInfo or UserInfo()
    company = skeleton.company
    services = skeleton.services
    
    # Build conversation history
    history_text = ""
    for msg in skeleton.history[-6:]:  # Last 6 conversation turns
        speaker = "Customer" if msg.speaker == "customer" else "AI"
        history_text += f"{speaker}: {msg.message}\n"
    
    # Build current status information
    status_info = f"""
Current Status:
- Company: {company.name}
- Customer Name: {userinfo.name or 'Not collected'}
- Customer Phone: {userinfo.phone or 'Not collected'}
- Customer Address: {userinfo.address or 'Not collected'}
- Selected Service: {skeleton.user.service.name if skeleton.user.service else 'Not selected'}
- Appointment Time: {skeleton.user.serviceBookedTime or 'Not scheduled'}
- Is Booked: {skeleton.servicebooked}

Available Services:
"""
    for service in services:
        status_info += f"- {service.name}: {service.description or 'No description'}\n"
    
    # Build complete prompt
    prompt = f"""
You are a professional customer service AI assistant responsible for helping customers book services.

{status_info}

Conversation History:
{history_text}

Customer's Latest Message: {customer_message}

Please generate an appropriate response based on the current state and customer message. Response requirements:
1. Natural, friendly, and professional
2. Based on the current information collection status, guide the customer to provide the next needed information
3. If information collection is complete, guide the customer to confirm the appointment
4. Response should be concise and clear, suitable for voice playback

Please respond directly with the conversation content, do not include any explanations or markers.
"""
    
    return prompt

async def process_customer_message(skeleton: CallSkeleton, customer_msg: Message) -> Tuple[Message, CallSkeleton]:
    """Process customer message, call LLM to generate response and update state"""
    
    # 1. Record customer message
    skeleton.history.append(customer_msg)
    
    # 2. Build prompt to send to LLM
    llm_prompt = build_llm_prompt(skeleton, customer_msg.message)
    
    # 3. Call LLM to generate response
    try:
        llm_response = await llm_service.generate_response(llm_prompt)
        ai_text = llm_response.strip()
    except Exception as e:
        # If LLM call fails, use fallback response
        print(f"LLM call failed: {e}")
        ai_text = "Sorry, I'm a bit busy right now, please try again later."
    
    # 4. Extract information from customer message and update state
    userinfo = skeleton.user.userInfo or UserInfo()
    
    # Extract name
    if not userinfo.name:
        extracted_name = extract_name_from_message(customer_msg.message)
        if extracted_name:
            userinfo.name = extracted_name
    
    # Extract phone
    if not userinfo.phone:
        extracted_phone = extract_phone_from_message(customer_msg.message)
        if extracted_phone:
            userinfo.phone = extracted_phone
    
    # Extract address
    if not userinfo.address:
        extracted_address = extract_address_from_message(customer_msg.message)
        if extracted_address:
            userinfo.address = extracted_address
    
    # Extract service selection
    if not skeleton.user.service:
        extracted_service = extract_service_from_message(customer_msg.message, skeleton.services)
        if extracted_service:
            skeleton.user.service = extracted_service
    
    # Extract appointment time
    if not skeleton.user.serviceBookedTime:
        extracted_time = extract_time_from_message(customer_msg.message)
        if extracted_time:
            skeleton.user.serviceBookedTime = extracted_time
    
    # Check if appointment is confirmed
    if not skeleton.servicebooked and "confirm" in customer_msg.message.lower():
        skeleton.servicebooked = True
    
    # 5. Update user information
    skeleton.user.userInfo = userinfo
    
    # 6. Generate AI response message
    ai_msg = Message(
        speaker="AI",
        message=ai_text,
        startedAt=datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
    )
    skeleton.history.append(ai_msg)
    
    return ai_msg, skeleton