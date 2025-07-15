"""
验证模块

该模块包含所有用于验证客户信息有效性的函数和相关功能。

功能模块：
- customer_validators: 客户信息验证器

使用方式：
from app.validate import customer_validators
from app.validate.customer_validators import validate_name, validate_phone
"""

from .customer_validators import (
    validate_name,
    validate_phone,
    validate_address,
    validate_email,
    validate_service,
    validate_time,
    CustomerValidators
)

__all__ = [
    'validate_name',
    'validate_phone',
    'validate_address',
    'validate_email',
    'validate_service',
    'validate_time',
    'CustomerValidators'
]