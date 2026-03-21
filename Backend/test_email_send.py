#!/usr/bin/env python3
"""
Test Email Sending Script
Use this to manually test email sending without registration flow
"""

import os
import sys
from dotenv import load_dotenv

# Add Backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

load_dotenv()

from email_service import send_email

print("=" * 70)
print("TEST EMAIL SENDING")
print("=" * 70)

# Check if API key is configured
SENDGRID_API_KEY = os.environ.get("SENDGRID_API_KEY")

if not SENDGRID_API_KEY or SENDGRID_API_KEY == "SG.test-key-placeholder":
    print("\nX ERROR: SENDGRID_API_KEY not configured!")
    print("\nFIX:")
    print("  1. Edit Backend/.env")
    print("  2. Find: SENDGRID_API_KEY=\"SG.test-key-placeholder\"")
    print("  3. Replace with your actual SendGrid API key")
    print("  4. Get API key from: https://app.sendgrid.com/settings/api_keys")
    sys.exit(1)

# Get test email from user
print("\nWARNING: This will send a real email!")
test_email = input("\nEnter test email address: ").strip()

if not test_email or "@" not in test_email:
    print("X Invalid email address")
    sys.exit(1)

print(f"\nSending test email to: {test_email}")

# Create test email
html_content = """
<html>
    <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #2ecc71;">Test Email Success!</h2>
        <p>Hello,</p>
        <p>If you're reading this, SendGrid email sending is working!</p>
        <div style="background-color: #f0f0f0; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <p><strong>Test Details:</strong></p>
            <p>[OK] API key is valid</p>
            <p>[OK] Sender email is verified</p>
            <p>[OK] SendGrid is responding</p>
        </div>
        <p>You can now proceed with the full email verification setup!</p>
        <p>
            Go to http://localhost:8000/register and create a test account.
        </p>
    </body>
</html>
"""

# Send test email
success = send_email(
    to_email=test_email,
    subject="ConEco - Test Email",
    html_content=html_content
)

if success:
    print(f"\nSUCCESS! Test email sent to {test_email}")
    print("\nNext steps:")
    print("  1. Check your email inbox (and spam folder)")
    print("  2. If you received it, SendGrid is working!")
    print("  3. Go to http://localhost:8000/register")
    print("  4. Create a test account to verify full flow")
else:
    print(f"\nFAILED! Could not send email to {test_email}")
    print("\nTroubleshooting:")
    print("  1. Check Backend/.env for SENDGRID_API_KEY")
    print("  2. Verify API key format: SG.xxxxxxxxxxxxx")
    print("  3. Verify sender in SendGrid dashboard")
    print("  4. Check Backend logs for error messages")

print("\n" + "=" * 70)
