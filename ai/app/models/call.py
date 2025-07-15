from pydantic import BaseModel
from typing import Optional, List, Literal
from enum import Enum


# Call Status and Processing Models
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


# Call Data Structure Models
class Message(BaseModel):
    speaker: Literal['AI', 'customer']
    message: str
    startedAt: str


class Service(BaseModel):
    id: str
    name: str
    price: Optional[float]
    description: Optional[str] = None


class UserInfo(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    email: Optional[str] = None


class Company(BaseModel):
    id: str
    name: str
    email: str
    phone: Optional[str] = None


class UserState(BaseModel):
    service: Optional[Service] = None
    serviceBookedTime: Optional[str] = None
    userInfo: Optional[UserInfo] = UserInfo()


class CallSkeleton(BaseModel):
    callSid: str
    services: List[Service]
    company: Company
    user: UserState
    history: List[Message]
    servicebooked: bool
    confirmEmailsent: bool
    createdAt: str