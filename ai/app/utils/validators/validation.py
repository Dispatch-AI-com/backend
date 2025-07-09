from typing import Dict, Any, List
import re


def validate_call_sid(call_sid: str) -> bool:
    """Validate Twilio Call SID format."""
    if not call_sid or not isinstance(call_sid, str):
        return False
    
    # Basic validation for Twilio Call SID format
    if re.match(r'^CA[a-f0-9]{32}$', call_sid):
        return True
    
    # If it doesn't match exact format, at least check it's not empty and reasonable length
    return len(call_sid.strip()) >= 10


def validate_message_content(message: str) -> bool:
    """Validate message content."""
    if not message or not isinstance(message, str):
        return False
    return bool(message.strip())


def validate_conversation_data(conversation: List[Dict[str, Any]]) -> bool:
    """Validate conversation data structure."""
    if not conversation or not isinstance(conversation, list):
        return False
    
    for msg in conversation:
        if not isinstance(msg, dict):
            return False
        
        if "speaker" not in msg or "message" not in msg:
            return False
        
        if not validate_message_content(msg["message"]):
            return False
        
        # Validate speaker type
        if msg["speaker"].upper() not in ["AI", "CUSTOMER"]:
            return False
    
    return True


def validate_service_info(service_info: Dict[str, Any]) -> bool:
    """Validate service info structure."""
    if not service_info or not isinstance(service_info, dict):
        return False
    
    # Check required fields
    if "name" not in service_info:
        return False
    
    if not isinstance(service_info["name"], str) or not service_info["name"].strip():
        return False
    
    # Check optional fields
    if "booked" in service_info and not isinstance(service_info["booked"], bool):
        return False
    
    return True