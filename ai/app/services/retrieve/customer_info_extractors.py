"""
Customer Information Extraction Module

Responsible for extracting structured customer information (name, phone, address, service, time) from conversation history using OpenAI API.

Key Features:
- Extracts structured customer info from conversation
- Single string address collection (5-step workflow)
- Unified error handling and fallback
- Standardized return format

"""

import json
import os
from typing import Dict, Any
from openai import OpenAI
from custom_types import CustomerServiceState

from utils.prompts.customer_info_prompts import (
    get_name_extraction_prompt,
    get_phone_extraction_prompt,
    get_address_extraction_prompt,
    get_service_extraction_prompt,
    get_time_extraction_prompt,
)

# Customer service state uses 5-step workflow: name, phone, address, service, time


def _get_openai_client() -> OpenAI:
    return OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def _build_conversation_context(state: CustomerServiceState) -> str:
    """Build conversation context - simplified since state info is now in prompt"""
    current_input = state.get("last_user_input") or ""
    return current_input


def _call_openai_api(
    prompt: str, conversation_context: str, user_input: str, message_history: list = None
) -> Dict[str, Any]:
    client = _get_openai_client()
    user_input = user_input or ""
    
    # Build messages array
    messages = [{"role": "system", "content": prompt}]
    
    # Add message history if provided (last 4 messages)
    if message_history:
        for msg in message_history[-4:]:  # Take last 4 messages
            messages.append(msg)
    
    # Add current user input
    messages.append({"role": "user", "content": f"User input: {user_input}"})
    
    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=messages,
        temperature=0.3,
        max_tokens=500,
    )
    content = (
        response.choices[0].message.content
        if response.choices[0].message.content
        else ""
    )
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        return {}


def _default_result(response: str, key: str, error: str) -> Dict[str, Any]:
    return {
        "response": response,
        "info_extracted": {key: None},
        "info_complete": False,
        "analysis": error,
    }


# NOTE: _default_street_result removed - address is now single string


def extract_name_from_conversation(state: CustomerServiceState, message_history: list = None) -> Dict[str, Any]:
    try:
        context = _build_conversation_context(state)
        prompt = get_name_extraction_prompt()
        result = _call_openai_api(prompt, context, state.get("last_user_input") or "", message_history)
        if result:
            return result
        else:
            return _default_result(
                "Sorry, there was a problem processing your name. Please tell me your name again.",
                "name",
                "Parse error",
            )
    except Exception as e:
        return _default_result(
            "Sorry, the system is temporarily unavailable. Please tell me your name again.",
            "name",
            f"API error: {str(e)}",
        )


def extract_phone_from_conversation(state: CustomerServiceState, message_history: list = None) -> Dict[str, Any]:
    try:
        context = _build_conversation_context(state)
        prompt = get_phone_extraction_prompt()
        result = _call_openai_api(prompt, context, state.get("last_user_input") or "", message_history)
        if result:
            return result
        else:
            return _default_result(
                "Sorry, there was a problem processing your phone number. Please tell me your phone number again.",
                "phone",
                "Parse error",
            )
    except Exception as e:
        return _default_result(
            "Sorry, the system is temporarily unavailable. Please tell me your phone number again.",
            "phone",
            f"API error: {str(e)}",
        )


def extract_address_from_conversation(state: CustomerServiceState, message_history: list = None) -> Dict[str, Any]:
    """Extract address from conversation with memory of previously collected information"""
    try:
        context = _build_conversation_context(state)
        prompt = get_address_extraction_prompt()
        user_input = state.get("last_user_input") or ""
        
        result = _call_openai_api(prompt, context, user_input, message_history)
        
        if result:
            return result
        else:
            return _default_result(
                "Sorry, there was a problem processing your address. Please tell me your address again.",
                "address",
                "Parse error",
            )
    except Exception as e:
        print(f"❌ [ADDRESS_EXTRACTION] Exception occurred: {str(e)}")
        return _default_result(
            "Sorry, the system is temporarily unavailable. Please tell me your street address again.",
            "address",
            f"API error: {str(e)}",
        )


# NOTE: Individual address component extractors removed (suburb, state, postcode)
# Address is now collected as a single string in the 5-step workflow


def extract_service_from_conversation(state: CustomerServiceState, message_history: list = None) -> Dict[str, Any]:
    try:
        context = _build_conversation_context(state)
        # Get available services from state if available
        available_services = state.get("available_services", None)
        user_input = state.get("last_user_input") or ""
        
        if not available_services:
            print("⚠️ [SERVICE_EXTRACTION] No available services found in state!")
        
        prompt = get_service_extraction_prompt(available_services)
        result = _call_openai_api(prompt, context, user_input, message_history)
        
        if result:
            return result
        else:
            return _default_result(
                "Sorry, there was a problem processing your service request. Please tell me what service you need again.",
                "service",
                "Parse error",
            )
    except Exception as e:
        print(f"❌ [SERVICE_EXTRACTION] Exception occurred: {str(e)}")
        return _default_result(
            "Sorry, the system is temporarily unavailable. Please tell me what service you need again.",
            "service",
            f"API error: {str(e)}",
        )


def extract_time_from_conversation(state: CustomerServiceState, message_history: list = None) -> Dict[str, Any]:
    try:
        context = _build_conversation_context(state)
        prompt = get_time_extraction_prompt()
        result = _call_openai_api(prompt, context, state.get("last_user_input") or "", message_history)
        if result:
            return result
        else:
            return _default_result(
                "Sorry, there was a problem processing your preferred service time. Please tell me your preferred time again.",
                "time",
                "Parse error",
            )
    except Exception as e:
        return _default_result(
            "Sorry, the system is temporarily unavailable. Please tell me your preferred time again.",
            "time",
            f"API error: {str(e)}",
        )
