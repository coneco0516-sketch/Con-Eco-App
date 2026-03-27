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

try:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "ConEco Gmail SMTP Test"
    msg["From"] = f"ConEco <{GMAIL_USER}>"
    msg["To"] = GMAIL_USER

    msg.attach(MIMEText("<h1>It works!</h1><p>Gmail SMTP is now sending emails correctly.</p>", "html"))

    with smtplib.SMTP("smtp.gmail.com", 587) as server:
        server.ehlo()
        server.starttls()
        server.login(GMAIL_USER, GMAIL_PASSWORD)
        server.sendmail(GMAIL_USER, GMAIL_USER, msg.as_string())

    print("SUCCESS: Email sent! Check your inbox.")
except Exception as e:
    print(f"FAILED: {str(e)}")
