from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from smtplib import SMTPException
from typing import Optional

from app.services.ses_email import send_plain_email

router = APIRouter(
    prefix="/email",
    tags=["email"],
    responses={404: {"description": "Not found"}},
)

class SendEmailArgs(BaseModel):
    to: str      = Field(..., description="收件人邮箱（沙盒需验证）")
    subject: str = Field(..., description="邮件主题")
    body: str    = Field(..., description="纯文本正文")
    ics: Optional[str] = Field(None, description="ICS日历内容，可选")

@router.post("/send", summary="Send email via SES SMTP")
async def send_email(args: SendEmailArgs):
    try:
        await send_plain_email(args.to, args.subject, args.body)
    except SMTPException as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return {"status": "ok", "sent_to": args.to}
