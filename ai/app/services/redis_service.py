import redis
import json
from models.call import CallSkeleton
from typing import Optional, Dict, Any

from config import settings

REDIS_HOST = settings.redis_host
REDIS_PORT = settings.redis_port
REDIS_DB = settings.redis_db

r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=REDIS_DB, decode_responses=True)

def get_call_skeleton(call_sid: str) -> CallSkeleton:
    data = r.get(f"call:{call_sid}")
    if not data:
        raise ValueError("CallSkeleton not found")
    return CallSkeleton.model_validate_json(data)

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
    try:
        # Get current CallSkeleton data
        skeleton_dict = get_call_skeleton_dict(call_sid)
        
        # Update user information field
        if 'user' not in skeleton_dict:
            skeleton_dict['user'] = {'userInfo': {}, 'service': None, 'serviceBookedTime': None}
        if 'userInfo' not in skeleton_dict['user']:
            skeleton_dict['user']['userInfo'] = {}
            
        # Handle Address object serialization
        if field_name == "address" and hasattr(field_value, 'model_dump'):
            # If it's a Pydantic model (Address object), convert to dict
            skeleton_dict['user']['userInfo'][field_name] = field_value.model_dump()
        elif isinstance(field_value, dict):
            # If it's already a dict (from model_dump()), store directly
            skeleton_dict['user']['userInfo'][field_name] = field_value
        else:
            # For other types (string, etc.), store directly
            skeleton_dict['user']['userInfo'][field_name] = field_value
        
        # Add timestamp record
        if timestamp:
            timestamp_field = f"{field_name}_timestamp"
            skeleton_dict['user']['userInfo'][timestamp_field] = timestamp
        
        # Save back to Redis
        r.set(f"call:{call_sid}", json.dumps(skeleton_dict))
        
        print(f"✅ Redis update successful: {field_name} = {field_value}")
        return True
        
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