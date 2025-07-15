"""
提示词模块

该模块包含所有用于AI客户服务的提示词模板和相关功能。

功能模块：
- customer_info_prompts: 客户信息收集提示词

使用方式：
from app.prompt import customer_info_prompts
from app.prompt.customer_info_prompts import get_name_extraction_prompt
"""

from .customer_info_prompts import (
    get_name_extraction_prompt,
    get_phone_extraction_prompt,
    get_address_extraction_prompt,
    get_email_extraction_prompt,
    get_service_extraction_prompt,
    get_time_extraction_prompt,
    CustomerInfoPrompts
)

__all__ = [
    'get_name_extraction_prompt',
    'get_phone_extraction_prompt',
    'get_address_extraction_prompt',
    'get_email_extraction_prompt',
    'get_service_extraction_prompt',
    'get_time_extraction_prompt',
    'CustomerInfoPrompts'
]