"""
AI Customer Service Workflow Controller - Refactored Version

Focuses on workflow control and business logic processing, with prompts and validation functions decoupled to independent modules.

Main Responsibilities:
- Manage customer information collection workflow (8-step process)
- Handle conversation state and transitions
- Coordinate LLM interactions without validation
- Manage Redis data updates
- Handle exceptions and error recovery

Architecture Description:
- Prompt module: app.utils.prompts.customer_info_prompts
- Extractors module: app.services.retrieve.customer_info_extractors
- Workflow control: This file (call_handler.py)
"""

import json
from typing import TypedDict, Literal, Optional, Dict, List
from openai import OpenAI
from models.call import Address

# Import decoupled modules
from .retrieve.customer_info_extractors import (
    extract_name_from_conversation,
    extract_phone_from_conversation,
    extract_street_from_conversation,
    extract_suburb_from_conversation,
    extract_state_from_conversation,
    extract_postcode_from_conversation,
    extract_email_from_conversation,
    extract_service_from_conversation,
    extract_time_from_conversation
)

from .redis_service import (
    update_user_info_field,
    update_service_selection,
    update_booking_status
)

from config import settings


class CustomerServiceState(TypedDict):
    """Customer service system state definition - Updated for 8-step workflow"""
    # User information
    name: Optional[str]
    phone: Optional[str]
    street: Optional[str]      # New: street number and name
    suburb: Optional[str]      # New: suburb
    state: Optional[str]       # New: state/territory
    postcode: Optional[str]    # New: postcode
    email: Optional[str]
    service: Optional[str]
    service_id: Optional[str]        # New: service ID
    service_price: Optional[float]   # New: service price
    service_description: Optional[str] # New: service description
    available_services: Optional[List[Dict]] # New: all available services
    service_time: Optional[str]
    
    # Process control - Updated for 8-step workflow
    current_step: Literal["collect_name", "collect_phone", "collect_street", "collect_suburb", "collect_state", "collect_postcode", "collect_email", "collect_service", "collect_time", "completed"]
    name_attempts: int
    phone_attempts: int
    street_attempts: int       # New
    suburb_attempts: int       # New
    state_attempts: int        # New
    postcode_attempts: int     # New
    email_attempts: int
    service_attempts: int
    time_attempts: int
    max_attempts: int
    service_max_attempts: int
    
    # Last user input and LLM response
    last_user_input: Optional[str]
    last_llm_response: Optional[dict]
    
    # Status flags - Updated for 8-step workflow
    name_complete: bool
    phone_complete: bool
    street_complete: bool      # New
    suburb_complete: bool      # New
    state_complete: bool       # New
    postcode_complete: bool    # New
    email_complete: bool
    service_complete: bool
    time_complete: bool
    conversation_complete: bool
    service_available: bool
    time_available: bool


class CustomerServiceLangGraph:
    """Customer service workflow controller - Updated for 8-step workflow
    
    Main responsibility is to manage the entire customer information collection process
    and coordinate interactions between various components.
    """
    
    def _replace_service_placeholders(self, response_text: str, state: CustomerServiceState) -> str:
        """Replace service-related placeholders in LLM response with actual values"""
        if not response_text:
            return response_text
        
        # Get available services
        available_services = state.get("available_services", [])
        
        # Replace {{services_list}} placeholder
        if "{{services_list}}" in response_text:
            services_list = ""
            for service in available_services:
                price_text = f"${service['price']}" if service.get('price') else "Price on request"
                desc_text = f" - {service['description']}" if service.get('description') else ""
                services_list += f"• {service['name']}: {price_text}{desc_text}\n"
            
            response_text = response_text.replace("{{services_list}}", services_list.strip())
        
        # Replace selected service placeholders
        if "{{selected_service_name}}" in response_text or "{{selected_service_price}}" in response_text:
            # Try to find the selected service from available services
            extracted_service = state.get("service")
            selected_service = None
            
            if extracted_service:
                for service in available_services:
                    if service["name"].lower() == extracted_service.lower():
                        selected_service = service
                        break
            
            if selected_service:
                response_text = response_text.replace("{{selected_service_name}}", selected_service["name"])
                price_text = f"{selected_service['price']}" if selected_service.get('price') else "Price on request"
                response_text = response_text.replace("{{selected_service_price}}", price_text)
            else:
                # Fallback if service not found
                response_text = response_text.replace("{{selected_service_name}}", extracted_service or "the selected service")
                response_text = response_text.replace("{{selected_service_price}}", "Price on request")
        
        return response_text
    
    def __init__(self, api_key=None):
        """Initialize customer service system"""
        if api_key:
            self.client = OpenAI(api_key=api_key)
        else:
            self.client = OpenAI(api_key=settings.openai_api_key)
        
        # Create LangGraph workflow - using simplified approach
        self.workflow = None

    # ================== Information Collection Processing Functions ==================
    
    def process_name_collection(self, state: CustomerServiceState, call_sid: Optional[str] = None):
        """Process name collection step"""
        # Initialize attempts counter if not present
        if "name_attempts" not in state or state["name_attempts"] is None:
            state["name_attempts"] = 0
        
        # Initialize max_attempts if not present
        if "max_attempts" not in state or state["max_attempts"] is None:
            state["max_attempts"] = settings.max_attempts
        
        # Call LLM to extract name
        result = extract_name_from_conversation(state)
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
                    call_sid=call_sid,
                    field_name="name", 
                    field_value=cleaned_name
                )
                
                if redis_success:
                    print(f"✅ Name extracted and saved successfully: {cleaned_name}")
                else:
                    print(f"⚠️ Name extracted successfully but Redis save failed: {cleaned_name}")
            
            print(f"✅ Name collection completed: {cleaned_name}")
        else:
            # Increment attempt count
            state["name_attempts"] += 1
            
            if state["name_attempts"] >= state["max_attempts"]:
                print(f"❌ Name collection failed, reached maximum attempts ({state['max_attempts']})")
                state["current_step"] = "collect_phone"  # Skip to next step
            else:
                print(f"⚠️ Name extraction failed, attempt: {state['name_attempts']}/{state['max_attempts']}")
        
        return state

    def process_phone_collection(self, state: CustomerServiceState, call_sid: Optional[str] = None):
        """Process phone collection step"""
        # Initialize attempts counter if not present
        if "phone_attempts" not in state or state["phone_attempts"] is None:
            state["phone_attempts"] = 0
        
        # Initialize max_attempts if not present
        if "max_attempts" not in state or state["max_attempts"] is None:
            state["max_attempts"] = settings.max_attempts
        
        # Call LLM to extract phone
        result = extract_phone_from_conversation(state)
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
            state["current_step"] = "collect_street"
            
            # Real-time Redis update
            if call_sid:
                redis_success = update_user_info_field(
                    call_sid=call_sid,
                    field_name="phone",
                    field_value=cleaned_phone
                )
                
                if redis_success:
                    print(f"✅ Phone extracted and saved successfully: {cleaned_phone}")
                else:
                    print(f"⚠️ Phone extracted successfully but Redis save failed: {cleaned_phone}")
            
            print(f"✅ Phone collection completed: {cleaned_phone}")
        else:
            # Increment attempt count
            state["phone_attempts"] += 1
            
            if state["phone_attempts"] >= state["max_attempts"]:
                print(f"❌ Phone collection failed, reached maximum attempts ({state['max_attempts']})")
                state["current_step"] = "collect_street"  # Skip to next step
            else:
                print(f"⚠️ Phone extraction failed, attempt: {state['phone_attempts']}/{state['max_attempts']}")
        
        return state

    def process_street_collection(self, state: CustomerServiceState, call_sid: Optional[str] = None):
        """Process street collection step"""
        # Initialize attempts counter if not present
        if "street_attempts" not in state or state["street_attempts"] is None:
            state["street_attempts"] = 0
        
        # Initialize max_attempts if not present
        if "max_attempts" not in state or state["max_attempts"] is None:
            state["max_attempts"] = settings.max_attempts
        
        # Call LLM to extract street
        result = extract_street_from_conversation(state)
        state["last_llm_response"] = result
        
        # Check if street was extracted
        extracted_info = result["info_extracted"]
        street_number = extracted_info.get("street_number")
        street_name = extracted_info.get("street_name")
        is_complete = result["info_complete"]
        
        if is_complete and street_number and street_name:
            # Combine street number and name
            full_street = f"{street_number} {street_name}".strip()
            
            # Local state update
            state["street"] = full_street
            state["street_complete"] = True
            state["current_step"] = "collect_suburb"
            
            # Real-time Redis update
            if call_sid:
                redis_success = update_user_info_field(
                    call_sid=call_sid,
                    field_name="street",
                    field_value=full_street
                )
                
                if redis_success:
                    print(f"✅ Street extracted and saved successfully: {full_street}")
                else:
                    print(f"⚠️ Street extracted successfully but Redis save failed: {full_street}")
            
            print(f"✅ Street collection completed: {full_street}")
        else:
            # Increment attempt count
            state["street_attempts"] += 1
            
            if state["street_attempts"] >= state["max_attempts"]:
                print(f"❌ Street collection failed, reached maximum attempts ({state['max_attempts']})")
                state["current_step"] = "collect_suburb"  # Skip to next step
            else:
                print(f"⚠️ Street extraction failed, attempt: {state['street_attempts']}/{state['max_attempts']}")
        
        return state

    def process_suburb_collection(self, state: CustomerServiceState, call_sid: Optional[str] = None):
        """Process suburb collection step"""
        # Initialize attempts counter if not present
        if "suburb_attempts" not in state or state["suburb_attempts"] is None:
            state["suburb_attempts"] = 0
        
        # Initialize max_attempts if not present
        if "max_attempts" not in state or state["max_attempts"] is None:
            state["max_attempts"] = settings.max_attempts
        
        # Call LLM to extract suburb
        result = extract_suburb_from_conversation(state)
        state["last_llm_response"] = result
        
        # Check if suburb was extracted
        extracted_suburb = result["info_extracted"].get("suburb")
        is_complete = result["info_complete"]
        
        if is_complete and extracted_suburb:
            # Clean and standardize suburb
            cleaned_suburb = extracted_suburb.strip()
            
            # Local state update
            state["suburb"] = cleaned_suburb
            state["suburb_complete"] = True
            state["current_step"] = "collect_state"
            
            # Real-time Redis update
            if call_sid:
                redis_success = update_user_info_field(
                    call_sid=call_sid,
                    field_name="suburb",
                    field_value=cleaned_suburb
                )
                
                if redis_success:
                    print(f"✅ Suburb extracted and saved successfully: {cleaned_suburb}")
                else:
                    print(f"⚠️ Suburb extracted successfully but Redis save failed: {cleaned_suburb}")
            
            print(f"✅ Suburb collection completed: {cleaned_suburb}")
        else:
            # Increment attempt count
            state["suburb_attempts"] += 1
            
            if state["suburb_attempts"] >= state["max_attempts"]:
                print(f"❌ Suburb collection failed, reached maximum attempts ({state['max_attempts']})")
                state["current_step"] = "collect_state"  # Skip to next step
            else:
                print(f"⚠️ Suburb extraction failed, attempt: {state['suburb_attempts']}/{state['max_attempts']}")
        
        return state

    def process_state_collection(self, state: CustomerServiceState, call_sid: Optional[str] = None):
        """Process state collection step"""
        # Initialize attempts counter if not present
        if "state_attempts" not in state or state["state_attempts"] is None:
            state["state_attempts"] = 0
        
        # Initialize max_attempts if not present
        if "max_attempts" not in state or state["max_attempts"] is None:
            state["max_attempts"] = settings.max_attempts
        
        # Call LLM to extract state
        result = extract_state_from_conversation(state)
        state["last_llm_response"] = result
        
        # Check if state was extracted
        extracted_state = result["info_extracted"].get("state")
        is_complete = result["info_complete"]
        
        if is_complete and extracted_state:
            # Clean and standardize state (uppercase)
            cleaned_state = extracted_state.strip().upper()
            
            # Local state update
            state["state"] = cleaned_state
            state["state_complete"] = True
            state["current_step"] = "collect_postcode"
            
            # Real-time Redis update
            if call_sid:
                redis_success = update_user_info_field(
                    call_sid=call_sid,
                    field_name="state",
                    field_value=cleaned_state
                )
                
                if redis_success:
                    print(f"✅ State extracted and saved successfully: {cleaned_state}")
                else:
                    print(f"⚠️ State extracted successfully but Redis save failed: {cleaned_state}")
            
            print(f"✅ State collection completed: {cleaned_state}")
        else:
            # Increment attempt count
            state["state_attempts"] += 1
            
            if state["state_attempts"] >= state["max_attempts"]:
                print(f"❌ State collection failed, reached maximum attempts ({state['max_attempts']})")
                state["current_step"] = "collect_postcode"  # Skip to next step
            else:
                print(f"⚠️ State extraction failed, attempt: {state['state_attempts']}/{state['max_attempts']}")
        
        return state

    def process_postcode_collection(self, state: CustomerServiceState, call_sid: Optional[str] = None):
        """Process postcode collection step"""
        # Initialize attempts counter if not present
        if "postcode_attempts" not in state or state["postcode_attempts"] is None:
            state["postcode_attempts"] = 0
        
        # Initialize max_attempts if not present
        if "max_attempts" not in state or state["max_attempts"] is None:
            state["max_attempts"] = settings.max_attempts
        
        # Call LLM to extract postcode
        result = extract_postcode_from_conversation(state)
        state["last_llm_response"] = result
        
        # Check if postcode was extracted
        extracted_postcode = result["info_extracted"].get("postcode")
        is_complete = result["info_complete"]
        
        if is_complete and extracted_postcode:
            # Clean and standardize postcode
            cleaned_postcode = extracted_postcode.strip()
            
            # Local state update
            state["postcode"] = cleaned_postcode
            state["postcode_complete"] = True
            state["current_step"] = "collect_email"
            
            # Real-time Redis update
            if call_sid:
                redis_success = update_user_info_field(
                    call_sid=call_sid,
                    field_name="postcode",
                    field_value=cleaned_postcode
                )
                
                if redis_success:
                    print(f"✅ Postcode extracted and saved successfully: {cleaned_postcode}")
                else:
                    print(f"⚠️ Postcode extracted successfully but Redis save failed: {cleaned_postcode}")
            
            # After postcode is complete, build complete Address object and save to Redis
            if all([state.get("street"), state.get("suburb"), state.get("state"), state.get("postcode")]):
                # Parse street into number and name
                street_parts = state["street"].split(" ", 1)
                street_number = street_parts[0] if len(street_parts) > 0 else ""
                street_name = street_parts[1] if len(street_parts) > 1 else ""
                
                address_obj = Address(
                    street_number=street_number,
                    street_name=street_name,
                    suburb=state["suburb"],
                    state=state["state"],
                    postcode=state["postcode"]
                )
                
                # Save complete address to Redis
                if call_sid:
                    redis_success = update_user_info_field(
                        call_sid=call_sid,
                        field_name="address",
                        field_value=address_obj
                    )
                    
                    if redis_success:
                        print(f"✅ Complete address saved to Redis: {state['street']}, {state['suburb']}, {state['state']} {state['postcode']}")
                    else:
                        print(f"⚠️ Failed to save complete address to Redis")
            
            print(f"✅ Postcode collection completed: {cleaned_postcode}")
        else:
            # Increment attempt count
            state["postcode_attempts"] += 1
            
            if state["postcode_attempts"] >= state["max_attempts"]:
                print(f"❌ Postcode collection failed, reached maximum attempts ({state['max_attempts']})")
                state["current_step"] = "collect_email"  # Skip to next step
            else:
                print(f"⚠️ Postcode extraction failed, attempt: {state['postcode_attempts']}/{state['max_attempts']}")
        
        return state

    def process_email_collection(self, state: CustomerServiceState, call_sid: Optional[str] = None):
        """Process email collection step"""
        # Initialize attempts counter if not present
        if "email_attempts" not in state or state["email_attempts"] is None:
            state["email_attempts"] = 0
        
        # Initialize max_attempts if not present
        if "max_attempts" not in state or state["max_attempts"] is None:
            state["max_attempts"] = settings.max_attempts
        
        # Call LLM to extract email
        result = extract_email_from_conversation(state)
        state["last_llm_response"] = result
        
        # Check if email was extracted
        extracted_email = result["info_extracted"].get("email")
        is_complete = result["info_complete"]
        
        if is_complete and extracted_email:
            # Clean and standardize email
            cleaned_email = extracted_email.strip()
            
            # Local state update
            state["email"] = cleaned_email
            state["email_complete"] = True
            state["current_step"] = "collect_service"
            
            # Real-time Redis update
            if call_sid:
                redis_success = update_user_info_field(
                    call_sid=call_sid,
                    field_name="email", 
                    field_value=cleaned_email
                )
                
                if redis_success:
                    print(f"✅ Email extracted and saved successfully: {cleaned_email}")
                else:
                    print(f"⚠️ Email extracted successfully but Redis save failed: {cleaned_email}")
            
            print(f"✅ Email collection completed: {cleaned_email}")
        else:
            # Increment attempt count
            state["email_attempts"] += 1
            
            if state["email_attempts"] >= state["max_attempts"]:
                print(f"❌ Email collection failed, reached maximum attempts ({state['max_attempts']})")
                state["current_step"] = "collect_service"  # Skip to next step
            else:
                print(f"⚠️ Email extraction failed, attempt: {state['email_attempts']}/{state['max_attempts']}")
        
        return state

    def process_service_collection(self, state: CustomerServiceState, call_sid: Optional[str] = None):
        """Process service collection step"""
        # Initialize attempts counter if not present
        if "service_attempts" not in state or state["service_attempts"] is None:
            state["service_attempts"] = 0
        
        # Initialize service_max_attempts if not present
        if "service_max_attempts" not in state or state["service_max_attempts"] is None:
            state["service_max_attempts"] = settings.service_max_attempts
        
        # Call LLM to extract service
        result = extract_service_from_conversation(state)
        
        # Replace placeholders in the response with actual service information
        if result and "response" in result:
            result["response"] = self._replace_service_placeholders(result["response"], state)
        
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
                state["service_description"] = matched_service.get("description")
                print(f"🎯 Matched service: {matched_service['name']} (ID: {matched_service.get('id')}, Price: ${matched_service.get('price', 'N/A')})")
            else:
                print(f"⚠️ Could not match extracted service '{cleaned_service}' with available services")
            
            state["service_complete"] = True
            state["service_available"] = True  # Assume available for now
            state["current_step"] = "collect_time"
            
            # Real-time Redis update
            if call_sid:
                redis_success = update_service_selection(
                    call_sid=call_sid,
                    service_name=cleaned_service,
                    service_time=None
                )
                
                if redis_success:
                    print(f"✅ Service extracted and saved successfully: {cleaned_service}")
                else:
                    print(f"⚠️ Service extracted successfully but Redis save failed: {cleaned_service}")
            
            print(f"✅ Service collection completed: {cleaned_service}")
        else:
            # Increment attempt count
            state["service_attempts"] += 1
            
            if state["service_attempts"] >= state["service_max_attempts"]:
                print(f"❌ Service collection failed, reached maximum attempts ({state['service_max_attempts']})")
                state["current_step"] = "collect_time"  # Skip to next step
            else:
                print(f"⚠️ Service extraction failed, attempt: {state['service_attempts']}/{state['service_max_attempts']}")
        
        return state

    def process_time_collection(self, state: CustomerServiceState, call_sid: Optional[str] = None):
        """Process time collection step"""
        # Initialize attempts counter if not present
        if "time_attempts" not in state or state["time_attempts"] is None:
            state["time_attempts"] = 0
        
        # Initialize max_attempts if not present
        if "max_attempts" not in state or state["max_attempts"] is None:
            state["max_attempts"] = settings.max_attempts
        
        # Call LLM to extract time
        result = extract_time_from_conversation(state)
        state["last_llm_response"] = result
        
        # Check if time was extracted
        extracted_time = result["info_extracted"].get("time")
        is_complete = result["info_complete"]
        
        if is_complete and extracted_time:
            # Clean and standardize time
            cleaned_time = extracted_time.strip().lower()
            
            # Local state update
            state["service_time"] = cleaned_time
            state["time_complete"] = True
            state["time_available"] = True  # Assume available for now
            
            # Real-time Redis update
            if call_sid:
                # Update service time
                redis_success = update_service_selection(
                    call_sid=call_sid,
                    service_name=state.get("service") or "",
                    service_time=cleaned_time
                )
                
                if redis_success:
                    print(f"✅ Service time extracted and saved successfully: {cleaned_time}")
                else:
                    print(f"⚠️ Service time extracted successfully but Redis save failed: {cleaned_time}")
                
                # Mark booking as completed
                state["conversation_complete"] = True
                state["current_step"] = "completed"
                update_booking_status(call_sid, is_booked=True, email_sent=False)
                print("✅ Booking completed, all information collected successfully")
            
            print(f"✅ Time collection completed: {cleaned_time}")
        else:
            # Increment attempt count
            state["time_attempts"] += 1
            
            if state["time_attempts"] >= state["max_attempts"]:
                print(f"❌ Time collection failed, reached maximum attempts ({state['max_attempts']})")
                state["conversation_complete"] = True
                state["current_step"] = "completed"
                
                # Even if time collection fails, mark as completed
                if call_sid:
                    update_booking_status(call_sid, is_booked=False, email_sent=False)
                    print("⚠️ Time collection failed, but process is completed")
            else:
                print(f"⚠️ Time extraction failed, attempt: {state['time_attempts']}/{state['max_attempts']}")
        
        return state

    # ================== Unified Workflow Entry Function ==================
    
    def process_customer_workflow(self, state: CustomerServiceState, call_sid: Optional[str] = None):
        """Unified customer information collection workflow processing function - Updated for 8-step workflow
        
        This is the main entry point for external API calls, responsible for automatically
        determining which collection step should be executed based on current state,
        and returning the updated state.
        
        Args:
            state: Customer service state object
            call_sid: Optional call ID for Redis real-time updates
            
        Returns:
            CustomerServiceState: Updated state object
        """
        # Determine current step to execute based on completion status
        print(f"🔍 Workflow state: name={state['name_complete']}, phone={state['phone_complete']}, street={state.get('street_complete', False)}, suburb={state.get('suburb_complete', False)}, state={state.get('state_complete', False)}, postcode={state.get('postcode_complete', False)}")
        
        if not state["name_complete"]:
            state = self.process_name_collection(state, call_sid)
        elif not state["phone_complete"]:
            state = self.process_phone_collection(state, call_sid)
        elif not state.get("street_complete", False):
            state = self.process_street_collection(state, call_sid)
        elif not state.get("suburb_complete", False):
            state = self.process_suburb_collection(state, call_sid)
        elif not state.get("state_complete", False):
            state = self.process_state_collection(state, call_sid)
        elif not state.get("postcode_complete", False):
            state = self.process_postcode_collection(state, call_sid)
        elif not state["email_complete"]:
            state = self.process_email_collection(state, call_sid)
        elif not state["service_complete"]:
            state = self.process_service_collection(state, call_sid)
        elif not state["time_complete"]:
            state = self.process_time_collection(state, call_sid)
        else:
            # All information collection completed
            state["conversation_complete"] = True
            state["current_step"] = "completed"
            print("✅ All customer information collection completed")
        
        return state

    # ================== Utility Functions ==================
    
    def print_results(self, state: CustomerServiceState):
        """Print summary of collection results - Updated for 8-step workflow"""
        print("\n" + "="*50)
        print("📋 Customer Information Collection Results Summary")
        print("="*50)
        
        # Basic information
        print(f"👤 Name: {state.get('name', 'Not collected')} {'✅' if state.get('name_complete') else '❌'}")
        print(f"📞 Phone: {state.get('phone', 'Not collected')} {'✅' if state.get('phone_complete') else '❌'}")
        
        # Address components
        print(f"🏠 Street: {state.get('street', 'Not collected')} {'✅' if state.get('street_complete') else '❌'}")
        print(f"🏘️ Suburb: {state.get('suburb', 'Not collected')} {'✅' if state.get('suburb_complete') else '❌'}")
        print(f"🗺️ State: {state.get('state', 'Not collected')} {'✅' if state.get('state_complete') else '❌'}")
        print(f"📮 Postcode: {state.get('postcode', 'Not collected')} {'✅' if state.get('postcode_complete') else '❌'}")
        
        print(f"📧 Email: {state.get('email', 'Not collected')} {'✅' if state.get('email_complete') else '❌'}")
        
        # Service information
        service_status = ""
        if state.get('service_complete'):
            if state.get('service_available'):
                service_status = "✅ (Available)"
            else:
                service_status = "⚠️ (Not available)"
        else:
            service_status = "❌"
            
        time_status = ""
        if state.get('time_complete'):
            if state.get('time_available'):
                time_status = "✅ (Available)"
            else:
                time_status = "⚠️ (Not available)"
        else:
            time_status = "❌"
        
        print(f"🔧 Service: {state.get('service', 'Not collected')} {service_status}")
        print(f"⏰ Time: {state.get('service_time', 'Not collected')} {time_status}")
        
        # Conversation statistics
        print(f"📊 Current step: {state.get('current_step', 'Unknown')}")
        print(f"✅ Process completed: {'Yes' if state.get('conversation_complete') else 'No'}")
        
        # Attempt count statistics
        print("\n📈 Attempt Count Statistics:")
        print(f"  • Name: {state.get('name_attempts', 0)}/{state.get('max_attempts', 3)}")
        print(f"  • Phone: {state.get('phone_attempts', 0)}/{state.get('max_attempts', 3)}")
        print(f"  • Street: {state.get('street_attempts', 0)}/{state.get('max_attempts', 3)}")
        print(f"  • Suburb: {state.get('suburb_attempts', 0)}/{state.get('max_attempts', 3)}")
        print(f"  • State: {state.get('state_attempts', 0)}/{state.get('max_attempts', 3)}")
        print(f"  • Postcode: {state.get('postcode_attempts', 0)}/{state.get('max_attempts', 3)}")
        print(f"  • Email: {state.get('email_attempts', 0)}/{state.get('max_attempts', 3)}")
        print(f"  • Service: {state.get('service_attempts', 0)}/{state.get('service_max_attempts', 3)}")
        print(f"  • Time: {state.get('time_attempts', 0)}/{state.get('max_attempts', 3)}")
        
        print("="*50)

    def save_to_file(self, state: CustomerServiceState, filename: Optional[str] = None):
        """Save conversation to file - Updated for 8-step workflow"""
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
                "street": state.get("street"),
                "suburb": state.get("suburb"),
                "state": state.get("state"),
                "postcode": state.get("postcode"),
                "email": state.get("email"),
                "service": state.get("service"),
                "service_time": state.get("service_time")
            },
            "collection_status": {
                "name_complete": state.get("name_complete", False),
                "phone_complete": state.get("phone_complete", False),
                "street_complete": state.get("street_complete", False),
                "suburb_complete": state.get("suburb_complete", False),
                "state_complete": state.get("state_complete", False),
                "postcode_complete": state.get("postcode_complete", False),
                "email_complete": state.get("email_complete", False),
                "service_complete": state.get("service_complete", False),
                "time_complete": state.get("time_complete", False)
            },
            "attempts": {
                "name_attempts": state.get("name_attempts", 0),
                "phone_attempts": state.get("phone_attempts", 0),
                "street_attempts": state.get("street_attempts", 0),
                "suburb_attempts": state.get("suburb_attempts", 0),
                "state_attempts": state.get("state_attempts", 0),
                "postcode_attempts": state.get("postcode_attempts", 0),
                "email_attempts": state.get("email_attempts", 0),
                "service_attempts": state.get("service_attempts", 0),
                "time_attempts": state.get("time_attempts", 0)
            }
        }
        
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(save_data, f, ensure_ascii=False, indent=2)
            print(f"✅ Conversation saved to file: {filename}")
            return filename
        except Exception as e:
            print(f"❌ Failed to save file: {e}")
            return None

    def start_conversation(self, initial_message: str = "Hello! I'm the AI customer service assistant. What is your name?"):
        """Start conversation process (for standalone testing) - Updated for 8-step workflow"""
        # Initialize state
        state: CustomerServiceState = {
            "name": None,
            "phone": None,
            "street": None,
            "suburb": None,
            "state": None,
            "postcode": None,
            "email": None,
            "service": None,
            "service_time": None,
            "current_step": "collect_name",
            "name_attempts": 0,
            "phone_attempts": 0,
            "street_attempts": 0,
            "suburb_attempts": 0,
            "state_attempts": 0,
            "postcode_attempts": 0,
            "email_attempts": 0,
            "service_attempts": 0,
            "time_attempts": 0,
            "max_attempts": settings.max_attempts,
            "service_max_attempts": settings.service_max_attempts,
            "last_user_input": None,
            "last_llm_response": None,
            "name_complete": False,
            "phone_complete": False,
            "street_complete": False,
            "suburb_complete": False,
            "state_complete": False,
            "postcode_complete": False,
            "email_complete": False,
            "service_complete": False,
            "time_complete": False,
            "conversation_complete": False,
            "service_available": True,
            "time_available": True,
        }
        
        print("🤖 AI Customer Service Assistant Started (8-Step Workflow)")
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
                if user_input.lower() in ['quit', 'exit']:
                    print("👋 Thank you for using AI customer service assistant, goodbye!")
                    break
                elif user_input.lower() == 'status':
                    self.print_results(state)
                    continue
                elif user_input.lower() == 'save':
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
                state = self.process_customer_workflow(state)
                
                # Display AI response
                if state["last_llm_response"]:
                    ai_response = state["last_llm_response"]["response"]
                    print(f"🤖 AI: {ai_response}")
                
                # Check if completed
                if state["conversation_complete"]:
                    print("\n🎉 Information collection completed!")
                    self.print_results(state)
                    
                    # Ask whether to save
                    save_choice = input("\n💾 Save conversation record? (y/n): ").strip().lower()
                    if save_choice in ['y', 'yes']:
                        self.save_to_file(state)
                    
                    break
                    
            except KeyboardInterrupt:
                print("\n\n⚠️ Conversation interrupted")
                save_choice = input("💾 Save current conversation record? (y/n): ").strip().lower()
                if save_choice in ['y', 'yes']:
                    self.save_to_file(state)
                break
            except Exception as e:
                print(f"❌ Error occurred during processing: {e}")
                continue
        
        return state


# ================== Module Test Entry Point ==================

if __name__ == "__main__":
    """Module test entry point"""
    print("🚀 Starting AI customer service system test (8-Step Workflow)...")
    
    # Create customer service instance
    cs_agent = CustomerServiceLangGraph()
    
    # Start conversation
    final_state = cs_agent.start_conversation()
    
    print("\n📊 Final state summary:")
    cs_agent.print_results(final_state)