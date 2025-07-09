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


def validate_call_data(call_sid: str, conversation: List[Dict[str, Any]]) -> bool:
    """Validate call data structure."""
    if not validate_call_sid(call_sid):
        return False
    
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


def validate_emergency_call_data(
    call_sid: str, 
    conversation: List[Dict[str, Any]], 
    emergency_type: str
) -> bool:
    """Validate emergency call data with additional requirements."""
    if not validate_call_data(call_sid, conversation):
        return False
    
    # Validate emergency type
    valid_emergency_types = [
        "plumbing", "electrical", "hvac", "locksmith", 
        "appliance_repair", "pest_control", "cleaning"
    ]
    
    if emergency_type not in valid_emergency_types:
        return False
    
    # Check if conversation contains urgency indicators
    conversation_text = " ".join([msg["message"].lower() for msg in conversation])
    urgency_keywords = ["urgent", "emergency", "asap", "immediately", "help", "problem"]
    
    has_urgency = any(keyword in conversation_text for keyword in urgency_keywords)
    
    return has_urgency