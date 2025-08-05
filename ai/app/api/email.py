# api/email.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import uuid4

from services.ses_email import send_plain_email, send_email_with_ics
from services.ics_lib import build_ics_request, build_ics_cancel

router = APIRouter(
    prefix="/email",
    tags=["email"],
    responses={404: {"description": "Not found"}},
)

class SendEmailArgs(BaseModel):
    to: str      = Field(..., description="收件人邮箱（沙盒需验证）")
    subject: str = Field(..., description="邮件主题")
    body: str    = Field(..., description="纯文本正文")

@router.post("/send", summary="Send plain email", operation_id="send_email")
async def send_email(args: SendEmailArgs):
    try:
        await send_plain_email(args.to, args.subject, args.body)
        return {"status": "ok", "sent_to": args.to}
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


class EventArgs(BaseModel):
    uid: Optional[str] = Field(None, description="事件 UID；不传则自动生成")
    summary: str
    start: datetime
    end: datetime
    description: Optional[str] = None
    location: Optional[str] = None
    organizer_name: Optional[str] = "DispatchAI"
    organizer_email: Optional[str] = "no-reply@dispatchai.com"
    attendees: List[str] = []
    sequence: int = 0
    rrule: Optional[Dict[str, Any]] = Field(
        None,
        description='复用 icalendar 的结构，例如 {"freq":"weekly","count":5} 或 {"freq":"daily","interval":1}',
    )
    alarm_minutes_before: Optional[int] = Field(
        None, description="会前多少分钟提醒（VALARM）"
    )
    cancel: bool = False  # True -> 发送取消邀请

class SendEmailWithICSArgs(BaseModel):
    to: str       = Field(..., description="收件人邮箱（沙盒需验证）")
    subject: str  = Field(..., description="邮件主题")
    body: str     = Field(..., description="纯文本正文")
    event: EventArgs

@router.post(
    "/send-ics",
    summary="Send email with ICS (icalendar)",
    operation_id="send_email_with_ics",
)
async def send_email_with_ics_api(args: SendEmailWithICSArgs):
    try:
        ev = args.event
        if ev.end <= ev.start:
            raise HTTPException(status_code=400, detail="end must be after start")

        uid = ev.uid or f"{uuid4()}@dispatchai"

        if ev.cancel:
            ics = build_ics_cancel(
                uid=uid,
                summary=ev.summary,
                start=ev.start,
                end=ev.end,
                organizer_email=ev.organizer_email or "no-reply@dispatchai.com",
                organizer_name=ev.organizer_name or "DispatchAI",
                attendees=ev.attendees or [],
                sequence=max(1, ev.sequence),
            )
            method = "CANCEL"
        else:
            ics = build_ics_request(
                uid=uid,
                summary=ev.summary,
                start=ev.start,
                end=ev.end,
                description=ev.description,
                location=ev.location,
                organizer_email=ev.organizer_email or "no-reply@dispatchai.com",
                organizer_name=ev.organizer_name or "DispatchAI",
                attendees=ev.attendees or [],
                sequence=ev.sequence,
                rrule=ev.rrule,
                alarm_minutes_before=ev.alarm_minutes_before,
            )
            method = "REQUEST"

        await send_email_with_ics(
            to=args.to,
            subject=args.subject,
            body=args.body,
            ics_content=ics,
            method=method,
        )
        return {"status": "ok", "sent_to": args.to, "uid": uid, "method": method, "sequence": ev.sequence}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
