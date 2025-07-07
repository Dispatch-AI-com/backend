import email.utils, aiosmtplib, os

SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASS = os.getenv("SMTP_PASS")
SES_FROM  = os.getenv("SES_FROM")

async def send_plain_email(to: str, subject: str, body: str) -> None:
    msg = (
        f"From: {email.utils.formataddr(('DispatchAI Bot', SES_FROM))}\n"
        f"To: {to}\n"
        f"Subject: {subject}\n"
        f"Content-Type: text/plain; charset=utf-8\n\n{body}"
    )
    await aiosmtplib.send(
        msg,
        hostname=SMTP_HOST,
        port=SMTP_PORT,
        username=SMTP_USER,
        password=SMTP_PASS,
        start_tls=True,
    )
