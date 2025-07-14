from pydantic import BaseModel
from typing import Optional, List
from enum import Enum


class CallStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"


class CallRequest(BaseModel):
    phone_number: str
    customer_name: Optional[str] = None
    purpose: Optional[str] = None


class CallSummary(BaseModel):
    call_id: str
    status: CallStatus
    summary: Optional[str] = None
    key_points: Optional[List[str]] = None
    duration: Optional[int] = None
