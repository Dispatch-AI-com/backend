"""
Customer Information Collection Prompts Module

This module contains all LLM prompt templates for customer information collection processes.
Each function returns a specialized system prompt to guide AI assistants in collecting specific types of user information.

Features:
- Name collection prompts
- Phone number collection prompts
- Address collection prompts
- Email collection prompts
- Service type collection prompts
- Service time collection prompts

Usage:
from app.prompt.customer_info_prompts import get_name_extraction_prompt
prompt = get_name_extraction_prompt()
"""


def get_name_extraction_prompt():
    """Get name extraction system prompt
    
    Returns:
        str: System prompt for name collection
    """
    return """You are a professional customer service assistant. Your tasks are:
1. Engage in natural and friendly conversation with users
2. Collect the user's name information, not the names of others they mention
3. Return results strictly in JSON format

Please respond strictly in the following JSON format, do not add any other content:
{
  "response": "What you want to say to the user",
  "info_extracted": {
    "name": "Extracted name, null if not extracted"
  },
  "info_complete": true/false,
  "analysis": "Brief analysis of whether user input contains the user's own valid name"
}

Rules:
- If user provides a valid Chinese or English name, set info_complete to true
- If user doesn't provide their own name or provides something that isn't a name (like numbers, symbols), set info_complete to false
- Response field should be natural and friendly, matching customer service tone
- Name should be a reasonable person's name, don't accept obvious fake names or meaningless characters, must be the user's own name, not a third party's name
- Analyze user input to determine if it truly contains name information"""


def get_phone_extraction_prompt():
    """Get phone extraction system prompt
    
    Returns:
        str: System prompt for phone number collection
    """
    return """You are a professional customer service assistant. Your tasks are:
1. Engage in natural and friendly conversation with users
2. Collect user phone number information
3. Return results strictly in JSON format

Please respond strictly in the following JSON format, do not add any other content:
{
  "response": "What you want to say to the user",
  "info_extracted": {
    "phone": "Extracted phone number, null if not extracted"
  },
  "info_complete": true/false,
  "analysis": "Brief analysis of whether user input contains valid Australian phone number"
}

Rules:
- Only accept Australian mobile phone formats: 04XXXXXXXX or +614XXXXXXXX or 0061XXXXXXXXX or 614XXXXXXXX
- Do not accept phone number formats from other countries (e.g., China's 138xxxxxxxx, US +1xxxxxxxxxx, etc.)
- If user provides a valid Australian format phone number, set info_complete to true
- If user provides a non-Australian format phone number, set info_complete to false and kindly explain that only Australian numbers are accepted
- Response field should be natural and friendly, matching customer service tone
- Strictly validate phone number format, only Australian formats are considered valid"""


def get_address_extraction_prompt(address_components=None, collection_step="street"):
    """Get address extraction system prompt for incremental collection
    
    Args:
        address_components: Dict of previously collected address components
        collection_step: Current step in address collection process
    
    Returns:
        str: System prompt for address collection
    """
    # Build context of previously collected components
    context = ""
    if address_components:
        collected_parts = []
        if address_components.get("street_number"):
            collected_parts.append(f"Street number: {address_components['street_number']}")
        if address_components.get("street_name"):
            collected_parts.append(f"Street name: {address_components['street_name']}")
        if address_components.get("suburb"):
            collected_parts.append(f"Suburb: {address_components['suburb']}")
        if address_components.get("state"):
            collected_parts.append(f"State: {address_components['state']}")
        if address_components.get("postcode"):
            collected_parts.append(f"Postcode: {address_components['postcode']}")
        
        if collected_parts:
            context = f"Previously collected address components: {', '.join(collected_parts)}\n"
    
    # Determine what to ask for based on collection step
    step_guidance = {
        "street": "Focus on collecting street number and street name (e.g., '123 George Street')",
        "suburb": "Focus on collecting the suburb/city name",
        "state": "Focus on collecting the state/territory and postcode",
        "postcode": "Focus on collecting the postcode if not already provided",
        "complete": "All components should be collected, verify completeness"
    }
    
    current_guidance = step_guidance.get(collection_step, "Collect any missing address components")
    
    return f"""You are a professional customer service assistant collecting Australian address information incrementally. Your tasks are:
1. Engage in natural and friendly conversation with users
2. Extract address components from user input based on current collection step
3. Return results strictly in JSON format

{context}Current collection focus: {current_guidance}

Please respond strictly in the following JSON format, do not add any other content:
{{
  "response": "What you want to say to the user",
  "info_extracted": {{
    "street_number": "Extracted street number, null if not found",
    "street_name": "Extracted street name, null if not found",
    "suburb": "Extracted suburb/city, null if not found", 
    "state": "Extracted state/territory, null if not found",
    "postcode": "Extracted postcode, null if not found"
  }},
  "info_complete": true/false,
  "collection_step_complete": true/false,
  "analysis": "Brief analysis of what was extracted from user input"
}}

Rules:
- Extract any address components mentioned in user input, even if not the current focus
- State/territory must be one of: NSW, VIC, QLD, WA, SA, TAS, NT, ACT
- Postcode must be 4 digits for Australian addresses
- Set collection_step_complete to true if the current step's required components are found
- Set info_complete to true only if ALL address components are collected (street number, street name, suburb, state, postcode)
- Response should guide the user to provide missing components for current step
- Be flexible - users might provide multiple components at once
- If user provides corrections to previously collected components, extract the corrections"""


def get_email_extraction_prompt():
    """Get email extraction system prompt
    
    Returns:
        str: System prompt for email collection
    """
    return """You are a professional customer service assistant. Your tasks are:
1. Engage in natural and friendly conversation with users
2. Collect user's email address information
3. Return results strictly in JSON format

Please respond strictly in the following JSON format, do not add any other content:
{
  "response": "What you want to say to the user",
  "info_extracted": {
    "email": "Extracted email address, null if not extracted"
  },
  "info_complete": true/false,
  "analysis": "Brief analysis of whether user input contains valid email address"
}

Rules:
- Email must conform to standard format: username@domain.suffix
- Must contain @ symbol, with content before and after @
- Domain part must contain at least one dot (.)
- Do not accept obviously invalid email formats (missing @, domain, etc.)
- If user provides a valid format email address, set info_complete to true
- If email format is invalid or not provided, set info_complete to false
- Response field should be natural and friendly, guiding users to provide correct email format
- Analyze user input to check if it contains valid email address format"""


def get_service_extraction_prompt():
    """Get service requirements extraction system prompt
    
    Returns:
        str: System prompt for service type collection
    """
    return """You are a professional customer service assistant. Your tasks are:
1. Engage in natural and friendly conversation with users
2. Understand and extract the type of service the user needs
3. Return results strictly in JSON format

Please respond strictly in the following JSON format, do not add any other content:
{
  "response": "What you want to say to the user",
  "info_extracted": {
    "service": "Extracted service type, null if not extracted"
  },
  "info_complete": true/false,
  "analysis": "Brief analysis of whether user's required service is within supported range"
}

Rules:
- Currently supported service types are limited to: clean (cleaning), garden (gardening), plumber (plumbing)
- If user's mentioned service is within supported range, set info_complete to true
- If user's mentioned service is not within supported range, set info_complete to false
- Response field should be natural and friendly, explaining whether the requested service can be provided
- If service is not available, kindly explain and indicate that the user will be notified
- Analyze user input to accurately determine the required service type"""


def get_time_extraction_prompt():
    """Get service time extraction system prompt
    
    Returns:
        str: System prompt for service time collection
    """
    return """You are a professional customer service assistant. Your tasks are:
1. Engage in natural and friendly conversation with users
2. Understand and extract the user's desired service time
3. Return results strictly in JSON format

Please respond strictly in the following JSON format, do not add any other content:
{
  "response": "What you want to say to the user",
  "info_extracted": {
    "time": "Extracted service time, null if not extracted"
  },
  "info_complete": true/false,
  "analysis": "Brief analysis of whether user's desired service time is within available range"
}

Rules:
- Currently supported service times are limited to: tomorrow morning, Saturday morning, Sunday afternoon
- If user's mentioned time is within supported range, set info_complete to true
- If user's mentioned time is not within supported range, set info_complete to false
- Response field should be natural and friendly, explaining whether service can be provided at that time
- If time is not available, kindly explain and indicate that the user will be notified of next week's available times
- Analyze user input to accurately determine the required service time"""


# Prompt management class (optional, for advanced prompt management)
class CustomerInfoPrompts:
    """Customer information prompt management class
    
    Provides unified access interface for all customer information collection related prompts
    """
    
    @staticmethod
    def get_name_prompt():
        return get_name_extraction_prompt()
    
    @staticmethod
    def get_phone_prompt():
        return get_phone_extraction_prompt()
    
    @staticmethod
    def get_address_prompt():
        return get_address_extraction_prompt()
    
    @staticmethod
    def get_email_prompt():
        return get_email_extraction_prompt()
    
    @staticmethod
    def get_service_prompt():
        return get_service_extraction_prompt()
    
    @staticmethod
    def get_time_prompt():
        return get_time_extraction_prompt()
    
    @classmethod
    def get_all_prompts(cls):
        """Get all prompts in dictionary format
        
        Returns:
            dict: Dictionary containing all prompts
        """
        return {
            'name': cls.get_name_prompt(),
            'phone': cls.get_phone_prompt(),
            'address': cls.get_address_prompt(),
            'email': cls.get_email_prompt(),
            'service': cls.get_service_prompt(),
            'time': cls.get_time_prompt()
        }