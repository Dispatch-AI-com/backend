# Redis Integration

## Redis Client (`ai/app/redis_client.py`)

### Purpose
Manages real-time session data storage and CallSkeleton updates.

### Key Functions

#### Core Data Operations
- `get_call_skeleton(call_sid)`: Retrieves CallSkeleton object
- `set_call_skeleton(call_sid, skeleton)`: Stores CallSkeleton object
- `get_call_skeleton_dict(call_sid)`: Retrieves CallSkeleton as dictionary

#### Real-time Update Functions
- `update_user_info_field(call_sid, field_name, field_value, timestamp)`: Updates individual user info fields
- `update_service_selection(call_sid, service_name, service_time, timestamp)`: Updates service selection
- `update_conversation_history(call_sid, message)`: Adds new messages to conversation history
- `update_booking_status(call_sid, is_booked, email_sent)`: Updates booking completion status

### Data Structure (CallSkeleton)
```python
{
  "callSid": "string",
  "services": [{"id": "str", "name": "str", "price": float}],
  "company": {"id": "str", "name": "str", "email": "str"},
  "user": {
    "userInfo": {"name": "str", "phone": "str", "address": "str", "email": "str"},
    "service": {"id": "str", "name": "str"},
    "serviceBookedTime": "str"
  },
  "history": [{"speaker": "str", "message": "str", "startedAt": "str"}],
  "servicebooked": bool,
  "confirmEmailsent": bool
}
```

### Real-time Updates
The AI service performs incremental Redis updates during conversation flow:
- Updates individual fields as they are collected
- Maintains conversation history in real-time
- Tracks collection timestamps
- Updates booking status upon completion