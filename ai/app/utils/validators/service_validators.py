from typing import Dict, Any, List
from datetime import datetime


def validate_service_info(service_info: Dict[str, Any]) -> bool:
    """Validate service info structure."""
    if not service_info or not isinstance(service_info, dict):
        return False
    
    # Check required fields
    if "name" not in service_info:
        return False
    
    if not isinstance(service_info["name"], str) or not service_info["name"].strip():
        return False
    
    # Check optional fields
    if "booked" in service_info and not isinstance(service_info["booked"], bool):
        return False
    
    return True


def validate_service_booking(booking_data: Dict[str, Any]) -> bool:
    """Validate service booking data structure."""
    if not booking_data or not isinstance(booking_data, dict):
        return False
    
    required_fields = ["service_type", "customer_info"]
    for field in required_fields:
        if field not in booking_data:
            return False
    
    # Validate service type
    if not isinstance(booking_data["service_type"], str):
        return False
    
    # Validate customer info
    customer_info = booking_data["customer_info"]
    if not isinstance(customer_info, dict):
        return False
    
    customer_required = ["name", "phone"]
    for field in customer_required:
        if field not in customer_info:
            return False
        if not isinstance(customer_info[field], str) or not customer_info[field].strip():
            return False
    
    # Validate optional booking details
    if "booking_details" in booking_data:
        booking_details = booking_data["booking_details"]
        if not isinstance(booking_details, dict):
            return False
        
        # Validate date format if provided
        if "date" in booking_details:
            try:
                datetime.strptime(booking_details["date"], "%Y-%m-%d")
            except ValueError:
                return False
        
        # Validate time format if provided
        if "time" in booking_details:
            try:
                datetime.strptime(booking_details["time"], "%H:%M")
            except ValueError:
                return False
    
    return True


def validate_service_types(service_types: List[str]) -> bool:
    """Validate service type list."""
    if not service_types or not isinstance(service_types, list):
        return False
    
    valid_services = {
        "plumbing", "electrical", "hvac", "locksmith", 
        "appliance_repair", "pest_control", "cleaning",
        "handyman", "painting", "flooring", "roofing",
        "landscaping", "moving", "security_system"
    }
    
    for service in service_types:
        if not isinstance(service, str) or service.lower() not in valid_services:
            return False
    
    return True


def validate_service_area(location: str, service_areas: List[str]) -> bool:
    """Validate if service is available in the given location."""
    if not location or not isinstance(location, str):
        return False
    
    if not service_areas or not isinstance(service_areas, list):
        return False
    
    location_lower = location.lower()
    
    for area in service_areas:
        if isinstance(area, str) and area.lower() in location_lower:
            return True
    
    return False


def validate_service_pricing(pricing_data: Dict[str, Any]) -> bool:
    """Validate service pricing structure."""
    if not pricing_data or not isinstance(pricing_data, dict):
        return False
    
    required_fields = ["service_type", "base_price"]
    for field in required_fields:
        if field not in pricing_data:
            return False
    
    # Validate base price
    base_price = pricing_data["base_price"]
    if not isinstance(base_price, (int, float)) or base_price < 0:
        return False
    
    # Validate optional fields
    if "additional_fees" in pricing_data:
        additional_fees = pricing_data["additional_fees"]
        if not isinstance(additional_fees, dict):
            return False
        
        for fee_name, fee_amount in additional_fees.items():
            if not isinstance(fee_amount, (int, float)) or fee_amount < 0:
                return False
    
    # Validate discounts if present
    if "discounts" in pricing_data:
        discounts = pricing_data["discounts"]
        if not isinstance(discounts, dict):
            return False
        
        for discount_type, discount_value in discounts.items():
            if not isinstance(discount_value, (int, float)) or discount_value < 0:
                return False
    
    return True


def validate_service_availability(
    service_type: str, 
    requested_date: str, 
    requested_time: str,
    availability_data: Dict[str, Any]
) -> bool:
    """Validate service availability for requested date and time."""
    if not all([service_type, requested_date, requested_time]):
        return False
    
    if not availability_data or not isinstance(availability_data, dict):
        return False
    
    # Validate date format
    try:
        datetime.strptime(requested_date, "%Y-%m-%d")
    except ValueError:
        return False
    
    # Validate time format
    try:
        datetime.strptime(requested_time, "%H:%M")
    except ValueError:
        return False
    
    # Check if service type is available
    if service_type not in availability_data:
        return False
    
    service_availability = availability_data[service_type]
    
    # Check if date is available
    if "available_dates" in service_availability:
        available_dates = service_availability["available_dates"]
        if requested_date not in available_dates:
            return False
    
    # Check if time slot is available
    if "available_times" in service_availability:
        available_times = service_availability["available_times"]
        if requested_time not in available_times:
            return False
    
    return True