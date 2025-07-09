import email.utils, aiosmtplib, os, email.message

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
