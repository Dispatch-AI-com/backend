"""
Customer Service Type Definitions

This module contains shared type definitions used across the customer service system
to avoid circular import issues.
"""

from typing import TypedDict, Literal, Optional, Dict, List


class CustomerServiceState(TypedDict):
    """Customer service system state definition - Updated for 5-step workflow"""

    # User information - 5-step workflow
    name: Optional[str]
    phone: Optional[str]
    address: Optional[str]  # Complete address string (for backward compatibility)
    street_number: Optional[str]  # House/unit number
    street_name: Optional[str]  # Street name
    suburb: Optional[str]  # Suburb/city
    postcode: Optional[str]  # Postal code
    state: Optional[str]  # State/territory
    service: Optional[str]
    service_id: Optional[str]  # New: service ID
    service_price: Optional[float]  # New: service price
    service_description: Optional[str]  # New: service description
    available_services: Optional[List[Dict]]  # New: all available services
    service_time: Optional[str]
    service_time_mongodb: Optional[str]  # MongoDB datetime format

    # Process control - 5-step workflow
    current_step: Literal[
        "collect_name",
        "collect_phone",
        "collect_address",
        "collect_service",
        "collect_time",
        "completed",
    ]
    name_attempts: int
    phone_attempts: int
    address_attempts: int  # Single address collection
    service_attempts: int
    time_attempts: int
    max_attempts: int
    service_max_attempts: int

    # Last user input and LLM response
    last_user_input: Optional[str]
    last_llm_response: Optional[dict]

    # Status flags - 5-step workflow
    name_complete: bool
    phone_complete: bool
    address_complete: bool  # Overall address completion (all components collected)
    street_number_complete: bool  # Individual component completion flags
    street_name_complete: bool
    suburb_complete: bool
    postcode_complete: bool
    state_complete: bool
    service_complete: bool
    time_complete: bool
    conversation_complete: bool
    service_available: bool
    time_available: bool
