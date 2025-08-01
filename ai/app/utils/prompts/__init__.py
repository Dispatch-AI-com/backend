"""
Prompts Module - LLM Prompt Management

Provides specialized prompt templates for various information extraction tasks.
Updated for 5-step workflow (name, phone, address, service, time).
"""
from .customer_info_prompts import (
    get_name_extraction_prompt,
    get_phone_extraction_prompt,
    get_address_extraction_prompt,
    get_service_extraction_prompt,
    get_time_extraction_prompt
)

__all__ = [
    'get_name_extraction_prompt',
    'get_phone_extraction_prompt',
    'get_address_extraction_prompt',
    'get_service_extraction_prompt',
    'get_time_extraction_prompt'
]