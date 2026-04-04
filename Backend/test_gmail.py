#!/usr/bin/env python3
"""
Gmail SMTP Test Script
Use this to verify your Gmail (Google App Password) configuration.
"""

import os
import sys
from dotenv import load_dotenv

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

load_dotenv()

try:
    from email_service import send_email, GMAIL_SMTP_USER, GMAIL_APP_PASSWORD, FROM_EMAIL
except ImportError as e:
    print(f"Error importing email_service: {e}")
    sys.exit(1)

def test_gmail():
    print("=" * 70)
    print("GMAIL SMTP CONFIGURATION TEST")
    print("=" * 70)
    
    # Check configuration
    print(f"\n1. Checking Configuration:")
    if not GMAIL_APP_PASSWORD:
        print("   X ERROR: GMAIL_APP_PASSWORD is not set in .env")
        return
    else:
        print(f"   ✓ SMTP User: {GMAIL_SMTP_USER}")
        print(f"   ✓ App Password: {'*' * (len(GMAIL_APP_PASSWORD)-4) + GMAIL_APP_PASSWORD[-4:]}")
        
    print(f"   ✓ Default Sender: {FROM_EMAIL}")
    
    # Get test recipient
    print("\n2. Sending Test Email:")
    recipient = input("   Enter recipient email address: ").strip()
    
    if not recipient or "@" not in recipient:
        print("   X Error: Invalid email address.")
        return
        
    subject = "ConEco - Gmail SMTP Test"
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6;">
            <h2 style="color: #2ecc71;">Gmail Integration Successful!</h2>
            <p>Hello,</p>
            <p>This is a test email sent from the <strong>ConEco</strong> backend using <strong>Gmail SMTP</strong>.</p>
            <div style="background-color: #f8f9fa; border-left: 4px solid #2ecc71; padding: 15px; margin: 20px 0;">
                <p><strong>Config Details:</strong></p>
                <ul>
                    <li><strong>Service:</strong> Gmail SMTP (smtp.gmail.com:587)</li>
                    <li><strong>User:</strong> {GMAIL_SMTP_USER}</li>
                    <li><strong>Sender:</strong> {FROM_EMAIL}</li>
                </ul>
            </div>
            <p>If you received this, your Gmail integration is working perfectly.</p>
            <p>Best regards,<br>ConEco Team</p>
        </body>
    </html>
    """
    
    print(f"\n   Attempting to send via Gmail SMTP to {recipient}...")
    success = send_email(recipient, subject, html_content)
    
    if success:
        print(f"\n[SUCCESS] Test email sent successfully!")
        print("Please check the inbox of the recipient.")
    else:
        print(f"\n[FAILED] Could not send email.")
        print("\nTroubleshooting Tips:")
        print("1. Ensure 'Less secure app access' is replaced by 'App Passwords'.")
        print("2. Generate an App Password: https://myaccount.google.com/apppasswords")
        print("3. Ensure your Google account has 2-Step Verification enabled.")
        print("4. Check your internet connection and firewall settings for port 587.")

if __name__ == "__main__":
    test_gmail()
    print("\n" + "=" * 70)
