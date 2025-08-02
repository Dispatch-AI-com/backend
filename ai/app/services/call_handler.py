"""
AI Customer Service Workflow Controller - 5-Step Simplified Version

Focuses on workflow control and business logic processing, with prompts and validation functions decoupled to independent modules.

Main Responsibilities:
- Manage customer information collection workflow (5-step process: Name → Phone → Address → Service → Time)
- Handle conversation state and transitions
- Coordinate LLM interactions with speech correction
- Manage Redis data updates
- Handle exceptions and error recovery

Architecture Description:
- Prompt module: app.utils.prompts.customer_info_prompts
- Extractors module: app.services.retrieve.customer_info_extractors
- Speech correction: SimplifiedSpeechCorrector for Australian address accuracy
- Workflow control: This file (call_handler.py)
"""

import json
from typing import Optional
from openai import OpenAI

# Import shared types
from custom_types import CustomerServiceState

# Import decoupled modules
from .retrieve.customer_info_extractors import (
    extract_name_from_conversation,
    extract_phone_from_conversation,
    extract_address_from_conversation,
    # extract_suburb_from_conversation,
    # extract_state_from_conversation,
    # extract_postcode_from_conversation,
    extract_service_from_conversation,
    extract_time_from_conversation,
)

from .redis_service import (
    update_user_info_field,
    update_service_selection,
    update_booking_status,
    get_message_history,
)

from .llm_speech_corrector import SimplifiedSpeechCorrector
from config import settings


class CustomerServiceLangGraph:
    """Customer service workflow controller - 5-Step Simplified Workflow

    Main responsibility is to manage the entire customer information collection process:
    1. Name Collection
    2. Phone Collection  
    3. Address Collection (single string with speech correction)
    4. Service Selection
    5. Time/Booking Completion
    """

    def _replace_service_placeholders(
        self, response_text: str, state: CustomerServiceState
    ) -> str:
        """Replace service-related placeholders in LLM response with actual values"""
        if not response_text:
            return response_text

        # Get available services
        available_services = state.get("available_services", [])
        
        print(f"🔍 [PLACEHOLDER_REPLACEMENT] Processing response: '{response_text[:100]}...'")
        print(f"🔍 [PLACEHOLDER_REPLACEMENT] Available services count: {len(available_services)}")
        print(f"🔍 [PLACEHOLDER_REPLACEMENT] Contains {{services_list}}: {'{{services_list}}' in response_text}")
        print(f"🔍 [PLACEHOLDER_REPLACEMENT] Contains {{services_list}}: {'{services_list}' in response_text}")

        # Replace {{services_list}} placeholder (double braces)
        if "{{services_list}}" in response_text:
            services_list = ""
            for service in available_services:
                price_text = (
                    f"${service['price']}"
                    if service.get("price")
                    else "Price on request"
                )
                services_list += f"• {service['name']}: {price_text}\n"

            response_text = response_text.replace(
                "{{services_list}}", services_list.strip()
            )
            print(f"🔍 [PLACEHOLDER_REPLACEMENT] Replaced {{services_list}} with: {services_list.strip()}")
        
        # Replace {services_list} placeholder (single braces) - fallback for LLM variations
        if "{services_list}" in response_text:
            services_list = ""
            for service in available_services:
                price_text = (
                    f"${service['price']}"
                    if service.get("price")
                    else "Price on request"
                )
                services_list += f"• {service['name']}: {price_text}\n"

            response_text = response_text.replace(
                "{services_list}", services_list.strip()
            )
            print(f"🔍 [PLACEHOLDER_REPLACEMENT] Replaced {{services_list}} with: {services_list.strip()}")

        # Replace selected service placeholders
        if (
            "{{selected_service_name}}" in response_text
            or "{{selected_service_price}}" in response_text
        ):
            # Try to find the selected service from available services
            extracted_service = state.get("service")
            selected_service = None

            if extracted_service:
                for service in available_services:
                    if service["name"].lower() == extracted_service.lower():
                        selected_service = service
                        break

            if selected_service:
                response_text = response_text.replace(
                    "{{selected_service_name}}", selected_service["name"]
                )
                price_text = (
                    f"{selected_service['price']}"
                    if selected_service.get("price")
                    else "Price on request"
                )
                response_text = response_text.replace(
                    "{{selected_service_price}}", price_text
                )
            else:
                # Fallback if service not found
                response_text = response_text.replace(
                    "{{selected_service_name}}",
                    extracted_service or "the selected service",
                )
                response_text = response_text.replace(
                    "{{selected_service_price}}", "Price on request"
                )

        print(f"🔍 [PLACEHOLDER_REPLACEMENT] Final response: '{response_text[:100]}...'")
        return response_text

    def _generate_closing_message(
        self, state: CustomerServiceState, booking_failed: bool = False
    ) -> str:
        """Generate closing message when conversation is completed"""
        # Extract booking information
        customer_name = state.get("name", "")
        service_name = state.get("service", "")
        service_time = state.get("service_time", "")

        if booking_failed:
            # Message for failed booking (usually due to time collection failure)
            return (
                f"Thank you {customer_name}! I have your contact information and service preference for {service_name}. "
                f"Our team will contact you shortly to confirm the booking details and schedule. "
                f"Thank you for calling us today. Have a great day and goodbye!"
            )
        else:
            # Message for successful booking
            return (
                f"Perfect! Thank you {customer_name}. I have successfully recorded your booking for {service_name} "
                f"on {service_time}. Your booking is confirmed and we will send you a confirmation shortly. "
                f"Thank you for choosing our service today. Have a great day and goodbye!"
            )

    def __init__(self, api_key=None):
        """Initialize customer service system"""
        if api_key:
            self.client = OpenAI(api_key=api_key)
        else:
            self.client = OpenAI(api_key=settings.openai_api_key)

        # Initialize speech corrector
        self.speech_corrector = SimplifiedSpeechCorrector(api_key=api_key)

        # Create LangGraph workflow - using simplified approach
        self.workflow = None

    # ================== Information Collection Processing Functions ==================

    def process_name_collection(
        self, state: CustomerServiceState, call_sid: Optional[str] = None
    ):
        """Process name collection step"""
        # Initialize attempts counter if not present
        if "name_attempts" not in state or state["name_attempts"] is None:
            state["name_attempts"] = 0

        # Initialize max_attempts if not present
        if "max_attempts" not in state or state["max_attempts"] is None:
            state["max_attempts"] = settings.max_attempts

        # Get message history from Redis
        message_history = []
        if call_sid:
            message_history = get_message_history(call_sid)
        
        # Call LLM to extract name
        result = extract_name_from_conversation(state, message_history)
        state["last_llm_response"] = result

        # Check if name was extracted
        extracted_name = result["info_extracted"].get("name")
        is_complete = result["info_complete"]

        if is_complete and extracted_name:
            # Clean and standardize name
            cleaned_name = extracted_name.strip()

            # Local state update
            state["name"] = cleaned_name
            state["name_complete"] = True
            state["current_step"] = "collect_phone"

            # Real-time Redis update
            if call_sid:
                redis_success = update_user_info_field(
                    call_sid=call_sid, field_name="name", field_value=cleaned_name
                )

                if redis_success:
                    print(f"✅ Name extracted and saved successfully: {cleaned_name}")
                else:
                    print(
                        f"⚠️ Name extracted successfully but Redis save failed: {cleaned_name}"
                    )

            print(f"✅ Name collection completed: {cleaned_name}")
        else:
            # Increment attempt count
            state["name_attempts"] += 1

            if state["name_attempts"] >= state["max_attempts"]:
                print(
                    f"❌ Name collection failed, reached maximum attempts ({state['max_attempts']})"
                )
                state["current_step"] = "collect_phone"  # Skip to next step
            else:
                print(
                    f"⚠️ Name extraction failed, attempt: {state['name_attempts']}/{state['max_attempts']}"
                )

        return state

    def process_phone_collection(
        self, state: CustomerServiceState, call_sid: Optional[str] = None
    ):
        """Process phone collection step"""
        # Initialize attempts counter if not present
        if "phone_attempts" not in state or state["phone_attempts"] is None:
            state["phone_attempts"] = 0

        # Initialize max_attempts if not present
        if "max_attempts" not in state or state["max_attempts"] is None:
            state["max_attempts"] = settings.max_attempts

        # Get message history from Redis
        message_history = []
        if call_sid:
            message_history = get_message_history(call_sid)
        
        # Call LLM to extract phone
        result = extract_phone_from_conversation(state, message_history)
        state["last_llm_response"] = result

        # Check if phone was extracted
        extracted_phone = result["info_extracted"].get("phone")
        is_complete = result["info_complete"]

        if is_complete and extracted_phone:
            # Clean and standardize phone
            cleaned_phone = extracted_phone.strip()

            # Local state update
            state["phone"] = cleaned_phone
            state["phone_complete"] = True
            state["current_step"] = "collect_address"

            # Real-time Redis update
            if call_sid:
                redis_success = update_user_info_field(
                    call_sid=call_sid, field_name="phone", field_value=cleaned_phone
                )

                if redis_success:
                    print(f"✅ Phone extracted and saved successfully: {cleaned_phone}")
                else:
                    print(
                        f"⚠️ Phone extracted successfully but Redis save failed: {cleaned_phone}"
                    )

            print(f"✅ Phone collection completed: {cleaned_phone}")
        else:
            # Increment attempt count
            state["phone_attempts"] += 1

            if state["phone_attempts"] >= state["max_attempts"]:
                print(
                    f"❌ Phone collection failed, reached maximum attempts ({state['max_attempts']})"
                )
                state["current_step"] = "collect_address"  # Skip to next step
            else:
                print(
                    f"⚠️ Phone extraction failed, attempt: {state['phone_attempts']}/{state['max_attempts']}"
                )

        return state

    async def process_address_collection(
        self, state: CustomerServiceState, call_sid: Optional[str] = None
    ):
        """Process address collection step with speech correction for Australian addresses"""
        # Initialize attempts counter if not present
        if "address_attempts" not in state or state["address_attempts"] is None:
            state["address_attempts"] = 0

        # Initialize max_attempts if not present
        if "max_attempts" not in state or state["max_attempts"] is None:
            state["max_attempts"] = settings.max_attempts

        # Apply speech correction for Australian address input (NSW/NSEW fix)
        original_input = state.get("last_user_input", "")
        if original_input:
            try:
                correction_result = await self.speech_corrector.correct_speech_input(
                    text=original_input, context="address_collection"
                )

                # Apply correction if confidence is sufficient
                if self.speech_corrector.should_apply_correction(correction_result):
                    corrected_input = correction_result["corrected"]
                    state["last_user_input"] = corrected_input
                    print(
                        f"🔧 Speech correction applied: '{original_input}' -> '{corrected_input}'"
                    )
                    print(
                        f"   Method: {correction_result['method']}, Confidence: {correction_result['confidence']:.2f}"
                    )
                    print(f"   Reasoning: {correction_result['reasoning']}")
                else:
                    print(
                        f"✅ No speech correction needed for: '{original_input}' (confidence: {correction_result['confidence']:.2f})"
                    )

            except Exception as e:
                print(f"⚠️ Speech correction failed, using original input: {e}")
                # Continue with original input if correction fails

        # Get message history from Redis
        message_history = []
        if call_sid:
            message_history = get_message_history(call_sid)
        
        # Call LLM to extract address
        result = extract_address_from_conversation(state, message_history)
        state["last_llm_response"] = result

        # Check if address was extracted
        extracted_address = result["info_extracted"].get("address")
        is_complete = result["info_complete"]

        if is_complete and extracted_address:
            # Clean address string
            cleaned_address = extracted_address.strip()
            
            # Check if we already have some address information
            existing_address = state.get("address", "")
            if existing_address and existing_address != cleaned_address:
                print(f"🔍 [ADDRESS_COLLECTION] Updating address: '{existing_address}' -> '{cleaned_address}'")
            
            # Local state update
            state["address"] = cleaned_address
            state["address_complete"] = True
            state["current_step"] = "collect_service"

            # Real-time Redis update
            if call_sid:
                redis_success = update_user_info_field(
                    call_sid=call_sid, field_name="address", field_value=cleaned_address
                )

                if redis_success:
                    print(f"✅ Address extracted and saved successfully: {cleaned_address}")
                else:
                    print(f"⚠️ Address extracted successfully but Redis save failed: {cleaned_address}")

            print(f"✅ Address collection completed: {cleaned_address}")
        else:
            # Increment attempt count
            state["address_attempts"] += 1

            if state["address_attempts"] >= state["max_attempts"]:
                print(
                    f"❌ Address collection failed, reached maximum attempts ({state['max_attempts']})"
                )
                state["current_step"] = "collect_service"  # Skip to next step
            else:
                print(
                    f"⚠️ Address extraction failed, attempt: {state['address_attempts']}/{state['max_attempts']}"
                )

        return state

    def process_service_collection(
        self, state: CustomerServiceState, call_sid: Optional[str] = None
    ):
        """Process service collection step"""
        # Initialize attempts counter if not present
        if "service_attempts" not in state or state["service_attempts"] is None:
            state["service_attempts"] = 0

        # Initialize service_max_attempts if not present
        if "service_max_attempts" not in state or state["service_max_attempts"] is None:
            state["service_max_attempts"] = settings.service_max_attempts

        # Check available services in state
        available_services = state.get("available_services", [])
        if not available_services:
            print("⚠️ [SERVICE_COLLECTION] No available services found in state!")

        # Get message history from Redis
        message_history = []
        if call_sid:
            message_history = get_message_history(call_sid)
        
        # Call LLM to extract service
        result = extract_service_from_conversation(state, message_history)

        # Replace placeholders in the response with actual service information
        if result and "response" in result:
            result["response"] = self._replace_service_placeholders(
                result["response"], state
            )

        state["last_llm_response"] = result

        # Check if service was extracted
        extracted_service = result["info_extracted"].get("service")
        is_complete = result["info_complete"]

        if is_complete and extracted_service:
            # Clean and standardize service
            cleaned_service = extracted_service.strip()

            # Match extracted service with available services to get full details
            available_services = state.get("available_services", [])
            matched_service = None

            for service in available_services:
                if service["name"].lower() == cleaned_service.lower():
                    matched_service = service
                    break

            # Local state update with full service information
            state["service"] = cleaned_service
            if matched_service:
                state["service_id"] = matched_service.get("id")
                state["service_price"] = matched_service.get("price")
                print(
                    f"🎯 Matched service: {matched_service['name']} (ID: {matched_service.get('id')}, Price: ${matched_service.get('price', 'N/A')})"
                )
            else:
                print(
                    f"⚠️ Could not match extracted service '{cleaned_service}' with available services"
                )

            state["service_complete"] = True
            state["service_available"] = True  # Assume available for now
            state["current_step"] = "collect_time"

            # Real-time Redis update
            if call_sid:
                redis_success = update_service_selection(
                    call_sid=call_sid,
                    service_name=cleaned_service,
                    service_id=state.get("service_id"),
                    service_price=state.get("service_price"),
                    service_time=None,
                )

                if redis_success:
                    print(
                        f"✅ Service extracted and saved successfully: {cleaned_service}"
                    )
                else:
                    print(
                        f"⚠️ Service extracted successfully but Redis save failed: {cleaned_service}"
                    )

            print(f"✅ Service collection completed: {cleaned_service}")
        else:
            # Increment attempt count
            state["service_attempts"] += 1

            if state["service_attempts"] >= state["service_max_attempts"]:
                print(
                    f"❌ Service collection failed, reached maximum attempts ({state['service_max_attempts']})"
                )
                state["current_step"] = "collect_time"  # Skip to next step
            else:
                print(
                    f"⚠️ Service extraction failed, attempt: {state['service_attempts']}/{state['service_max_attempts']}"
                )

        return state

    def process_time_collection(
        self, state: CustomerServiceState, call_sid: Optional[str] = None
    ):
        """Process time collection step - Simplified with AI direct MongoDB output"""
        # Initialize attempts counter
        if "time_attempts" not in state or state["time_attempts"] is None:
            state["time_attempts"] = 0
        if "max_attempts" not in state or state["max_attempts"] is None:
            state["max_attempts"] = settings.max_attempts

        # Get message history from Redis
        message_history = []
        if call_sid:
            message_history = get_message_history(call_sid)
        
        # Call AI to extract and convert time in one step
        result = extract_time_from_conversation(state, message_history)
        state["last_llm_response"] = result

        # Extract AI results
        extracted_time = result["info_extracted"].get("time")
        mongodb_time = result["info_extracted"].get("time_mongodb")
        is_complete = result["info_complete"]

        if is_complete and extracted_time:
            # AI successfully extracted and converted time
            cleaned_time = extracted_time.strip()

            # Use AI MongoDB format or fallback
            if mongodb_time and mongodb_time != "null":
                final_mongodb_time = mongodb_time
                print(
                    f"✨ AI extracted time with MongoDB format: {cleaned_time} -> {final_mongodb_time}"
                )
            else:
                # Fallback: use the extracted time as-is
                final_mongodb_time = cleaned_time
                print(
                    f"🔄 Using extracted time as fallback: {cleaned_time}"
                )

            # Update state
            state["service_time"] = cleaned_time
            state["service_time_mongodb"] = final_mongodb_time
            state["time_complete"] = True
            state["time_available"] = True

            # Complete booking process
            if call_sid:
                self._complete_booking(
                    state, call_sid, final_mongodb_time or cleaned_time
                )
        else:
            # Handle failed extraction
            state["time_attempts"] += 1
            if state["time_attempts"] >= state["max_attempts"]:
                self._complete_booking_failed(state, call_sid)
            else:
                print(
                    f"⚠️ Time extraction failed, attempt: {state['time_attempts']}/{state['max_attempts']}"
                )

        return state

    def _complete_booking(
        self, state: CustomerServiceState, call_sid: str, time_for_storage: str
    ):
        """Complete successful booking"""
        # Update Redis with service and time
        redis_success = update_service_selection(
            call_sid=call_sid,
            service_name=state.get("service") or "",
            service_id=state.get("service_id"),
            service_price=state.get("service_price"),
            service_time=time_for_storage,
        )

        if redis_success:
            print(
                f"✅ Booking completed successfully: {state.get('service')} at {state.get('service_time')}"
            )
        else:
            print("⚠️ Booking info extracted but Redis save failed")

        # Mark conversation complete
        state["conversation_complete"] = True
        state["current_step"] = "completed"
        update_booking_status(call_sid, is_booked=True, email_sent=False)

        # Generate closing message
        closing_message = self._generate_closing_message(state)
        state["last_llm_response"] = {
            "response": closing_message,
            "info_extracted": {},
            "info_complete": True,
            "analysis": "Conversation completed successfully",
        }
        print("✅ All information collected, booking completed")

    def _complete_booking_failed(
        self, state: CustomerServiceState, call_sid: Optional[str]
    ):
        """Complete booking when time collection failed"""
        print(f"❌ Time collection failed after {state['max_attempts']} attempts")
        state["conversation_complete"] = True
        state["current_step"] = "completed"

        if call_sid:
            update_booking_status(call_sid, is_booked=False, email_sent=False)
            closing_message = self._generate_closing_message(state, booking_failed=True)
            state["last_llm_response"] = {
                "response": closing_message,
                "info_extracted": {},
                "info_complete": False,
                "analysis": "Conversation completed with failed time collection",
            }
            print("⚠️ Partial booking completed, time collection failed")

    # ================== Unified Workflow Entry Function ==================

    async def process_customer_workflow(self, state: CustomerServiceState, call_sid: Optional[str] = None):
        """Unified customer information collection workflow - 5-Step Process

        Main entry point for external API calls. Executes the appropriate collection step
        based on current state completion status.
        
        Workflow: Name → Phone → Address → Service → Time
        
        Args:
            state: Customer service state object
            call_sid: Optional call ID for Redis real-time updates

        Returns:
            CustomerServiceState: Updated state object
        """
        # Determine current step to execute based on completion status
        print(
            f"🔍 Workflow state: name={state['name_complete']}, phone={state['phone_complete']}, address={state['address_complete']}"
        )

        if not state["name_complete"]:
            state = self.process_name_collection(state, call_sid)
        elif not state["phone_complete"]:
            state = self.process_phone_collection(state, call_sid)
        elif not state["address_complete"]:
            state = await self.process_address_collection(state, call_sid)
        elif not state["service_complete"]:
            state = self.process_service_collection(state, call_sid)
        elif not state["time_complete"]:
            state = self.process_time_collection(state, call_sid)
        else:
            # All information collection completed - fallback path
            print(
                "⚠️ Unexpected workflow completion path - all info complete but no specific handler"
            )
            state["conversation_complete"] = True
            state["current_step"] = "completed"

            # Generate appropriate closing message for this fallback case
            closing_message = self._generate_closing_message(state)
            state["last_llm_response"] = {
                "response": closing_message,
                "info_extracted": {},
                "info_complete": True,
                "analysis": "Conversation completed via fallback path",
            }
            print("✅ All customer information collection completed")

        return state

    # ================== Utility Functions ==================

    def print_results(self, state: CustomerServiceState):
        """Print summary of collection results - 5-Step Workflow"""
        print("\n" + "=" * 50)
        print("📋 Customer Information Collection Results Summary (5-Step)")
        print("=" * 50)

        # Basic information
        print(
            f"👤 Name: {state.get('name', 'Not collected')} {'✅' if state.get('name_complete') else '❌'}"
        )
        print(
            f"📞 Phone: {state.get('phone', 'Not collected')} {'✅' if state.get('phone_complete') else '❌'}"
        )
        print(
            f"🏠 Address: {state.get('address', 'Not collected')} {'✅' if state.get('address_complete') else '❌'}"
        )


        # Service information
        service_status = ""
        if state.get("service_complete"):
            if state.get("service_available"):
                service_status = "✅ (Available)"
            else:
                service_status = "⚠️ (Not available)"
        else:
            service_status = "❌"

        time_status = ""
        if state.get("time_complete"):
            if state.get("time_available"):
                time_status = "✅ (Available)"
            else:
                time_status = "⚠️ (Not available)"
        else:
            time_status = "❌"

        print(f"🔧 Service: {state.get('service', 'Not collected')} {service_status}")
        print(f"⏰ Time: {state.get('service_time', 'Not collected')} {time_status}")

        # Conversation statistics
        print(f"📊 Current step: {state.get('current_step', 'Unknown')}")
        print(
            f"✅ Process completed: {'Yes' if state.get('conversation_complete') else 'No'}"
        )

        # Attempt count statistics
        print("\n📈 Attempt Count Statistics:")
        print(f"  • Name: {state.get('name_attempts', 0)}/{state.get('max_attempts', 3)}")
        print(f"  • Phone: {state.get('phone_attempts', 0)}/{state.get('max_attempts', 3)}")
        print(f"  • Address: {state.get('address_attempts', 0)}/{state.get('max_attempts', 3)}")
        print(f"  • Service: {state.get('service_attempts', 0)}/{state.get('service_max_attempts', 3)}")
        print(f"  • Time: {state.get('time_attempts', 0)}/{state.get('max_attempts', 3)}")

        print("=" * 50)

    def save_to_file(self, state: CustomerServiceState, filename: Optional[str] = None):
        """Save conversation to file - 5-Step Workflow"""
        if filename is None:
            filename = "customer_service_conversation.json"

        # Prepare data to save
        save_data = {
            "metadata": {
                "conversation_complete": state.get("conversation_complete", False)
            },
            "customer_info": {
                "name": state.get("name"),
                "phone": state.get("phone"),
                "address": state.get("address"),
                "service": state.get("service"),
                "service_time": state.get("service_time"),
            },
            "collection_status": {
                "name_complete": state.get("name_complete", False),
                "phone_complete": state.get("phone_complete", False),
                "address_complete": state.get("address_complete", False),
                "service_complete": state.get("service_complete", False),
                "time_complete": state.get("time_complete", False),
            },
            "attempts": {
                "name_attempts": state.get("name_attempts", 0),
                "phone_attempts": state.get("phone_attempts", 0),
                "address_attempts": state.get("address_attempts", 0),
                "service_attempts": state.get("service_attempts", 0),
                "time_attempts": state.get("time_attempts", 0),
            },
        }

        try:
            with open(filename, "w", encoding="utf-8") as f:
                json.dump(save_data, f, ensure_ascii=False, indent=2)
            print(f"✅ Conversation saved to file: {filename}")
            return filename
        except Exception as e:
            print(f"❌ Failed to save file: {e}")
            return None

    async def start_conversation(
        self,
        initial_message: str = "Hello! I'm the AI customer service assistant. What is your name?",
    ):
        """Start conversation process (for standalone testing) - 5-Step Workflow"""
        # Initialize state for 5-step workflow
        state: CustomerServiceState = {
            "name": None,
            "phone": None,
            "address": None,
            "service": None,
            "service_time": None,
            "current_step": "collect_name",
            "name_attempts": 0,
            "phone_attempts": 0,
            "address_attempts": 0,
            "service_attempts": 0,
            "time_attempts": 0,
            "max_attempts": settings.max_attempts,
            "service_max_attempts": settings.service_max_attempts,
            "last_user_input": None,
            "last_llm_response": None,
            "name_complete": False,
            "phone_complete": False,
            "address_complete": False,
            "service_complete": False,
            "time_complete": False,
            "conversation_complete": False,
            "service_available": True,
            "time_available": True,
        }

        print("🤖 AI Customer Service Assistant Started (5-Step Workflow)")
        print("💡 Type 'quit' or 'exit' to exit conversation")
        print("💡 Type 'status' to view current collection status")
        print("💡 Type 'save' to save conversation to file")
        print("-" * 50)

        print(f"🤖 AI: {initial_message}")

        # Main conversation loop
        while not state["conversation_complete"]:
            try:
                # Get user input
                user_input = input("\n👤 You: ").strip()

                # Check special commands
                if user_input.lower() in ["quit", "exit"]:
                    print(
                        "👋 Thank you for using AI customer service assistant, goodbye!"
                    )
                    break
                elif user_input.lower() == "status":
                    self.print_results(state)
                    continue
                elif user_input.lower() == "save":
                    filename = self.save_to_file(state)
                    if filename:
                        print(f"📁 Conversation saved: {filename}")
                    continue
                elif not user_input:
                    print("⚠️ Please enter valid content")
                    continue

                # Set user input
                state["last_user_input"] = user_input

                # Process based on current step using unified workflow
                state = await self.process_customer_workflow(state)

                # Display AI response
                if state["last_llm_response"]:
                    ai_response = state["last_llm_response"]["response"]
                    print(f"🤖 AI: {ai_response}")

                # Check if completed
                if state["conversation_complete"]:
                    print("\n🎉 Information collection completed!")
                    self.print_results(state)

                    # Ask whether to save
                    save_choice = (
                        input("\n💾 Save conversation record? (y/n): ").strip().lower()
                    )
                    if save_choice in ["y", "yes"]:
                        self.save_to_file(state)

                    break

            except KeyboardInterrupt:
                print("\n\n⚠️ Conversation interrupted")
                save_choice = (
                    input("💾 Save current conversation record? (y/n): ")
                    .strip()
                    .lower()
                )
                if save_choice in ["y", "yes"]:
                    self.save_to_file(state)
                break
            except Exception as e:
                print(f"❌ Error occurred during processing: {e}")
                continue

        return state


# ================== Module Test Entry Point ==================


async def main():
    """Module test entry point"""
    print("🚀 Starting AI customer service system test (5-Step Workflow)...")

    # Create customer service instance
    cs_agent = CustomerServiceLangGraph()

    # Start conversation
    final_state = await cs_agent.start_conversation()

    print("\n📊 Final state summary:")
    cs_agent.print_results(final_state)


if __name__ == "__main__":
    import asyncio

    asyncio.run(main())
