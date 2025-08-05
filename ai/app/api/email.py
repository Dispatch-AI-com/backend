# api/email.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import uuid4

import pendulum
from services.ses_email import send_plain_email, send_email_with_ics
from services.ics_lib import build_ics_request, build_ics_cancel

router = APIRouter(
    prefix="/email",
    tags=["email"],
    responses={404: {"description": "Not found"}},
)


class BaseMailArgs(BaseModel):
    to: str = Field(..., description="收件人邮箱")
    subject: str = Field(..., description="邮件主题")
    body: str = Field(..., description="纯文本正文")


class EventInfo(BaseModel):
    uid: Optional[str] = Field(None, description="事件 UID；不传时自动生成")
    summary: str = Field(..., description="事件标题")
    start: datetime = Field(..., description="开始时间，ISO8601")
    end: datetime = Field(..., description="结束时间，ISO8601")
    description: Optional[str] = Field(None, description="事件描述")
    location: Optional[str] = Field(None, description="事件地点")
    organizer_name: str = Field("DispatchAI", description="发起人姓名")
    organizer_email: str = Field("no-reply@dispatchai.com", description="发起人邮箱")
    attendees: List[str] = Field(default_factory=list, description="参与人邮箱列表")
    sequence: int = Field(0, description="更新序号，更新/取消时＋1")
    rrule: Optional[Dict[str, Any]] = Field(
        None,
        description='重复规则，如 {"freq":"DAILY","count":5} 或 {"freq":"WEEKLY","interval":1}',
    )
    alarm_minutes_before: Optional[int] = Field(None, description="会前多少分钟提醒")
    cancel: bool = Field(False, description="是否取消 (CANCEL)")
    timezone: str = Field(
        "Australia/Sydney", description="事件时区（IANA 名称），默认悉尼市区"
    )


class SendPlainArgs(BaseMailArgs):
    pass


@router.post(
    "/send",
    summary="Send plain email",
    operation_id="send_email",
)
async def send_email(args: SendPlainArgs):
    try:
        await send_plain_email(args.to, args.subject, args.body)
        return {"status": "ok", "sent_to": args.to}
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


class SendICSArgs(BaseMailArgs, EventInfo):
    pass


def _to_pendulum_with_tz(dt: datetime, tz_name: str) -> pendulum.DateTime:
    if dt.tzinfo is None:
        return pendulum.parse(dt.isoformat(), tz=tz_name)
    else:
        return pendulum.instance(dt).in_tz(tz_name)


@router.post(
    "/send-ics",
    summary="Send email with ICS invite",
    operation_id="send_email_with_ics",
)
async def send_email_with_ics_api(args: SendICSArgs):
    try:
        if args.end <= args.start:
            raise HTTPException(status_code=400, detail="end must be after start")

        uid = args.uid or f"{uuid4()}@dispatchai"
        start = _to_pendulum_with_tz(args.start, args.timezone)
        end = _to_pendulum_with_tz(args.end, args.timezone)

        if args.cancel:
            ics = build_ics_cancel(
                uid=uid,
                summary=args.summary,
                start=start,
                end=end,
                organizer_email=args.organizer_email,
                organizer_name=args.organizer_name,
                attendees=args.attendees,
                sequence=max(1, args.sequence),
            )
            method = "CANCEL"
        else:
            ics = build_ics_request(
                uid=uid,
                summary=args.summary,
                start=start,
                end=end,
                description=args.description,
                location=args.location,
                organizer_email=args.organizer_email,
                organizer_name=args.organizer_name,
                attendees=args.attendees,
                sequence=args.sequence,
                rrule=args.rrule,
                alarm_minutes_before=args.alarm_minutes_before,
            )
            method = "REQUEST"

        await send_email_with_ics(
            to=args.to,
            subject=args.subject,
            body=args.body,
            ics_content=ics,
            method=method,
        )
        return {
            "status": "ok",
            "sent_to": args.to,
            "uid": uid,
            "method": method,
            "sequence": args.sequence,
            "timezone": args.timezone,
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


class SendGoogleCalArgs(BaseMailArgs, EventInfo):
    access_token: str = Field(..., description="Google OAuth Access Token")
    calendar_id: str = Field(..., description="目标日历 ID")


@router.post(
    "/send-google-calendar",
    summary="Create event in Google Calendar",
    operation_id="send_email_with_google_calendar",
)
async def send_email_with_google_calendar(args: SendGoogleCalArgs):
    """
    TODO: 用 HTTP 客户端调用 Google Calendar API，示例在文档中提供。
    """
    # 暂时返回接收到的参数，后续实现逻辑时再替换
    return {
        "status": "pending",
        "tool": "google_calendar",
        "received": args.model_dump(),
    }


class SendOutlookCalArgs(BaseMailArgs, EventInfo):
    access_token: str = Field(..., description="Outlook OAuth Access Token")
    calendar_id: str = Field(..., description="目标日历 ID")


@router.post(
    "/send-outlook-calendar",
    summary="Create event in Outlook Calendar",
    operation_id="send_email_with_outlook_calendar",
)
async def send_email_with_outlook_calendar(args: SendOutlookCalArgs):
    """
    TODO: 用 HTTP 客户端调用 Microsoft Graph API，示例在文档中提供。
    """
    return {
        "status": "pending",
        "tool": "outlook_calendar",
        "received": args.model_dump(),
    }
