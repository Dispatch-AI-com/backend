"""
Customer Information Extraction Module

Responsible for extracting structured customer information (name, phone, address, service, time) from conversation history using OpenAI API.

Key Features:
- Extracts structured customer info from conversation
- Single string address collection (5-step workflow)
- Unified error handling and fallback
- Standardized return format

"""

import json
import os
from typing import Dict, Any
from datetime import datetime, timezone, timedelta
from openai import AsyncOpenAI
from custom_types import CustomerServiceState

from utils.prompts.customer_info_prompts import (
    get_name_extraction_prompt,
    get_phone_extraction_prompt,
    get_address_extraction_prompt,
    get_service_extraction_prompt,
    get_time_extraction_prompt,
)


# Customer service state uses 5-step workflow: name, phone, address, service, time


def _get_openai_client() -> AsyncOpenAI:
    return AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def _build_conversation_context(state: CustomerServiceState) -> str:
    """Build conversation context - simplified since state info is now in prompt"""
    current_input = state.get("last_user_input") or ""
    return current_input


async def _call_openai_api(
    prompt: str,
    conversation_context: str,
    user_input: str,
    message_history: list = None,
) -> Dict[str, Any]:
    client = _get_openai_client()
    user_input = user_input or ""

    # Build messages array
    messages = [{"role": "system", "content": prompt}]

    # Add message history if provided (last 4 messages)
    if message_history:
        for msg in message_history[-4:]:  # Take last 4 messages
            messages.append(msg)

    # Add current user input
    messages.append({"role": "user", "content": f"User input: {user_input}"})

    print("🔍 [LLM_DEBUG] Sending request to OpenAI:")
    print("  • Model: gpt-4o-mini")
    print(f"  • Messages count: {len(messages)}")
    print(f"  • User input: '{user_input}'")
    print(f"  • System prompt length: {len(messages[0]['content'])} chars")

    try:
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=0.3,
            max_tokens=500,
        )

        print("🔍 [LLM_DEBUG] OpenAI API call successful")
        print(
            f"  • Response choices count: {len(response.choices) if response.choices else 0}"
        )

        if not response.choices:
            print("❌ [LLM_DEBUG] No choices in OpenAI response")
            return {}

        if not response.choices[0].message:
            print("❌ [LLM_DEBUG] No message in first choice")
            return {}

        content = response.choices[0].message.content or ""
        print(
            f"🔍 [LLM_DEBUG] Raw LLM response content (length: {len(content)}): '{content}'"
        )

        if not content:
            print("❌ [LLM_DEBUG] Empty content from OpenAI")
            return {}

    except Exception as api_error:
        print(f"❌ [LLM_DEBUG] OpenAI API call failed: {str(api_error)}")
        return {}

    # Clean the content to handle common LLM response issues
    cleaned_content = content.strip()

    # Remove markdown code blocks if present
    if cleaned_content.startswith("```json"):
        cleaned_content = cleaned_content[7:]  # Remove ```json
    if cleaned_content.startswith("```"):
        cleaned_content = cleaned_content[3:]  # Remove ```
    if cleaned_content.endswith("```"):
        cleaned_content = cleaned_content[:-3]  # Remove trailing ```

    cleaned_content = cleaned_content.strip()

    if cleaned_content != content:
        print(f"🔍 [LLM_DEBUG] Cleaned content: '{cleaned_content}'")

    try:
        parsed_result = json.loads(cleaned_content)
        print("✅ [LLM_DEBUG] Successfully parsed JSON response")
        return parsed_result
    except json.JSONDecodeError as e:
        print(f"❌ [LLM_DEBUG] JSON parsing failed: {str(e)}")
        print(f"❌ [LLM_DEBUG] Raw content that failed to parse: '{cleaned_content}'")

        # Try to extract JSON from the response if it's mixed with other text
        try:
            # Look for JSON pattern in the response
            import re

            json_match = re.search(r"\{.*\}", cleaned_content, re.DOTALL)
            if json_match:
                json_part = json_match.group(0)
                print(
                    f"🔍 [LLM_DEBUG] Attempting to parse extracted JSON: '{json_part}'"
                )
                parsed_result = json.loads(json_part)
                print("✅ [LLM_DEBUG] Successfully parsed extracted JSON")
                return parsed_result
        except (json.JSONDecodeError, Exception):
            pass

        return {}


def _default_result(response: str, key: str, error: str) -> Dict[str, Any]:
    return {
        "response": response,
        "info_extracted": {key: None},
        "info_complete": False,
        "analysis": error,
    }


def _validate_extracted_time(time_mongodb: str, current_time: datetime = None) -> Dict[str, Any]:
    """Validate that extracted time is reasonable
    
    Args:
        time_mongodb: ISO format time string with Z suffix
        current_time: Current time for comparison (defaults to now)
        
    Returns:
        Dict with 'valid' boolean and 'error' string if invalid
    """
    if current_time is None:
        current_time = datetime.now(timezone.utc)
        
    try:
        # Parse the MongoDB time format
        if not time_mongodb.endswith('Z'):
            return {"valid": False, "error": "Time must end with 'Z' for UTC timezone"}
            
        parsed_time = datetime.fromisoformat(time_mongodb.replace('Z', '+00:00'))
        
        print(f"🔍 [TIME_VALIDATION] Parsed time: {parsed_time}")
        print(f"🔍 [TIME_VALIDATION] Current time: {current_time}")
        
        # Check if time is in the future (allow 5 minutes buffer for processing)
        buffer_time = current_time - timedelta(minutes=5)
        if parsed_time <= buffer_time:
            return {"valid": False, "error": "Time must be in the future"}
            
        # Check if time is not too far in future (1 year max)
        max_future = current_time + timedelta(days=365)
        if parsed_time > max_future:
            return {"valid": False, "error": "Time is too far in the future (max 1 year)"}
            
        # Check reasonable business hours (6 AM - 10 PM UTC, roughly covers Australian business hours)
        # Note: This is simplified - in production you'd convert to local timezone
        utc_hour = parsed_time.hour
        if not (22 <= utc_hour <= 23 or 0 <= utc_hour <= 12):  # Rough Australian business hours in UTC
            print(f"⚠️ [TIME_VALIDATION] Time outside typical business hours (UTC hour: {utc_hour})")
            # Don't fail validation, just warn - let business logic decide
            
        print("✅ [TIME_VALIDATION] Time validation passed")
        return {"valid": True}
        
    except Exception as e:
        print(f"❌ [TIME_VALIDATION] Exception during validation: {str(e)}")
        return {"valid": False, "error": f"Invalid time format: {str(e)}"}


# NOTE: _default_street_result removed - address is now single string


def extract_name_from_conversation(
    state: CustomerServiceState, message_history: list = None
) -> Dict[str, Any]:
    try:
        context = _build_conversation_context(state)
        prompt = get_name_extraction_prompt()
        result = _call_openai_api(
            prompt, context, state.get("last_user_input") or "", message_history
        )
        if result:
            return result
        else:
            return _default_result(
                "Sorry, there was a problem processing your name. Please tell me your name again.",
                "name",
                "Parse error",
            )
    except Exception as e:
        return _default_result(
            "Sorry, the system is temporarily unavailable. Please tell me your name again.",
            "name",
            f"API error: {str(e)}",
        )


def extract_phone_from_conversation(
    state: CustomerServiceState, message_history: list = None
) -> Dict[str, Any]:
    try:
        context = _build_conversation_context(state)
        prompt = get_phone_extraction_prompt()
        result = _call_openai_api(
            prompt, context, state.get("last_user_input") or "", message_history
        )
        if result:
            return result
        else:
            return _default_result(
                "Sorry, there was a problem processing your phone number. Please tell me your phone number again.",
                "phone",
                "Parse error",
            )
    except Exception as e:
        return _default_result(
            "Sorry, the system is temporarily unavailable. Please tell me your phone number again.",
            "phone",
            f"API error: {str(e)}",
        )


async def extract_address_from_conversation(
    state: CustomerServiceState, message_history: list = None
) -> Dict[str, Any]:
    """Extract address from conversation with memory of previously collected information and parse into components"""
    try:
        context = _build_conversation_context(state)
        prompt = get_address_extraction_prompt()
        user_input = state.get("last_user_input") or ""

        print("🔍 [ADDRESS_DEBUG] Starting address extraction")
        print(f"🔍 [ADDRESS_DEBUG] Raw user input: '{user_input}'")

        # Build context with existing address components
        existing_components = []
        if state.get("street_number"):
            existing_components.append(f"Street number: {state['street_number']}")
        if state.get("street_name"):
            existing_components.append(f"Street name: {state['street_name']}")
        if state.get("suburb"):
            existing_components.append(f"Suburb: {state['suburb']}")
        if state.get("postcode"):
            existing_components.append(f"Postcode: {state['postcode']}")
        if state.get("state"):
            existing_components.append(f"State: {state['state']}")

        if existing_components:
            context_with_existing = f"Previously collected address components: {', '.join(existing_components)}\nCurrent user input: {user_input}"
            print(
                f"🔍 [ADDRESS_DEBUG] Existing components found: {', '.join(existing_components)}"
            )
        else:
            context_with_existing = f"Current user input: {user_input}"
            print("🔍 [ADDRESS_DEBUG] No existing components, fresh extraction")

        print(f"🔍 [ADDRESS_DEBUG] Context sent to LLM: '{context_with_existing}'")

        # Extract address using the enhanced context
        result = await _call_openai_api(
            prompt, context, context_with_existing, message_history
        )

        print(f"🔍 [ADDRESS_DEBUG] LLM raw response: {result}")

        # Check if we got a valid response structure
        if not result:
            print("❌ [ADDRESS_DEBUG] Empty LLM response (likely JSON parsing failed)")
            return _default_result(
                "Sorry, there was a problem processing your address. Please tell me your address again.",
                "address",
                "Empty LLM response",
            )

        if not isinstance(result, dict):
            print(f"❌ [ADDRESS_DEBUG] Invalid LLM response type: {type(result)}")
            return _default_result(
                "Sorry, there was a problem processing your address. Please tell me your address again.",
                "address",
                f"Invalid response type: {type(result)}",
            )

        # Check for required keys
        if "info_extracted" not in result:
            print("❌ [ADDRESS_DEBUG] Missing 'info_extracted' key in LLM response")
            print(f"❌ [ADDRESS_DEBUG] Available keys: {list(result.keys())}")
            return _default_result(
                "Sorry, there was a problem processing your address. Please tell me your address again.",
                "address",
                "Missing info_extracted key",
            )

        if result and result.get("info_extracted"):
            # Check if any address components were extracted (street_number, street_name, suburb, postcode, state)
            extracted_info = result.get("info_extracted", {})

            print("🔍 [ADDRESS_DEBUG] Extracted components:")
            print(f"  • Street number: '{extracted_info.get('street_number')}'")
            print(f"  • Street name: '{extracted_info.get('street_name')}'")
            print(f"  • Suburb: '{extracted_info.get('suburb')}'")
            print(f"  • Postcode: '{extracted_info.get('postcode')}'")
            print(f"  • State: '{extracted_info.get('state')}'")
            print(f"  • Complete address: '{extracted_info.get('address')}'")
            print(f"  • Info complete: {result.get('info_complete')}")
            print(f"  • LLM analysis: '{result.get('analysis')}'")

            has_any_components = any(
                [
                    extracted_info.get("street_number"),
                    extracted_info.get("street_name"),
                    extracted_info.get("suburb"),
                    extracted_info.get("postcode"),
                    extracted_info.get("state"),
                ]
            )

            if has_any_components:
                # LLM extracted some address components
                print(
                    "✅ [ADDRESS_DEBUG] Successfully extracted components, returning result"
                )
                return result
            else:
                print("❌ [ADDRESS_DEBUG] No address components found in LLM response")
                return _default_result(
                    "Sorry, there was a problem processing your address. Please tell me your address again.",
                    "address",
                    "No address components extracted",
                )
        else:
            print("❌ [ADDRESS_DEBUG] Invalid LLM response structure")
            return _default_result(
                "Sorry, there was a problem processing your address. Please tell me your address again.",
                "address",
                "Parse error",
            )
    except Exception as e:
        print(f"❌ [ADDRESS_DEBUG] Exception occurred: {str(e)}")
        return _default_result(
            "Sorry, the system is temporarily unavailable. Please tell me your street address again.",
            "address",
            f"API error: {str(e)}",
        )


# NOTE: Individual address component extractors removed (suburb, state, postcode)
# Address is now collected as a single string in the 5-step workflow


async def extract_service_from_conversation(
    state: CustomerServiceState, message_history: list = None
) -> Dict[str, Any]:
    try:
        context = _build_conversation_context(state)
        # Get available services from state if available
        available_services = state.get("available_services", None)
        user_input = state.get("last_user_input") or ""

        print("🔍 [SERVICE_DEBUG] Starting service extraction")
        print(f"🔍 [SERVICE_DEBUG] Raw user input: '{user_input}'")
        print(
            f"🔍 [SERVICE_DEBUG] Available services count: {len(available_services) if available_services else 0}"
        )

        if not available_services:
            print("⚠️ [SERVICE_DEBUG] No available services found in state!")

        prompt = get_service_extraction_prompt(available_services)
        print(
            f"🔍 [SERVICE_DEBUG] Generated prompt (first 500 chars): {prompt[:500]}..."
        )
        result = await _call_openai_api(prompt, context, user_input, message_history)

        print(f"🔍 [SERVICE_DEBUG] LLM raw response: {result}")

        # Check if we got a valid response structure
        if not result:
            print("❌ [SERVICE_DEBUG] Empty LLM response (likely JSON parsing failed)")
            return _default_result(
                "Sorry, there was a problem processing your service request. Please tell me what service you need again.",
                "service",
                "Empty LLM response",
            )

        if not isinstance(result, dict):
            print(f"❌ [SERVICE_DEBUG] Invalid LLM response type: {type(result)}")
            return _default_result(
                "Sorry, there was a problem processing your service request. Please tell me what service you need again.",
                "service",
                f"Invalid response type: {type(result)}",
            )

        # Check for required keys
        if "info_extracted" not in result:
            print("❌ [SERVICE_DEBUG] Missing 'info_extracted' key in LLM response")
            print(f"❌ [SERVICE_DEBUG] Available keys: {list(result.keys())}")
            return _default_result(
                "Sorry, there was a problem processing your service request. Please tell me what service you need again.",
                "service",
                "Missing info_extracted key",
            )

        if result and result.get("info_extracted"):
            print("✅ [SERVICE_DEBUG] Successfully extracted service info")
            return result
        else:
            print("❌ [SERVICE_DEBUG] No service info in LLM response")
            return _default_result(
                "Sorry, there was a problem processing your service request. Please tell me what service you need again.",
                "service",
                "No service info extracted",
            )
    except Exception as e:
        print(f"❌ [SERVICE_DEBUG] Exception occurred: {str(e)}")
        return _default_result(
            "Sorry, the system is temporarily unavailable. Please tell me what service you need again.",
            "service",
            f"API error: {str(e)}",
        )


async def extract_time_from_conversation(
    state: CustomerServiceState, message_history: list = None
) -> Dict[str, Any]:
    try:
        context = _build_conversation_context(state)
        prompt = get_time_extraction_prompt()
        user_input = state.get("last_user_input") or ""
        result = await _call_openai_api(
            prompt, context, user_input, message_history
        )
        
        print(f"🔍 [TIME_DEBUG] Starting time extraction for input: '{user_input}'")
        print(f"🔍 [TIME_DEBUG] LLM raw response: {result}")
        
        if result and result.get("info_extracted"):
            extracted_info = result.get("info_extracted", {})
            time_mongodb = extracted_info.get("time_mongodb")
            
            if time_mongodb:
                # Validate the extracted time
                current_time = datetime.now(timezone.utc)
                validation = _validate_extracted_time(time_mongodb, current_time)
                
                print(f"🔍 [TIME_DEBUG] Time validation result: {validation}")
                
                if not validation["valid"]:
                    print(f"❌ [TIME_DEBUG] Invalid time: {validation['error']}")
                    return _default_result(
                        f"The time you provided seems incorrect: {validation['error']}. Could you please provide a valid future time?",
                        "time", 
                        validation["error"]
                    )
                    
                print(f"✅ [TIME_DEBUG] Valid time extracted: {time_mongodb}")
                return result
            else:
                print("❌ [TIME_DEBUG] No MongoDB time generated by LLM")
                return _default_result(
                    "Sorry, I couldn't understand the time you mentioned. Could you please tell me your preferred time again? For example: 'Monday 2pm' or 'tomorrow morning'.",
                    "time",
                    "No time_mongodb field in LLM response",
                )
        else:
            print("❌ [TIME_DEBUG] No info_extracted in LLM response")
            return _default_result(
                "Sorry, there was a problem processing your preferred service time. Please tell me your preferred time again.",
                "time",
                "Parse error",
            )
    except Exception as e:
        return _default_result(
            "Sorry, the system is temporarily unavailable. Please tell me your preferred time again.",
            "time",
            f"API error: {str(e)}",
        )
