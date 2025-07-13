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
    print(f"[DEBUG] Sending email to {to} with subject {subject}")

    await aiosmtplib.send(
        msg,
        hostname=os.getenv("SMTP_HOST"),
        port=int(os.getenv("SMTP_PORT", 587)),
        username=os.getenv("SMTP_USER"),
        password=os.getenv("SMTP_PASS"),
        start_tls=True,
        timeout=10,
    )
