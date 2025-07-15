"""
Customer Information Extraction Module

Responsible for extracting structured customer information (name, phone, address, email, service, time) from conversation history using OpenAI API.

Key Features:
- Extracts structured customer info from conversation
- Supports multiple info types
- Unified error handling and fallback
- Standardized return format

"""

import json
import os
from typing import TypedDict, Optional, Dict, Any
from openai import OpenAI

from utils.prompts.customer_info_prompts import (
    get_name_extraction_prompt,
    get_phone_extraction_prompt,
    get_address_extraction_prompt,
    get_email_extraction_prompt,
    get_service_extraction_prompt,
    get_time_extraction_prompt
)

class CustomerServiceState(TypedDict):
    name: Optional[str]
    phone: Optional[str]
    address: Optional[str]
    email: Optional[str]
    service: Optional[str]
    service_time: Optional[str]
    conversation_history: list
    last_user_input: Optional[str]

def _get_openai_client() -> OpenAI:
    return OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def _build_conversation_context(state: CustomerServiceState) -> str:
    return "\n".join([
        f"{'User' if msg['role'] == 'user' else 'Agent'}: {msg['content']}"
        for msg in state["conversation_history"][-3:]
    ])

def _call_openai_api(prompt: str, conversation_context: str, user_input: str) -> Dict[str, Any]:
    client = _get_openai_client()
    user_input = user_input or ""
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": prompt},
            {"role": "user", "content": f"Conversation history: {conversation_context}\n\nCurrent user input: {user_input}"}
        ],
        temperature=0.3,
        max_tokens=500
    )
    content = response.choices[0].message.content if response.choices[0].message.content else ""
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        return {}

def _default_result(response: str, key: str, error: str) -> Dict[str, Any]:
    return {
        "response": response,
        "info_extracted": {key: None},
        "info_complete": False,
        "analysis": error
    }

def extract_name_from_conversation(state: CustomerServiceState) -> Dict[str, Any]:
    try:
        context = _build_conversation_context(state)
        prompt = get_name_extraction_prompt()
        result = _call_openai_api(prompt, context, state.get('last_user_input') or "")
        if result:
            return result
        else:
            return _default_result("Sorry, there was a problem processing your name. Please tell me your name again.", "name", "Parse error")
    except Exception as e:
        return _default_result("Sorry, the system is temporarily unavailable. Please tell me your name again.", "name", f"API error: {str(e)}")

def extract_phone_from_conversation(state: CustomerServiceState) -> Dict[str, Any]:
    try:
        context = _build_conversation_context(state)
        prompt = get_phone_extraction_prompt()
        result = _call_openai_api(prompt, context, state.get('last_user_input') or "")
        if result:
            return result
        else:
            return _default_result("Sorry, there was a problem processing your phone number. Please tell me your phone number again.", "phone", "Parse error")
    except Exception as e:
        return _default_result("Sorry, the system is temporarily unavailable. Please tell me your phone number again.", "phone", f"API error: {str(e)}")

def extract_address_from_conversation(state: CustomerServiceState) -> Dict[str, Any]:
    try:
        context = _build_conversation_context(state)
        prompt = get_address_extraction_prompt()
        result = _call_openai_api(prompt, context, state.get('last_user_input') or "")
        if result:
            return result
        else:
            return _default_result("Sorry, there was a problem processing your address. Please tell me your address again.", "address", "Parse error")
    except Exception as e:
        return _default_result("Sorry, the system is temporarily unavailable. Please tell me your address again.", "address", f"API error: {str(e)}")

def extract_email_from_conversation(state: CustomerServiceState) -> Dict[str, Any]:
    try:
        context = _build_conversation_context(state)
        prompt = get_email_extraction_prompt()
        result = _call_openai_api(prompt, context, state.get('last_user_input') or "")
        if result:
            return result
        else:
            return _default_result("Sorry, there was a problem processing your email. Please tell me your email again.", "email", "Parse error")
    except Exception as e:
        return _default_result("Sorry, the system is temporarily unavailable. Please tell me your email again.", "email", f"API error: {str(e)}")

def extract_service_from_conversation(state: CustomerServiceState) -> Dict[str, Any]:
    try:
        context = _build_conversation_context(state)
        prompt = get_service_extraction_prompt()
        result = _call_openai_api(prompt, context, state.get('last_user_input') or "")
        if result:
            return result
        else:
            return _default_result("Sorry, there was a problem processing your service request. Please tell me what service you need again.", "service", "Parse error")
    except Exception as e:
        return _default_result("Sorry, the system is temporarily unavailable. Please tell me what service you need again.", "service", f"API error: {str(e)}")

def extract_time_from_conversation(state: CustomerServiceState) -> Dict[str, Any]:
    try:
        context = _build_conversation_context(state)
        prompt = get_time_extraction_prompt()
        result = _call_openai_api(prompt, context, state.get('last_user_input') or "")
        if result:
            return result
        else:
            return _default_result("Sorry, there was a problem processing your preferred service time. Please tell me your preferred time again.", "time", "Parse error")
    except Exception as e:
        return _default_result("Sorry, the system is temporarily unavailable. Please tell me your preferred time again.", "time", f"API error: {str(e)}")