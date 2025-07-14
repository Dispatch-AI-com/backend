from fastapi import APIRouter, HTTPException
from ..models.booking import BookingRequest, BookingResponse
from ..services.booking_handler import booking_handler

router = APIRouter(prefix="/booking", tags=["booking"])


@router.post("/create", response_model=BookingResponse)
async def create_booking(request: BookingRequest):
    try:
        booking = await booking_handler.create_booking(request)
        return booking
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{booking_id}/confirm", response_model=BookingResponse)
async def confirm_booking(booking_id: str):
    try:
        booking = await booking_handler.confirm_booking(booking_id)
        return booking
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{booking_id}/cancel", response_model=BookingResponse)
async def cancel_booking(booking_id: str):
    try:
        booking = await booking_handler.cancel_booking(booking_id)
        return booking
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
