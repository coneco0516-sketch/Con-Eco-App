#!/usr/bin/env python3
"""
Email Configuration Diagnostic Tool (Gmail SMTP Focus)
Run this to test if Gmail SMTP is properly configured
"""

import os
import sys
import smtplib
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

print("=" * 70)
print("GMAIL SMTP EMAIL CONFIGURATION DIAGNOSTIC")
print("=" * 70)

# Check 1: Is .env file loaded?
print("\n✓ STEP 1: Checking .env file configuration...")
gmail_user = os.environ.get("GMAIL_SMTP_USER", os.environ.get("FROM_EMAIL"))
gmail_pass = os.environ.get("GMAIL_APP_PASSWORD")
from_email = os.environ.get("FROM_EMAIL")
app_url = os.environ.get("APP_URL")

if gmail_user:
    print(f"  ✓ GMAIL_SMTP_USER found: {gmail_user}")
else:
    print("  ✗ GMAIL_SMTP_USER NOT FOUND in .env")

if gmail_pass:
    print(f"  ✓ GMAIL_APP_PASSWORD found: {'*' * (len(gmail_pass)-4) + gmail_pass[-4:]}")
else:
    print("  ✗ GMAIL_APP_PASSWORD NOT FOUND in .env")
    print("    → Add: GMAIL_APP_PASSWORD=\"your_app_password\" to Backend/.env")

if from_email:
    print(f"  ✓ FROM_EMAIL: {from_email}")
else:
    print("  ✗ FROM_EMAIL NOT SET")

if app_url:
    print(f"  ✓ APP_URL: {app_url}")
else:
    print("  ✗ APP_URL NOT SET")

# Check 2: Connection Test
print("\n✓ STEP 2: Testing SMTP Connection to smtp.gmail.com:587...")
try:
    with smtplib.SMTP("smtp.gmail.com", 587, timeout=10) as server:
        server.starttls()
        print("  ✓ Connection to Gmail SMTP server succeeded (TLS enabled)")
        
        if gmail_user and gmail_pass:
            try:
                server.login(gmail_user, gmail_pass)
                print("  ✓ SMTP Authentication successful!")
            except smtplib.SMTPAuthenticationError:
                print("  ✗ Authentication failed. Please verify your App Password.")
                print("    Note: If you have 2FA enabled, you MUST use an App Password.")
            except Exception as e:
                print(f"  ⚠ Login error: {str(e)}")
except Exception as e:
    print(f"  ✗ Connection failed: {str(e)}")

# Summary
print("\n" + "=" * 70)
print("DIAGNOSTIC SUMMARY")
print("=" * 70)

issues = []
if not gmail_user:
    issues.append("GMAIL_SMTP_USER not configured")
if not gmail_pass:
    issues.append("GMAIL_APP_PASSWORD not configured")
if gmail_pass and len(gmail_pass) < 16:
    issues.append("GMAIL_APP_PASSWORD seems too short (should be 16 characters for Google App Passwords)")

if issues:
    print("\n⚠ ISSUES FOUND:")
    for i, issue in enumerate(issues, 1):
        print(f"  {i}. {issue}")
    print("\nFIX STEPS:")
    print("  1. Enable 2-Step Verification on your Google Account.")
    print("  2. Go to https://myaccount.google.com/apppasswords")
    print("  3. Create a new App Password (select 'Other' and name it 'ConEco').")
    print("  4. Copy the 16-character code and paste into Backend/.env.")
    print("  5. Run Backend/test_gmail.py to confirm.")
else:
    print("\n✓ GMAIL CONFIGURATION LOOKS GOOD!")
    print("\nYou can now:")
    print("  1. Run Backend/test_gmail.py to send a real test email.")
    print("  2. Restart backend: python Backend/main.py")

print("\n" + "=" * 70)
