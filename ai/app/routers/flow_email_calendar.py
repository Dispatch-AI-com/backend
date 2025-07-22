# app/routers/flow_email_calendar.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List
from app.chains.email_then_calendar import run_email_then_calendar

router = APIRouter(prefix="/flow", tags=["flow"])

class FlowIn(BaseModel):
    to: str
    subject: str
    body: str
    title: str
    start: str
    end: str
    description: str = ""
    location: str = ""
    organizer: str = ""
    access_token: str = ""
    attendees: List[str] = Field(default_factory=list)

@router.post("/email_then_calendar")
async def email_then_calendar(body: FlowIn):
    try:
        return {"status": "ok", "detail": await run_email_then_calendar(body.model_dump())}
    except Exception as e:
        raise HTTPException(500, repr(e))
