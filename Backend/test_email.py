import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from dotenv import load_dotenv

load_dotenv()

SENDGRID_API_KEY = os.environ.get("SENDGRID_API_KEY")
FROM_EMAIL = os.environ.get("FROM_EMAIL")

def test_sendgrid():
    print(f"Testing SendGrid with API Key starting with: {SENDGRID_API_KEY[:10] if SENDGRID_API_KEY else 'NONE'}")
    print(f"From Email: {FROM_EMAIL}")
    
    if not SENDGRID_API_KEY or not FROM_EMAIL:
        print("Missing credentials!")
        return

    message = Mail(
        from_email=FROM_EMAIL,
        to_emails='coneco0516@gmail.com',
        subject='SendGrid Connection Test',
        html_content='<strong>SendGrid is working!</strong>')
    
    try:
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)
        print(f"Status Code: {response.status_code}")
        print(f"Response Body: {response.body}")
        print(f"Response Headers: {response.headers}")
    except Exception as e:
        print(f"ERROR: {str(e)}")

if __name__ == "__main__":
    test_sendgrid()
