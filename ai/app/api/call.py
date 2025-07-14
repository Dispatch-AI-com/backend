from fastapi import APIRouter, HTTPException
from ..models.call import CallRequest, CallSummary
from ..services.call_handler import call_handler

router = APIRouter(prefix="/call", tags=["call"])


@router.post("/initiate")
async def initiate_call(request: CallRequest):
    try:
        call_id = await call_handler.initiate_call(request)
        return {"call_id": call_id, "status": "initiated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{call_id}/message")
async def process_message(call_id: str, message: dict):
    try:
        response = await call_handler.process_call_message(call_id, message["text"])
        return {"response": response}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{call_id}/end", response_model=CallSummary)
async def end_call(call_id: str):
    try:
        summary = await call_handler.end_call(call_id)
        return summary
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
