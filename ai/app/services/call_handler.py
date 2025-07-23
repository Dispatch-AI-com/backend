"""
AI Customer Service Workflow Controller - Refactored Version

Focuses on workflow control and business logic processing, with prompts and validation functions decoupled to independent modules.

Main Responsibilities:
- Manage customer information collection workflow
- Handle conversation state and transitions
- Coordinate LLM interactions and data validation
- Manage Redis data updates
- Handle exceptions and error recovery

Architecture Description:
- Prompt module: app.utils.prompts.customer_info_prompts
- Validation module: app.utils.validators.customer_validators
- Workflow control: This file (chatr2v3.py)
"""

import json
from typing import TypedDict, Literal, Optional, Dict
from openai import OpenAI
from models.call import Address

# Import decoupled modules
from .retrieve.customer_info_extractors import (
    extract_name_from_conversation,
    extract_phone_from_conversation,
    extract_address_from_conversation,
    extract_email_from_conversation,
    extract_service_from_conversation,
    extract_time_from_conversation
)

from utils.validators.customer_validators import (
    validate_name,
    validate_phone,
    validate_address,
    validate_email,
    validate_service,
    validate_time,
    validate_address_component
)

from .redis_service import (
    update_user_info_field,
    update_service_selection,
    update_booking_status
)

from config import settings


class CustomerServiceState(TypedDict):
    """Customer service system state definition"""
    # User information
    name: Optional[str]
    phone: Optional[str]
    address: Optional[Address]
    email: Optional[str]
    service: Optional[str]
    service_time: Optional[str]
    
    # Address component tracking for incremental collection
    address_components: Dict[str, Optional[str]]  # {"street_number": None, "street_name": None, "suburb": None, "state": None, "postcode": None}
    address_collection_step: Literal["street", "suburb", "state", "postcode", "complete"]
    
    # Process control
    current_step: Literal["collect_name", "collect_phone", "collect_address", "collect_email", "collect_service", "collect_time", "completed"]
    name_attempts: int
    phone_attempts: int
    address_attempts: int
    email_attempts: int
    service_attempts: int
    time_attempts: int
    max_attempts: int
    service_max_attempts: int
    
    # Last user input and LLM response
    last_user_input: Optional[str]
    last_llm_response: Optional[dict]
    
    # Status flags
    name_complete: bool
    phone_complete: bool
    address_complete: bool
    email_complete: bool
    service_complete: bool
    time_complete: bool
    conversation_complete: bool
    service_available: bool
    time_available: bool


class CustomerServiceLangGraph:
    """Customer service workflow controller
    
    Main responsibility is to manage the entire customer information collection process
    and coordinate interactions between various components.
    """
    
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
        
        if is_complete and extracted_name and validate_name(extracted_name):
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
        
        if is_complete and extracted_phone and validate_phone(extracted_phone):
            # Clean and standardize phone
            cleaned_phone = extracted_phone.strip()
            
            # Local state update
            state["phone"] = cleaned_phone
            state["phone_complete"] = True
            state["current_step"] = "collect_address"
            
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
                state["current_step"] = "collect_address"  # Skip to next step
            else:
                print(f"⚠️ Phone extraction failed, attempt: {state['phone_attempts']}/{state['max_attempts']}")
        
        return state

    def process_address_collection(self, state: CustomerServiceState, call_sid: Optional[str] = None):
        """Process incremental address collection step"""
        # Initialize address_components if not present
        if "address_components" not in state or state["address_components"] is None:
            state["address_components"] = {
                "street_number": None,
                "street_name": None,
                "suburb": None,
                "state": None,
                "postcode": None
            }
        
        # Initialize address_collection_step if not present
        if "address_collection_step" not in state or state["address_collection_step"] is None:
            state["address_collection_step"] = "street"
        
        # Initialize attempts counter if not present
        if "address_attempts" not in state or state["address_attempts"] is None:
            state["address_attempts"] = 0
        
        # Initialize max_attempts if not present
        if "max_attempts" not in state or state["max_attempts"] is None:
            state["max_attempts"] = settings.max_attempts
        
        # Call LLM to extract address components
        result = extract_address_from_conversation(state)
        state["last_llm_response"] = result
        
        # Get extracted address components
        extracted_components = result["info_extracted"]
        is_complete = result.get("info_complete", False)
        collection_step_complete = result.get("collection_step_complete", False)
        
        # Merge newly extracted components with existing ones
        components_updated = False
        for component, value in extracted_components.items():
            if value and value.strip():  # Only update if we have a valid value
                old_value = state["address_components"].get(component)
                state["address_components"][component] = value.strip()
                if old_value != value.strip():
                    components_updated = True
                    print(f"📝 Updated {component}: {value.strip()}")
        
        # Validate individual components that were extracted
        if components_updated:
            self._validate_and_update_address_components(state, call_sid)
        
        # Determine next collection step based on what we have
        current_step = state["address_collection_step"]
        
        if current_step == "street":
            if state["address_components"]["street_number"] and state["address_components"]["street_name"]:
                state["address_collection_step"] = "suburb"
                print("✅ Street information collected, now collecting suburb")
            elif collection_step_complete:
                state["address_collection_step"] = "suburb"
        elif current_step == "suburb":
            if state["address_components"]["suburb"]:
                state["address_collection_step"] = "state"
                print("✅ Suburb collected, now collecting state and postcode")
            elif collection_step_complete:
                state["address_collection_step"] = "state"
        elif current_step == "state":
            if state["address_components"]["state"] and state["address_components"]["postcode"]:
                state["address_collection_step"] = "complete"
                print("✅ State and postcode collected")
            elif collection_step_complete:
                state["address_collection_step"] = "complete"
        
        # Check if all address components are complete
        components = state["address_components"]
        print(f"🔍 Checking address components: {components}")
        
        if all([components["street_number"], components["street_name"], 
                components["suburb"], components["state"], components["postcode"]]):
            
            # Build complete Address object
            address_obj = Address(
                street_number=components['street_number'],
                street_name=components['street_name'],
                suburb=components['suburb'],
                state=components['state'],
                postcode=components['postcode']
            )
            
            # Build address string for validation
            complete_address_str = f"{components['street_number']} {components['street_name']}, {components['suburb']}, {components['state']} {components['postcode']}"
            
            # Skip validation - directly save address
            state["address"] = address_obj
            state["address_complete"] = True
            state["address_collection_step"] = "complete"
            state["current_step"] = "collect_email"
            
            # Real-time Redis update - store as Address object
            if call_sid:
                print(f"🔍 About to save address to Redis: {address_obj}")
                redis_success = update_user_info_field(
                    call_sid=call_sid,
                    field_name="address",
                    field_value=address_obj
                )
                
                if redis_success:
                    print(f"✅ Complete address saved successfully to Redis")
                else:
                    print(f"❌ Redis save failed for address")
            
            print(f"🎉 Address collection completed: {complete_address_str}")
            return state
        else:
            missing_components = [k for k, v in components.items() if not v]
            print(f"⚠️ Address incomplete. Missing: {missing_components}")
        
        # Handle failed attempts
        if not components_updated and not collection_step_complete:
            state["address_attempts"] += 1
            
            if state["address_attempts"] >= state["max_attempts"]:
                print(f"❌ Address collection failed, reached maximum attempts ({state['max_attempts']})")
                state["current_step"] = "collect_email"  # Skip to next step
            else:
                print(f"⚠️ Address extraction failed, attempt: {state['address_attempts']}/{state['max_attempts']}")
        
        return state
    
    def _validate_and_update_address_components(self, state: CustomerServiceState, call_sid: Optional[str] = None):
        """Validate and update individual address components"""
        components = state["address_components"]
        
        # Validate each component using the dedicated validation function
        for component_type, value in components.items():
            if value:
                if validate_address_component(component_type, value):
                    # Normalize state to uppercase
                    if component_type == "state":
                        components[component_type] = value.upper()
                    print(f"✅ Valid {component_type}: {components[component_type]}")
                else:
                    print(f"⚠️ Invalid {component_type}: {value}")
                    components[component_type] = None
        
        # Note: Individual components are not stored separately anymore
        # Only the complete Address object is stored when all components are collected

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
        
        if is_complete and extracted_email and validate_email(extracted_email):
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
        state["last_llm_response"] = result
        
        # Check if service was extracted
        extracted_service = result["info_extracted"].get("service")
        is_complete = result["info_complete"]
        
        if is_complete and extracted_service:
            # Validate service
            is_valid_input, service_available = validate_service(extracted_service)
            
            if is_valid_input:
                # Clean and standardize service
                cleaned_service = extracted_service.strip().lower()
                
                # Local state update
                state["service"] = cleaned_service
                state["service_complete"] = True
                state["service_available"] = service_available
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
                
                print(f"✅ Service collection completed: {cleaned_service}, availability: {service_available}")
            else:
                print(f"⚠️ Service validation failed: {extracted_service}")
                state["service_attempts"] += 1
        else:
            # Increment attempt count
            state["service_attempts"] += 1
            
        # Check if maximum attempts reached
        if state["service_attempts"] >= state["service_max_attempts"]:
            print(f"❌ Service collection failed, reached maximum attempts ({state['service_max_attempts']})")
            state["current_step"] = "collect_time"  # Skip to next step
        elif state["service_attempts"] > 0 and not state["service_complete"]:
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
            # Validate time
            is_valid_input, time_available = validate_time(extracted_time)
            
            if is_valid_input:
                # Clean and standardize time
                cleaned_time = extracted_time.strip().lower()
                
                # Local state update
                state["service_time"] = cleaned_time
                state["time_complete"] = True
                state["time_available"] = time_available
                
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
                    
                    # If time is available, update booking status
                    if time_available:
                        state["conversation_complete"] = True
                        state["current_step"] = "completed"
                        update_booking_status(call_sid, is_booked=True, email_sent=False)
                        print("✅ Booking completed, all information collected successfully")
                    else:
                        print("⚠️ Requested time is not available, but information has been collected")
                
                print(f"✅ Time collection completed: {cleaned_time}, availability: {time_available}")
            else:
                print(f"⚠️ Time validation failed: {extracted_time}")
                state["time_attempts"] += 1
        else:
            # Increment attempt count
            state["time_attempts"] += 1
            
        # Check if maximum attempts reached
        if state["time_attempts"] >= state["max_attempts"]:
            print(f"❌ Time collection failed, reached maximum attempts ({state['max_attempts']})")
            state["conversation_complete"] = True
            state["current_step"] = "completed"
            
            # Even if time collection fails, mark as completed
            if call_sid:
                update_booking_status(call_sid, is_booked=False, email_sent=False)
                print("⚠️ Time collection failed, but process is completed")
        elif state["time_attempts"] > 0 and not state["time_complete"]:
            print(f"⚠️ Time extraction failed, attempt: {state['time_attempts']}/{state['max_attempts']}")
        
        return state

    # ================== Unified Workflow Entry Function ==================
    
    def process_customer_workflow(self, state: CustomerServiceState, call_sid: Optional[str] = None):
        """Unified customer information collection workflow processing function
        
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
        if not state["name_complete"]:
            state = self.process_name_collection(state, call_sid)
        elif not state["phone_complete"]:
            state = self.process_phone_collection(state, call_sid)
        elif not state["address_complete"]:
            state = self.process_address_collection(state, call_sid)
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
        """Print summary of collection results"""
        print("\n" + "="*50)
        print("📋 Customer Information Collection Results Summary")
        print("="*50)
        
        # Basic information
        print(f"👤 Name: {state.get('name', 'Not collected')} {'✅' if state.get('name_complete') else '❌'}")
        print(f"📞 Phone: {state.get('phone', 'Not collected')} {'✅' if state.get('phone_complete') else '❌'}")
        # Address with component breakdown
        address_status = "✅" if state.get('address_complete') else "❌"
        address_display = state.get('address', 'Not collected')
        
        if not state.get('address_complete') and state.get('address_components'):
            components = state['address_components']
            partial_info = []
            if components.get('street_number'):
                partial_info.append(f"Street #: {components['street_number']}")
            if components.get('street_name'):
                partial_info.append(f"Street: {components['street_name']}")
            if components.get('suburb'):
                partial_info.append(f"Suburb: {components['suburb']}")
            if components.get('state'):
                partial_info.append(f"State: {components['state']}")
            if components.get('postcode'):
                partial_info.append(f"Postcode: {components['postcode']}")
            
            if partial_info:
                address_display = f"Partial - {'; '.join(partial_info)} (Step: {state.get('address_collection_step', 'unknown')})"
        
        print(f"🏠 Address: {address_display} {address_status}")
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
        print(f"  • Address: {state.get('address_attempts', 0)}/{state.get('max_attempts', 3)}")
        print(f"  • Email: {state.get('email_attempts', 0)}/{state.get('max_attempts', 3)}")
        print(f"  • Service: {state.get('service_attempts', 0)}/{state.get('service_max_attempts', 3)}")
        print(f"  • Time: {state.get('time_attempts', 0)}/{state.get('max_attempts', 3)}")
        
        print("="*50)

    def save_to_file(self, state: CustomerServiceState, filename: Optional[str] = None):
        """Save conversation to file"""
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
                "email": state.get("email"),
                "service": state.get("service"),
                "service_time": state.get("service_time")
            },
            "collection_status": {
                "name_complete": state.get("name_complete", False),
                "phone_complete": state.get("phone_complete", False),
                "address_complete": state.get("address_complete", False),
                "email_complete": state.get("email_complete", False),
                "service_complete": state.get("service_complete", False),
                "time_complete": state.get("time_complete", False)
            },
            "attempts": {
                "name_attempts": state.get("name_attempts", 0),
                "phone_attempts": state.get("phone_attempts", 0),
                "address_attempts": state.get("address_attempts", 0),
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
        """Start conversation process (for standalone testing)"""
        # Initialize state
        state: CustomerServiceState = {
            "name": None,
            "phone": None,
            "address": None,
            "email": None,
            "service": None,
            "service_time": None,
            "address_components": {
                "street_number": None,
                "street_name": None,
                "suburb": None,
                "state": None,
                "postcode": None
            },
            "address_collection_step": "street",
            "current_step": "collect_name",
            "name_attempts": 0,
            "phone_attempts": 0,
            "address_attempts": 0,
            "email_attempts": 0,
            "service_attempts": 0,
            "time_attempts": 0,
            "max_attempts": settings.max_attempts,
            "service_max_attempts": settings.service_max_attempts,
            "last_user_input": None,
            "last_llm_response": None,
            "name_complete": False,
            "phone_complete": False,
            "address_complete": False,
            "email_complete": False,
            "service_complete": False,
            "time_complete": False,
            "conversation_complete": False,
            "service_available": True,
            "time_available": True,
        }
        
        print("🤖 AI Customer Service Assistant Started")
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
                
                # Process based on current step
                if not state["name_complete"]:
                    state = self.process_name_collection(state)
                elif not state["phone_complete"]:
                    state = self.process_phone_collection(state)
                elif not state["address_complete"]:
                    state = self.process_address_collection(state)
                elif not state["email_complete"]:
                    state = self.process_email_collection(state)
                elif not state["service_complete"]:
                    state = self.process_service_collection(state)
                elif not state["time_complete"]:
                    state = self.process_time_collection(state)
                else:
                    state["conversation_complete"] = True
                
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
    print("🚀 Starting AI customer service system test...")
    
    # Create customer service instance
    cs_agent = CustomerServiceLangGraph()
    
    # Start conversation
    final_state = cs_agent.start_conversation()
    
    print("\n📊 Final state summary:")
    cs_agent.print_results(final_state)