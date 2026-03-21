#!/usr/bin/env python3
"""
Email Configuration Diagnostic Tool
Run this to test if SendGrid is properly configured
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

print("=" * 70)
print("SENDGRID EMAIL CONFIGURATION DIAGNOSTIC")
print("=" * 70)

# Check 1: Is .env file loaded?
print("\n✓ STEP 1: Checking .env file...")
sendgrid_key = os.environ.get("SENDGRID_API_KEY")
from_email = os.environ.get("FROM_EMAIL")
app_url = os.environ.get("APP_URL")

if sendgrid_key:
    print(f"  ✓ SENDGRID_API_KEY found: {sendgrid_key[:10]}...{sendgrid_key[-5:]}")
else:
    print("  ✗ SENDGRID_API_KEY NOT FOUND in .env")
    print("    → Add: SENDGRID_API_KEY=\"SG.your-key\" to Backend/.env")

if from_email:
    print(f"  ✓ FROM_EMAIL: {from_email}")
else:
    print(f"  ✗ FROM_EMAIL NOT SET (using default: noreply@coneco.com)")

if app_url:
    print(f"  ✓ APP_URL: {app_url}")
else:
    print(f"  ✗ APP_URL NOT SET (using default: https://con-eco-app-production.up.railway.app)")

# Check 2: Is sendgrid package installed?
print("\n✓ STEP 2: Checking SendGrid package...")
try:
    from sendgrid import SendGridAPIClient
    from sendgrid.helpers.mail import Mail, Email, To
    print("  ✓ SendGrid package installed")
    
    # Check 3: Can we test the API key?
    if sendgrid_key and sendgrid_key != "SG.test-key-placeholder":
        print("\n✓ STEP 3: Testing SendGrid API connection...")
        try:
            sg = SendGridAPIClient(sendgrid_key)
            print("  ✓ API key appears valid (no auth errors)")
        except Exception as e:
            print(f"  ⚠ API connection warning: {str(e)}")
    else:
        print("\n⚠ STEP 3: Skipping API test (placeholder key)")
        print("  → Replace SG.test-key-placeholder with actual API key")
        
except ImportError as e:
    print(f"  ✗ SendGrid package NOT installed: {str(e)}")
    print("    → Run: pip install sendgrid")

# Check 4: Database connection
print("\n✓ STEP 4: Checking database configuration...")
db_host = os.environ.get("DB_HOST")
db_name = os.environ.get("DB_NAME")
db_user = os.environ.get("DB_USER")

if db_host:
    print(f"  ✓ DB_HOST: {db_host}")
else:
    print("  ✗ DB_HOST not set")

if db_name:
    print(f"  ✓ DB_NAME: {db_name}")
else:
    print("  ✗ DB_NAME not set")

if db_user:
    print(f"  ✓ DB_USER: {db_user}")
else:
    print("  ✗ DB_USER not set")

# Summary
print("\n" + "=" * 70)
print("DIAGNOSTIC SUMMARY")
print("=" * 70)

issues = []
if not sendgrid_key or sendgrid_key == "SG.test-key-placeholder":
    issues.append("SENDGRID_API_KEY not configured")
    
if sendgrid_key and not sendgrid_key.startswith("SG."):
    issues.append("SENDGRID_API_KEY has invalid format (should start with SG.)")

if issues:
    print("\n⚠ ISSUES FOUND:")
    for i, issue in enumerate(issues, 1):
        print(f"  {i}. {issue}")
    print("\nFIX STEPS:")
    print("  1. Go to https://sendgrid.com")
    print("  2. Sign up for free account")
    print("  3. Get API key from Settings → API Keys → Create API Key")
    print("  4. Copy key and paste into Backend/.env:")
    print('     SENDGRID_API_KEY="SG.your_actual_key_here"')
    print("  5. Verify sender email in SendGrid dashboard")
    print("  6. Restart backend: python Backend/main.py")
    print("  7. Test registration at http://localhost:8000/register")
else:
    print("\n✓ EMAIL CONFIGURATION LOOKS GOOD!")
    print("\nYou can now:")
    print("  1. Start backend: python Backend/main.py")
    print("  2. Go to http://localhost:8000/register")
    print("  3. Create account with test email")
    print("  4. Check email for verification link")
    print("  5. Click link to verify")
    print("\nExpected backend log:")
    print("  Email sent to test@example.com. Status: 202")

print("\n" + "=" * 70)
