import json
from models.call import CallSkeleton
from typing import Optional, Dict, Any

from infrastructure.redis_client import get_redis

r = get_redis()


def get_call_skeleton(call_sid: str) -> CallSkeleton:
    data = r.get(f"call:{call_sid}")
    if not data:
        raise ValueError("CallSkeleton not found")
    print(f"🔍 Redis: Retrieved raw data for {call_sid}")
    try:
        skeleton = CallSkeleton.model_validate_json(data)
        print("🔍 Redis: Successfully parsed CallSkeleton")

        # Debug address specifically
        if skeleton.user and skeleton.user.userInfo and skeleton.user.userInfo.address:
            addr = skeleton.user.userInfo.address
            print(f"🔍 Redis: Address from skeleton: {addr}")
        else:
            print("🔍 Redis: No address found in skeleton")

        return skeleton
    except Exception as e:
        print(f"❌ Redis: Failed to parse CallSkeleton: {str(e)}")
        # Print raw data for debugging
        import json

        try:
            raw_dict = json.loads(data)
            print(
                f"🔍 Redis: Raw address data: {raw_dict.get('user', {}).get('userInfo', {}).get('address', 'Not found')}"
            )
        except json.JSONDecodeError:
            pass
        raise


def get_call_skeleton_dict(call_sid: str) -> Dict[str, Any]:
    """Get CallSkeleton in dictionary format"""
    data = r.get(f"call:{call_sid}")
    if not data:
        raise ValueError("CallSkeleton not found")
    return json.loads(data)


def get_message_history(call_sid: str) -> list:
    """Get message history from Redis for a specific call"""
    try:
        skeleton_dict = get_call_skeleton_dict(call_sid)
        history = skeleton_dict.get("history", [])
        
        # Convert to the format expected by extractors
        message_history = []
        for msg in history[-8:]:  # Last 8 messages for context
            message_history.append({
                "role": "user" if msg.get("speaker") == "customer" else "assistant",
                "content": msg.get("message", "")
            })
        
        print(f"🔍 Redis: Retrieved {len(message_history)} messages from history")
        return message_history
    except Exception as e:
        print(f"❌ Redis: Failed to get message history: {str(e)}")
        return []


def update_user_info_field(
    call_sid: str, field_name: str, field_value, timestamp: Optional[str] = None
) -> bool:
    """Update specific user information field in real-time (5-step workflow)

    Args:
        call_sid: Call ID
        field_name: Field name (name, phone, address)
        field_value: Field value (for address: single string)
        timestamp: Update timestamp

    Returns:
        bool: Whether update was successful
    """
    print(
        f"🔍 Redis update_user_info_field called: call_sid={call_sid}, field_name={field_name}, field_value={field_value}"
    )
    try:
        # Get current CallSkeleton data
        skeleton_dict = get_call_skeleton_dict(call_sid)
        print("🔍 Retrieved skeleton from Redis successfully")

        # Update user information field
        if "user" not in skeleton_dict:
            skeleton_dict["user"] = {
                "userInfo": {},
                "service": None,
                "serviceBookedTime": None,
            }
        if "userInfo" not in skeleton_dict["user"]:
            skeleton_dict["user"]["userInfo"] = {}

        # 5-step workflow: Simple field storage (name, phone, address as strings)
        skeleton_dict["user"]["userInfo"][field_name] = field_value
        print(f"🔍 Redis: Set field {field_name} = {field_value}")

        # Add timestamp record
        if timestamp:
            timestamp_field = f"{field_name}_timestamp"
            skeleton_dict["user"]["userInfo"][timestamp_field] = timestamp

        # Save back to Redis
        try:
            json_data = json.dumps(skeleton_dict)
            r.set(f"call:{call_sid}", json_data)
            print(f"✅ Redis update successful: {field_name}")
            if field_name == "address":
                print(
                    f"🔍 Redis: Final skeleton userInfo: {skeleton_dict.get('user', {}).get('userInfo', {})}"
                )
            return True
        except Exception as json_error:
            print(f"❌ Redis JSON serialization failed: {str(json_error)}")
            return False

    except Exception as e:
        print(f"❌ Redis update failed ({field_name}): {str(e)}")
        return False


def update_address_components(
    call_sid: str, 
    address: str,
    street_number: Optional[str] = None,
    street_name: Optional[str] = None,
    suburb: Optional[str] = None,
    postcode: Optional[str] = None,
    state: Optional[str] = None,
    timestamp: Optional[str] = None
) -> bool:
    """Update address and its granular components in real-time

    Args:
        call_sid: Call ID
        address: Complete address string
        street_number: House/unit number
        street_name: Street name including type
        suburb: Suburb/city name
        postcode: 4-digit postal code
        state: Australian state/territory abbreviation
        timestamp: Update timestamp

    Returns:
        bool: Whether update was successful
    """
    print(
        f"🔍 Redis update_address_components called: call_sid={call_sid}, address={address}"
    )
    print(f"🔍 Components: street_number={street_number}, street_name={street_name}, suburb={suburb}, postcode={postcode}, state={state}")
    
    try:
        # Get current CallSkeleton data
        skeleton_dict = get_call_skeleton_dict(call_sid)
        print("🔍 Retrieved skeleton from Redis successfully")

        # Update user information
        if "user" not in skeleton_dict:
            skeleton_dict["user"] = {
                "userInfo": {},
                "service": None,
                "serviceBookedTime": None,
            }
        if "userInfo" not in skeleton_dict["user"]:
            skeleton_dict["user"]["userInfo"] = {}

        # Store complete address and individual components
        skeleton_dict["user"]["userInfo"]["address"] = address
        skeleton_dict["user"]["userInfo"]["street_number"] = street_number
        skeleton_dict["user"]["userInfo"]["street_name"] = street_name
        skeleton_dict["user"]["userInfo"]["suburb"] = suburb
        skeleton_dict["user"]["userInfo"]["postcode"] = postcode
        skeleton_dict["user"]["userInfo"]["state"] = state
        
        print(f"🔍 Redis: Set address components - full address: {address}")
        print(f"🔍 Redis: Components stored: {street_number}, {street_name}, {suburb}, {postcode}, {state}")

        # Add timestamp record
        if timestamp:
            skeleton_dict["user"]["userInfo"]["address_timestamp"] = timestamp

        # Save back to Redis
        try:
            json_data = json.dumps(skeleton_dict)
            r.set(f"call:{call_sid}", json_data)
            print("✅ Redis address components update successful")
            print(f"🔍 Redis: Final userInfo: {skeleton_dict.get('user', {}).get('userInfo', {})}")
            return True
        except Exception as json_error:
            print(f"❌ Redis JSON serialization failed: {str(json_error)}")
            return False

    except Exception as e:
        print(f"❌ Redis address components update failed: {str(e)}")
        return False


def update_service_selection(
    call_sid: str,
    service_name: str,
    service_id: Optional[str] = None,
    service_price: Optional[float] = None,
    service_description: Optional[str] = None,
    service_time: Optional[str] = None,
    timestamp: Optional[str] = None,
) -> bool:
    """Update service selection information in real-time

    Args:
        call_sid: Call ID
        service_name: Service name
        service_id: Service ID (optional)
        service_price: Service price (optional)
        service_description: Service description (optional, for data completeness)
        service_time: Service time (optional)
        timestamp: Update timestamp

    Returns:
        bool: Whether update was successful
    """
    try:
        # Get current CallSkeleton data
        skeleton_dict = get_call_skeleton_dict(call_sid)

        # Update service information
        if "user" not in skeleton_dict:
            skeleton_dict["user"] = {
                "userInfo": {},
                "service": None,
                "serviceBookedTime": None,
            }

        # Build service object with provided or default values
        service_obj = {
            "id": service_id or f"service_{service_name.lower()}",
            "name": service_name,
            "price": service_price,  # float | None to match TypeScript number | null
            "description": service_description,  # Keep for data completeness but don't display to user
        }

        skeleton_dict["user"]["service"] = service_obj

        # Update service time if provided
        if service_time:
            skeleton_dict["user"]["serviceBookedTime"] = service_time

        # Add timestamp record
        if timestamp:
            if "userInfo" not in skeleton_dict["user"]:
                skeleton_dict["user"]["userInfo"] = {}
            skeleton_dict["user"]["userInfo"]["service_timestamp"] = timestamp
            if service_time:
                skeleton_dict["user"]["userInfo"]["time_timestamp"] = timestamp

        # Save back to Redis
        r.set(f"call:{call_sid}", json.dumps(skeleton_dict))

        service_info = f"name: {service_name}"
        if service_price is not None:
            service_info += f", price: ${service_price}"
        if service_time:
            service_info += f", time: {service_time}"
        print(f"✅ Redis service update successful: {service_info}")
        return True

    except Exception as e:
        print(f"❌ Redis service update failed: {str(e)}")
        return False


def update_booking_status(
    call_sid: str, is_booked: bool, email_sent: bool = False
) -> bool:
    """Update booking status

    Args:
        call_sid: Call ID
        is_booked: Whether service is booked
        email_sent: Whether confirmation email has been sent

    Returns:
        bool: Whether update was successful
    """
    try:
        # Get current CallSkeleton data
        skeleton_dict = get_call_skeleton_dict(call_sid)

        # Update booking status
        skeleton_dict["servicebooked"] = is_booked
        skeleton_dict["confirmEmailsent"] = email_sent

        # Save back to Redis
        r.set(f"call:{call_sid}", json.dumps(skeleton_dict))

        print(
            f"✅ Redis booking status update successful: booked={is_booked}, email_sent={email_sent}"
        )
        return True

    except Exception as e:
        print(f"❌ Redis booking status update failed: {str(e)}")
        return False
