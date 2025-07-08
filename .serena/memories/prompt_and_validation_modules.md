# Prompt and Validation Modules

## Prompt Module (`ai/app/prompt/customer_info_prompts.py`)

### Purpose
Contains all LLM prompt templates for customer information collection.

### Key Functions
- `get_name_extraction_prompt()`: Prompt for extracting customer names
- `get_phone_extraction_prompt()`: Prompt for extracting Australian phone numbers
- `get_address_extraction_prompt()`: Prompt for extracting Australian addresses
- `get_email_extraction_prompt()`: Prompt for extracting email addresses
- `get_service_extraction_prompt()`: Prompt for extracting service types
- `get_time_extraction_prompt()`: Prompt for extracting service times

### Prompt Structure
All prompts follow consistent JSON response format:
```json
{
  "response": "Customer-facing message",
  "info_extracted": {"field": "extracted_value"},
  "info_complete": true/false,
  "analysis": "Analysis of extraction success"
}
```

## Validation Module (`ai/app/validate/customer_validators.py`)

### Purpose
Validates extracted customer information against business rules.

### Key Functions
- `validate_name(name)`: Validates name format and content
- `validate_phone(phone)`: Validates Australian phone number formats
- `validate_address(address)`: Validates Australian address components
- `validate_email(email)`: Validates email format (RFC 5321)
- `validate_service(service)`: Validates service availability
- `validate_time(service_time)`: Validates time slot availability

### Validation Rules
- **Phone**: Australian formats only (04XXXXXXXX, +614XXXXXXXX, etc.)
- **Address**: Must include street number, street name, city, state, postcode
- **Email**: Standard RFC 5321 format validation
- **Service**: Only supports 'clean', 'garden', 'plumber'
- **Time**: Only supports 'tomorrow morning', 'saturday morning', 'sunday afternoon'