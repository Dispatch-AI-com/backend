import os
import aiosmtplib
from email.message import EmailMessage
import email.utils

async def send_plain_email(to: str, subject: str, body: str) -> None:
    msg = EmailMessage()
    msg["From"] = email.utils.formataddr(("DispatchAI Bot", os.getenv("SES_FROM")))
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(body, subtype="plain", charset="utf-8")

    await aiosmtplib.send(
        msg,
        hostname=os.getenv("SMTP_HOST"),
        port=int(os.getenv("SMTP_PORT", 587)),
        username=os.getenv("SMTP_USER"),
        password=os.getenv("SMTP_PASS"),
        start_tls=True,
        timeout=10,
    )

async def send_email_with_ics(to: str, subject: str, body: str, ics_content: str):
    msg = email.message.EmailMessage()
    msg["From"] = email.utils.formataddr(("DispatchAI Bot", SES_FROM or "no-reply@dispatchai.com"))
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(body)

    # add ics file as attachment
    msg.add_attachment(
        ics_content,
        maintype="text",
        subtype="calendar",
        filename="invite.ics"
    )

    await aiosmtplib.send(
        msg,
        hostname=SMTP_HOST,
        port=SMTP_PORT,
        username=SMTP_USER,
        password=SMTP_PASS,
        start_tls=True,
    )
