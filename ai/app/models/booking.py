from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum


class BookingStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"


class BookingRequest(BaseModel):
    customer_name: str
    phone_number: str
    service_type: str
    preferred_date: Optional[datetime] = None
    notes: Optional[str] = None


class BookingResponse(BaseModel):
    booking_id: str
    status: BookingStatus
    customer_name: str
    service_type: str
    scheduled_date: Optional[datetime] = None
    confirmation_message: Optional[str] = None
