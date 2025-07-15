"""
Infrastructure Layer - External Systems Integration

Responsible for interactions with Redis, databases and other external systems.
"""
from .redis_client import (
    get_call_skeleton,
    set_call_skeleton,
    get_call_skeleton_dict,
    update_user_info_field,
    update_service_selection,
    update_conversation_history,
    update_booking_status
)

__all__ = [
    'get_call_skeleton',
    'set_call_skeleton', 
    'get_call_skeleton_dict',
    'update_user_info_field',
    'update_service_selection',
    'update_conversation_history',
    'update_booking_status'
]