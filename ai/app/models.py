from typing import List, Optional, Literal
from pydantic import BaseModel

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