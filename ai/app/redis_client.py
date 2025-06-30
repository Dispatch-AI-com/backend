import redis
from .models import CallSkeleton
import os

REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_DB = int(os.getenv("REDIS_DB", 0))

r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=REDIS_DB, decode_responses=True)

def get_call_skeleton(call_sid: str) -> CallSkeleton:
    data = r.get(f"call:{call_sid}")
    if not data:
        raise ValueError("CallSkeleton not found")
    return CallSkeleton.parse_raw(data)

def set_call_skeleton(call_sid: str, skeleton: CallSkeleton):
    r.set(f"call:{call_sid}", skeleton.json()) 