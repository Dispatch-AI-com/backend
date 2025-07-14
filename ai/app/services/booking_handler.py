from uuid import uuid4
from datetime import datetime, timedelta
from typing import Dict, Any
from models.booking import BookingRequest, BookingResponse, BookingStatus
from services.llm_service import llm_service


# TODO: WORK IN PROGRESS
# This service needs to integrate with the backend ServiceBooking schema
# Target schema: /Users/markwang/Documents/Dispatch AI/backend/src/modules/service-booking/schema/service-booking.schema.ts
#
# Actual ServiceBooking schema fields:
# - serviceId: string (required)
# - companyId: string (required)
# - client: { name: string, phoneNumber: string, address: string }
# - serviceFormValues: [{ serviceFieldId: string, answer: string }]
# - status: 'pending' | 'confirmed' | 'done' (default: 'pending')
# - note: string
# - bookingTime: Date (required)
# - timestamps: true (createdAt, updatedAt auto-generated)
#
# Need to:
# 1. Connect to backend service booking API endpoints
# 2. Map AI booking requests to ServiceBooking schema format
# 3. Handle serviceId and companyId resolution from session/context
# 4. Collect and map service form field values
# 5. Integrate with telephony call system


class BookingHandler:
    def __init__(self):
        self.bookings: Dict[str, Dict[str, Any]] = {}

    async def create_booking(self, request: BookingRequest) -> BookingResponse:
        booking_id = str(uuid4())

        # Simple scheduling logic
        if request.preferred_date:
            scheduled_date = request.preferred_date
        else:
            # Schedule for tomorrow by default
            scheduled_date = datetime.now() + timedelta(days=1)

        # Use LLM to generate confirmation message
        confirmation_prompt = f"Generate a professional booking confirmation message for customer {request.customer_name} for service {request.service_type} on {scheduled_date.strftime('%Y-%m-%d %H:%M')}"

        confirmation_message = await llm_service.generate_response(confirmation_prompt)

        booking_data = {
            "customer_name": request.customer_name,
            "phone_number": request.phone_number,
            "service_type": request.service_type,
            "scheduled_date": scheduled_date,
            "notes": request.notes,
            "status": BookingStatus.PENDING,
            "created_at": datetime.now(),
        }

        self.bookings[booking_id] = booking_data

        return BookingResponse(
            booking_id=booking_id,
            status=BookingStatus.PENDING,
            customer_name=request.customer_name,
            service_type=request.service_type,
            scheduled_date=scheduled_date,
            confirmation_message=confirmation_message,
        )

    async def confirm_booking(self, booking_id: str) -> BookingResponse:
        if booking_id not in self.bookings:
            raise ValueError("Booking not found")

        booking_data = self.bookings[booking_id]
        booking_data["status"] = BookingStatus.CONFIRMED

        return BookingResponse(
            booking_id=booking_id,
            status=BookingStatus.CONFIRMED,
            customer_name=booking_data["customer_name"],
            service_type=booking_data["service_type"],
            scheduled_date=booking_data["scheduled_date"],
            confirmation_message="Booking confirmed successfully!",
        )

    async def cancel_booking(self, booking_id: str) -> BookingResponse:
        if booking_id not in self.bookings:
            raise ValueError("Booking not found")

        booking_data = self.bookings[booking_id]
        booking_data["status"] = BookingStatus.CANCELLED

        return BookingResponse(
            booking_id=booking_id,
            status=BookingStatus.CANCELLED,
            customer_name=booking_data["customer_name"],
            service_type=booking_data["service_type"],
            scheduled_date=booking_data["scheduled_date"],
            confirmation_message="Booking cancelled successfully.",
        )


booking_handler = BookingHandler()
