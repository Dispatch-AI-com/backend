"""
Customer Information Validation Module

This module contains all functions for validating customer information validity.
Each validation function is responsible for checking specific types of user input data, 
ensuring data format is correct and complies with business rules.

Features:
- Name validation
- Phone number validation (Australian format)
- Address validation (Australian format)
- Email validation (RFC 5321 standard)
- Service type validation
- Service time validation

Usage:
from app.validate.customer_validators import validate_name, validate_phone
is_valid = validate_name("John Smith")
"""

import re
from typing import Tuple


def validate_name(name: str) -> bool:
    """Validate name validity
    
    Args:
        name (str): Name to be validated
        
    Returns:
        bool: Whether the name is valid
        
    Validation rules:
        - Length between 1-50 characters
        - Does not contain special symbols (@, #, $, %, ^, &, *, (, ), =, +, {, }, [, ])
        - Cannot be pure numbers
        - Cannot be empty or contain only spaces
    """
    if not name or name.strip() == "":
        return False
    
    name = name.strip()
    
    if len(name) < 1 or len(name) > 50:
        return False
        
    invalid_chars = ['@', '#', '$', '%', '^', '&', '*', '(', ')', '=', '+', '{', '}', '[', ']']
    if any(char in name for char in invalid_chars):
        return False
        
    if name.isdigit():
        return False
        
    return True


def validate_phone(phone: str) -> bool:
    """Validate phone number validity (Australian format only)
    
    Args:
        phone (str): Phone number to be validated
        
    Returns:
        bool: Whether the phone number is valid
        
    Supported Australian mobile phone formats:
        - 04XXXXXXXX
        - +614XXXXXXXX  
        - 00614XXXXXXXX
        - 614XXXXXXXX
    """
    if not phone or phone.strip() == "":
        return False
    
    phone = phone.strip()
    
    # Australian mobile phone formats
    australian_patterns = [
        r'^04\d{8}$',  # 04XXXXXXXX
        r'^\+614\d{8}$',  # +614XXXXXXXX
        r'^00614\d{8}$',  # 00614XXXXXXXX
        r'^614\d{8}$',  # 614XXXXXXXX
    ]
    
    # Clean phone number (remove spaces, hyphens, etc.)
    cleaned_phone = re.sub(r'[\s\-\(\)]', '', phone)
    
    for pattern in australian_patterns:
        if re.match(pattern, cleaned_phone):
            return True
            
    return False


def validate_address(address: str) -> bool:
    """Validate Australian address validity
    
    Args:
        address (str): Address to be validated
        
    Returns:
        bool: Whether the address is valid
        
    Validation rules:
        - Length between 5-200 characters
        - Must contain at least 4 of the following components:
          1. Street number (digits)
          2. Street name and type (Street, St, Road, Rd, Avenue, Ave, etc.)
          3. City/suburb name
          4. State/territory (NSW, VIC, QLD, WA, SA, TAS, NT, ACT)
          5. Postcode (4 digits)
    """
    if not address or address.strip() == "":
        return False
    
    address = address.strip()
    
    # Validate basic length
    if len(address) < 5 or len(address) > 200:
        return False
    
    # Validate if necessary components are included
    required_components = [
        r'\d+',  # Street number
        r'[A-Za-z\s]+(Street|St|Road|Rd|Avenue|Ave|Drive|Dr|Lane|Ln|Place|Pl|Way|Parade|Pde|Circuit|Cct|Close|Cl)',  # Extended street types
        r'[A-Za-z\s]+',  # City/suburb name - more flexible matching
        r'(NSW|VIC|QLD|WA|SA|TAS|NT|ACT)',  # State/territory
        r'\d{4}'  # Postcode
    ]
    
    # Convert address to uppercase for case-insensitive matching
    upper_address = address.upper()
    
    # Check if each necessary component exists
    matches = 0
    for pattern in required_components:
        if re.search(pattern, upper_address, re.IGNORECASE):
            matches += 1
    
    # If at least 4 components match, consider address valid
    # This allows some flexibility, such as street type abbreviations that might not be in our list
    return matches >= 4


def validate_email(email: str) -> bool:
    """Validate email address validity
    
    Args:
        email (str): Email address to be validated
        
    Returns:
        bool: Whether the email address is valid
        
    Validation rules (following RFC 5321 standard):
        - Total length between 5-254 characters
        - Contains exactly one @ symbol
        - Username part no more than 64 characters
        - Domain part no more than 253 characters and contains at least one dot
        - Domain cannot start or end with a dot
        - Cannot contain consecutive dots
        - Conforms to standard email format regex
    """
    if not email or email.strip() == "":
        return False
    
    email = email.strip()
    
    # Basic length check
    if len(email) < 5 or len(email) > 254:  # RFC 5321 standard
        return False
    
    # Check if contains @ symbol, and only one
    if email.count('@') != 1:
        return False
    
    # Split username and domain parts
    local_part, domain_part = email.split('@')
    
    # Validate username part (cannot be empty)
    if not local_part or len(local_part) > 64:  # RFC 5321 standard
        return False
    
    # Validate domain part
    if not domain_part or len(domain_part) > 253:  # RFC 5321 standard
        return False
    
    # Domain must contain at least one dot
    if '.' not in domain_part:
        return False
    
    # Simple regex validation
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    
    if not re.match(email_pattern, email):
        return False
    
    # Check if domain part starts or ends with a dot
    if domain_part.startswith('.') or domain_part.endswith('.'):
        return False
    
    # Check for consecutive dots
    if '..' in email:
        return False
    
    return True


def validate_service(service: str) -> Tuple[bool, bool]:
    """Validate service type validity
    
    Args:
        service (str): Service type to be validated
        
    Returns:
        Tuple[bool, bool]: (Is valid input, Is service available)
        
    Supported service types:
        - clean (cleaning)
        - garden (gardening)  
        - plumber (plumbing)
    """
    if not service or service.strip() == "":
        return False, False
    
    service = service.strip().lower()
    
    # Supported service types list
    supported_services = ['clean', 'garden', 'plumber']
    
    # Check if service is in supported list
    service_available = service in supported_services
    
    return True, service_available


def validate_time(service_time: str) -> Tuple[bool, bool]:
    """Validate service time validity
    
    Args:
        service_time (str): Service time to be validated
        
    Returns:
        Tuple[bool, bool]: (Is valid input, Is time available)
        
    Supported service times:
        - tomorrow morning
        - saturday morning  
        - sunday afternoon
    """
    if not service_time or service_time.strip() == "":
        return False, False
    
    service_time = service_time.strip().lower()
    
    # Supported service times list
    supported_times = ['tomorrow morning', 'saturday morning', 'sunday afternoon']
    
    # Check if time is in supported list
    time_available = service_time in supported_times
    
    return True, time_available


# Validator management class (optional, for advanced validation management)
class CustomerValidators:
    """Customer information validator management class
    
    Provides unified access interface for all customer information validation related functions
    """
    
    @staticmethod
    def validate_name(name: str) -> bool:
        return validate_name(name)
    
    @staticmethod
    def validate_phone(phone: str) -> bool:
        return validate_phone(phone)
    
    @staticmethod
    def validate_address(address: str) -> bool:
        return validate_address(address)
    
    @staticmethod
    def validate_email(email: str) -> bool:
        return validate_email(email)
    
    @staticmethod
    def validate_service(service: str) -> Tuple[bool, bool]:
        return validate_service(service)
    
    @staticmethod
    def validate_time(service_time: str) -> Tuple[bool, bool]:
        return validate_time(service_time)
    
    @classmethod
    def validate_all_user_info(cls, name: str, phone: str, address: str, email: str) -> dict:
        """Validate all user basic information
        
        Args:
            name (str): Name
            phone (str): Phone number
            address (str): Address
            email (str): Email
            
        Returns:
            dict: Dictionary containing all validation results
        """
        return {
            'name_valid': cls.validate_name(name),
            'phone_valid': cls.validate_phone(phone),
            'address_valid': cls.validate_address(address),
            'email_valid': cls.validate_email(email)
        }
    
    @classmethod
    def validate_service_info(cls, service: str, service_time: str) -> dict:
        """Validate service-related information
        
        Args:
            service (str): Service type
            service_time (str): Service time
            
        Returns:
            dict: Dictionary containing service validation results
        """
        service_valid, service_available = cls.validate_service(service)
        time_valid, time_available = cls.validate_time(service_time)
        
        return {
            'service_valid': service_valid,
            'service_available': service_available,
            'time_valid': time_valid,
            'time_available': time_available
        }