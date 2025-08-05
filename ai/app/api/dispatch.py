# api/dispatch.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Literal, Optional, List, Dict, Any
from uuid import uuid4
from client.mcp_client import call_tool

router = APIRouter(prefix="/dispatch", tags=["dispatch"])


class SendEmailAndCalArgs(BaseModel):
    to: str = Field(..., description="收件人邮箱")
    subject: str = Field(..., description="邮件主题")
    body: str = Field(..., description="邮件正文")
    summary: str = Field(..., description="日历事件标题")
    start: str = Field(..., description="开始时间，ISO8601 带时区")
    end: str = Field(..., description="结束时间，ISO8601 带时区")
    description: Optional[str] = Field(None, description="事件描述")
    location:    Optional[str] = Field(None, description="事件地点")
    attendees:   List[str] = Field(default_factory=list, description="与会人邮箱列表")
    alarm_minutes_before: Optional[int] = Field(None, description="会前多少分钟提醒")
    timezone:    str = Field("Australia/Sydney", description="事件时区")
    calendarapp: Literal["none", "google", "outlook"] = Field(
        "none",
        description="选择哪个日历平台：none（仅发 ICS）、google、outlook"
    )
    access_token: Optional[str] = Field(None, description="OAuth2 访问令牌，仅 google/outlook 模式必填")
    calendar_id:  Optional[str] = Field(None, description="目标日历 ID，仅 google/outlook 模式必填")



@router.post("/send-email-and-calendar", summary="Send email + calendar via chosen platform")
async def send_email_and_calendar(args: SendEmailAndCalArgs):
    uid = f"{uuid4()}@dispatchai"

    if args.calendarapp == "none":
        tool_id = "send_email_with_ics"
    elif args.calendarapp == "google":
        tool_id = "send_email_with_google_calendar"
    elif args.calendarapp == "outlook":
        tool_id = "send_email_with_outlook_calendar"
    else:
        raise HTTPException(status_code=400, detail="Invalid calendarapp value")

    if args.calendarapp in ("google", "outlook"):
        if not args.access_token or not args.calendar_id:
            raise HTTPException(
                status_code=400,
                detail="当 calendarapp=google 或 outlook 时，access_token 和 calendar_id 必填"
            )

    payload: Dict[str, Any] = {
        "to": args.to,
        "subject": args.subject,
        "body": args.body,
        "uid": uid,
        "summary": args.summary,
        "start": args.start,
        "end": args.end,
        "description": args.description,
        "location": args.location,
        "attendees": args.attendees,
        "alarm_minutes_before": args.alarm_minutes_before,
        "timezone": args.timezone,
    }

    if args.calendarapp in ("google", "outlook"):
        payload.update({
            "access_token": args.access_token,
            "calendar_id":  args.calendar_id,
        })

    try:
        raw = await call_tool(tool_id, payload)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"MCP 调用 {tool_id} 失败：{exc}")

    result = getattr(raw, "model_dump", lambda: raw)()
    return {
        "status": "ok",
        "used_tool": tool_id,
        "result": result,
    }
