"""
Customer Service Type Definitions

This module contains shared type definitions used across the customer service system
to avoid circular import issues.
"""

from typing import TypedDict, Literal, Optional, Dict, List


class CustomerServiceState(TypedDict):
    """Customer service system state definition - Updated for 5-step workflow"""
    # User information
    name: Optional[str]
    phone: Optional[str]
    address: Optional[str]      # New: only address is required. 
    #suburb: Optional[str]      # remove: suburb
    #state: Optional[str]       # remove: state/territory
    #postcode: Optional[str]    # remove: postcode
    service: Optional[str]
    service_id: Optional[str]        # New: service ID
    service_price: Optional[float]   # New: service price
    service_description: Optional[str] # New: service description
    available_services: Optional[List[Dict]] # New: all available services
    service_time: Optional[str]
    service_time_mongodb: Optional[str]  # MongoDB datetime format
    
    # Process control - Updated for 5-step workflow (removed email)
    current_step: Literal["collect_name", "collect_phone", "collect_address", "collect_service", "collect_time", "completed"]
    name_attempts: int
    phone_attempts: int
    address_attempts: int       # New: only address is required.
    #suburb_attempts: int       # remove
    #state_attempts: int        # remove
    #postcode_attempts: int     # remove
    service_attempts: int
    time_attempts: int
    max_attempts: int
    service_max_attempts: int
    
    # Last user input and LLM response
    last_user_input: Optional[str]
    last_llm_response: Optional[dict]
    
    # Status flags - Updated for 7-step workflow (removed email)
    name_complete: bool
    phone_complete: bool
    address_complete: bool      # New:only address is requried. 
    #suburb_complete: bool      # New
    #state_complete: bool       # New
    #postcode_complete: bool    # New
    service_complete: bool
    time_complete: bool
    conversation_complete: bool
    service_available: bool
    time_available: bool