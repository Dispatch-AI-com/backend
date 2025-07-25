import redis
import json
from app.models.call import CallSkeleton
from typing import Optional, Dict, Any

from app.config import settings

REDIS_HOST = settings.redis_host
REDIS_PORT = settings.redis_port
REDIS_DB = settings.redis_db

r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=REDIS_DB, decode_responses=True)

def get_call_skeleton(call_sid: str) -> CallSkeleton:
    data = r.get(f"call:{call_sid}")
    if not data:
        raise ValueError("CallSkeleton not found")
    print(f"🔍 Redis: Retrieved raw data for {call_sid}")
    try:
        skeleton = CallSkeleton.model_validate_json(data)
        print(f"🔍 Redis: Successfully parsed CallSkeleton")
        
        # Debug address specifically
        if skeleton.user and skeleton.user.userInfo and skeleton.user.userInfo.address:
            addr = skeleton.user.userInfo.address
            print(f"🔍 Redis: Address from skeleton: {addr}")
            print(f"🔍 Redis: Address fields: street_number='{addr.street_number}', street_name='{addr.street_name}', suburb='{addr.suburb}', state='{addr.state}', postcode='{addr.postcode}'")
        else:
            print(f"🔍 Redis: No address found in skeleton")
            
        return skeleton
    except Exception as e:
        print(f"❌ Redis: Failed to parse CallSkeleton: {str(e)}")
        # Print raw data for debugging
        import json
        try:
            raw_dict = json.loads(data)
            print(f"🔍 Redis: Raw address data: {raw_dict.get('user', {}).get('userInfo', {}).get('address', 'Not found')}")
        except:
            pass
        raise

def get_call_skeleton_dict(call_sid: str) -> Dict[str, Any]:
    """Get CallSkeleton in dictionary format"""
    data = r.get(f"call:{call_sid}")
    if not data:
        raise ValueError("CallSkeleton not found")
    return json.loads(data)

def update_user_info_field(call_sid: str, field_name: str, field_value, timestamp: Optional[str] = None) -> bool:
    """Update specific user information field in real-time
    
    Args:
        call_sid: Call ID
        field_name: Field name (name, phone, address, email)
        field_value: Field value
        timestamp: Update timestamp
    
    Returns:
        bool: Whether update was successful
    """
    print(f"🔍 Redis update_user_info_field called: call_sid={call_sid}, field_name={field_name}, field_value={field_value}")
    try:
        # Get current CallSkeleton data
        skeleton_dict = get_call_skeleton_dict(call_sid)
        print(f"🔍 Retrieved skeleton from Redis successfully")
        
        # Update user information field
        if 'user' not in skeleton_dict:
            skeleton_dict['user'] = {'userInfo': {}, 'service': None, 'serviceBookedTime': None}
        if 'userInfo' not in skeleton_dict['user']:
            skeleton_dict['user']['userInfo'] = {}
            
        # Handle nested field paths (e.g., "address.street_number")
        if "." in field_name:
            path_parts = field_name.split(".")
            current_dict = skeleton_dict['user']['userInfo']
            
            # Navigate to the nested structure
            for part in path_parts[:-1]:
                if part not in current_dict:
                    current_dict[part] = {}
                current_dict = current_dict[part]
            
            # Set the final field
            final_field = path_parts[-1]
            current_dict[final_field] = field_value
            print(f"🔍 Redis: Set nested field {field_name} = {field_value}")
            
        elif field_name == "address":
            print(f"🔍 Redis: Processing complete address field, type: {type(field_value)}")
            if hasattr(field_value, 'model_dump'):
                # If it's a Pydantic model (Address object), convert to dict
                address_dict = field_value.model_dump()
                print(f"🔍 Redis: Address converted to dict: {address_dict}")
                skeleton_dict['user']['userInfo'][field_name] = address_dict
            elif isinstance(field_value, dict):
                # If it's already a dict (from model_dump()), store directly
                print(f"🔍 Redis: Address already dict: {field_value}")
                skeleton_dict['user']['userInfo'][field_name] = field_value
            else:
                print(f"🔍 Redis: Address unexpected type: {type(field_value)}")
                skeleton_dict['user']['userInfo'][field_name] = field_value
        else:
            # For other types (string, etc.), store directly
            skeleton_dict['user']['userInfo'][field_name] = field_value
        
        # Add timestamp record
        if timestamp:
            timestamp_field = f"{field_name}_timestamp"
            skeleton_dict['user']['userInfo'][timestamp_field] = timestamp
        
        # Save back to Redis
        try:
            json_data = json.dumps(skeleton_dict)
            r.set(f"call:{call_sid}", json_data)
            print(f"✅ Redis update successful: {field_name}")
            if field_name == "address":
                print(f"🔍 Redis: Final skeleton userInfo: {skeleton_dict.get('user', {}).get('userInfo', {})}")
            return True
        except Exception as json_error:
            print(f"❌ Redis JSON serialization failed: {str(json_error)}")
            return False
        
    except Exception as e:
        print(f"❌ Redis update failed ({field_name}): {str(e)}")
        return False

def update_service_selection(call_sid: str, service_name: str, service_time: Optional[str] = None, timestamp: Optional[str] = None) -> bool:
    """Update service selection information in real-time
    
    Args:
        call_sid: Call ID
        service_name: Service name
        service_time: Service time (optional)
        timestamp: Update timestamp
        
    Returns:
        bool: Whether update was successful
    """
    try:
        # Get current CallSkeleton data
        skeleton_dict = get_call_skeleton_dict(call_sid)
        
        # Update service information
        if 'user' not in skeleton_dict:
            skeleton_dict['user'] = {'userInfo': {}, 'service': None, 'serviceBookedTime': None}
            
        # Build service object
        service_obj = {
            "id": f"service_{service_name.lower()}",
            "name": service_name,
            "price": None,
            "description": f"{service_name} service"
        }
        
        skeleton_dict['user']['service'] = service_obj
        
        # Update service time
        if service_time:
            skeleton_dict['user']['serviceBookedTime'] = service_time
            
        # Add timestamp record
        if timestamp:
            if 'userInfo' not in skeleton_dict['user']:
                skeleton_dict['user']['userInfo'] = {}
            skeleton_dict['user']['userInfo']['service_timestamp'] = timestamp
            if service_time:
                skeleton_dict['user']['userInfo']['time_timestamp'] = timestamp
        
        # Save back to Redis
        r.set(f"call:{call_sid}", json.dumps(skeleton_dict))
        
        print(f"✅ Redis service update successful: {service_name}" + (f", time: {service_time}" if service_time else ""))
        return True
        
    except Exception as e:
        print(f"❌ Redis service update failed: {str(e)}")
        return False


def update_booking_status(call_sid: str, is_booked: bool, email_sent: bool = False) -> bool:
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
        skeleton_dict['servicebooked'] = is_booked
        skeleton_dict['confirmEmailsent'] = email_sent
        
        # Save back to Redis
        r.set(f"call:{call_sid}", json.dumps(skeleton_dict))
        
        print(f"✅ Redis booking status update successful: booked={is_booked}, email_sent={email_sent}")
        return True
        
    except Exception as e:
        print(f"❌ Redis booking status update failed: {str(e)}")
        return False 