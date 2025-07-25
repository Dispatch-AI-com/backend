"""
Prompts Module - LLM Prompt Management

Provides specialized prompt templates for various information extraction tasks.
Updated for 8-step workflow with individual address component collection.
"""
from .customer_info_prompts import (
    get_name_extraction_prompt,
    get_phone_extraction_prompt,
    get_street_extraction_prompt,
    get_suburb_extraction_prompt,
    get_state_extraction_prompt,
    get_postcode_extraction_prompt,
    get_email_extraction_prompt,
    get_service_extraction_prompt,
    get_time_extraction_prompt
)

__all__ = [
    'get_name_extraction_prompt',
    'get_phone_extraction_prompt',
    'get_street_extraction_prompt',
    'get_suburb_extraction_prompt',
    'get_state_extraction_prompt',
    'get_postcode_extraction_prompt',
    'get_email_extraction_prompt',
    'get_service_extraction_prompt',
    'get_time_extraction_prompt'
]