import os
import aiosmtplib
import email.utils
from email.message import EmailMessage

# 统一读环境变量，并设默认值
SES_FROM = os.getenv("SES_FROM", "no-reply@dispatchai.com")
SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASS = os.getenv("SMTP_PASS")

# 只开启一种 TLS：587 -> STARTTLS；465 -> SSL/TLS
TLS_KW = dict(
    start_tls=(SMTP_PORT == 587),
    use_tls=(SMTP_PORT == 465),
)


async def send_plain_email(to: str, subject: str, body: str) -> None:
    msg = EmailMessage()
    msg["From"] = email.utils.formataddr(("DispatchAI Bot", SES_FROM))
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(body, subtype="plain", charset="utf-8")

    await aiosmtplib.send(
        msg,
        hostname=SMTP_HOST,
        port=SMTP_PORT,
        username=SMTP_USER,
        password=SMTP_PASS,
        timeout=10,
        **TLS_KW,
    )


def _ensure_crlf(text: str) -> str:
    return text.replace("\r\n", "\n").replace("\n", "\r\n")


async def send_email_with_ics(
    to: str,
    subject: str,
    body: str,
    ics_content: str,
    method: str = "REQUEST",
) -> None:
    msg = EmailMessage()
    msg["From"] = email.utils.formataddr(("DispatchAI Bot", SES_FROM))
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(body, subtype="plain", charset="utf-8")

    ics = _ensure_crlf(ics_content)

    msg.add_attachment(
        ics.encode("utf-8"),
        maintype="text",
        subtype="calendar",
        filename="invite.ics",
    )

    await aiosmtplib.send(
        msg,
        hostname=SMTP_HOST,
        port=SMTP_PORT,
        username=SMTP_USER,
        password=SMTP_PASS,
        timeout=10,
        **TLS_KW,
    )
