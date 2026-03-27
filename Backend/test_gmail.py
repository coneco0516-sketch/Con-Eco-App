import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from dotenv import load_dotenv

load_dotenv()

GMAIL_USER = os.environ.get("FROM_EMAIL", "coneco0516@gmail.com")
GMAIL_PASSWORD = os.environ.get("GMAIL_APP_PASSWORD", "")

print(f"Gmail User: {GMAIL_USER}")
print(f"Password set: {'YES' if GMAIL_PASSWORD else 'NO'}")
print("Connecting via port 465 (SSL)...")

try:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "ConEco Gmail SMTP SSL Test"
    msg["From"] = f"ConEco <{GMAIL_USER}>"
    msg["To"] = GMAIL_USER
    msg.attach(MIMEText("<h1>Port 465 SSL Works!</h1><p>Emails now send via SSL.</p>", "html"))

    with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=10) as server:
        server.login(GMAIL_USER, GMAIL_PASSWORD)
        server.sendmail(GMAIL_USER, GMAIL_USER, msg.as_string())

    print("SUCCESS: Email sent via port 465 SSL! Check your inbox.")
except Exception as e:
    print(f"FAILED: {str(e)}")
