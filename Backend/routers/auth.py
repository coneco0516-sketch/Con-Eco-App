from fastapi import APIRouter, HTTPException, Response, Request, BackgroundTasks
from pydantic import BaseModel
import jwt
import bcrypt
import os
import secrets
from datetime import datetime, timedelta
from typing import Optional
from database import get_db_connection
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from email_service import (
    send_login_notification,
    send_email_verification,
    send_profile_update_notification,
    get_notification_preferences,
    send_password_reset_email,
    send_password_change_notification
)

load_dotenv = lambda: None # Mock
SECRET_KEY = os.environ.get("JWT_SECRET", "coneco_super_secret_internship_key")
ALGORITHM = "HS256"
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID")

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))

router = APIRouter()

from database import get_db_connection, get_platform_setting

def create_access_token(data: dict, expires_delta: timedelta = timedelta(hours=24)):
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user_from_cookie(request: Request):
    token = request.cookies.get("session_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="not_logged_in")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except:
        raise HTTPException(status_code=401, detail="invalid_token")

class LoginRequest(BaseModel):
    email: str
    password: str

class GoogleAuthRequest(BaseModel):
    credential: str
    role: Optional[str] = "Customer"

@router.post("/google")
def google_auth(request: GoogleAuthRequest, response: Response):
    token = request.credential
    # Normalize role to CamelCase (e.g., 'vendor' -> 'Vendor')
    role_requested = request.role
    if role_requested:
        role_requested = role_requested.capitalize()
    else:
        role_requested = "Customer"

    if not GOOGLE_CLIENT_ID:
        print("CRITICAL: GOOGLE_CLIENT_ID is not set in environment variables!")
        raise HTTPException(status_code=500, detail="Backend configuration error: Missing Google Client ID")

    try:
        # 1. Verify the Google ID Token
        try:
            idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), GOOGLE_CLIENT_ID)
        except Exception as e:
            print(f"GOOGLE_AUTH_ERROR: Token verification failed: {e}")
            raise HTTPException(status_code=401, detail=f"Google token verification failed: {str(e)}")
            
        # ID token is valid. Get user's Google info.
        email = idinfo['email']
        name = idinfo.get('name', 'Google User')
        
        try:
            conn = get_db_connection()
        except Exception as e:
            print(f"GOOGLE_AUTH_ERROR: DB Connection failed: {e}")
            raise HTTPException(status_code=500, detail=f"Database connection failed: {str(e)}")

        try:
            cursor = conn.cursor(dictionary=True)
            
            # 2. Check if user already exists
            cursor.execute("SELECT user_id, role FROM users WHERE email=%s", (email,))
            user = cursor.fetchone()
            
            if not user:
                # 3. Create new user if they don't exist
                print(f"GOOGLE_AUTH: Creating new user {email} with role {role_requested}")
                cursor.execute(
                    "INSERT INTO users (name, email, role, email_verified) VALUES (%s, %s, %s, TRUE) RETURNING user_id",
                    (name, email, role_requested)
                )
                res = cursor.fetchone()
                user_id = res['user_id']
                
                # Add to role-specific tables (customers or vendors)
                if role_requested == 'Vendor':
                    # Fix: Provide a placeholder company name to satisfy the NOT NULL constraint
                    cursor.execute(
                        "INSERT INTO vendors (vendor_id, company_name) VALUES (%s, %s)", 
                        (user_id, f"{name}'s Business")
                    )
                else:
                    cursor.execute("INSERT INTO customers (customer_id) VALUES (%s)", (user_id,))
                
                conn.commit()
                user = {"user_id": user_id, "role": role_requested}
            
            # 4. Create session token
            access_token = create_access_token({"user_id": user['user_id'], "role": user['role']})
            response.set_cookie(
                key="session_token", 
                value=access_token, 
                httponly=True, 
                samesite="None", 
                secure=True
            )
            
            return {"status": "success", "role": user['role']}
        except Exception as e:
            print(f"GOOGLE_AUTH_ERROR: DB Query failed: {e}")
            if conn: conn.rollback()
            raise HTTPException(status_code=500, detail=f"Database query failed: {str(e)}")
        finally:
            if conn: conn.close()
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"GOOGLE_AUTH_ERROR: Unexpected error: {e}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@router.post("/login")
def login(request: LoginRequest, response: Response, http_request: Request, background_tasks: BackgroundTasks):
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE email=%s OR phone=%s", (request.email, request.email))
        user = cursor.fetchone()
        
        if not user or not verify_password(request.password, user['password_hash']):
            return {"status": "error", "message": "Invalid credentials"}
            
        # Check email verification before allowing login
        if user.get('email_verified') is False:
            return {"status": "error", "message": "Please verify your email before logging in. Check your inbox.", "requires_verification": True}
            
        token = create_access_token({"user_id": user['user_id'], "role": user['role']})
        # Use SameSite=None and Secure=True for cross-domain support on Render
        response.set_cookie(
            key="session_token", 
            value=token, 
            httponly=True, 
            samesite="None", 
            secure=True
        )
        
        # Record activity
        ip = http_request.client.host if http_request.client else "unknown"
        ua = http_request.headers.get("user-agent", "")
        cursor.execute("INSERT INTO login_activity (user_id, email, user_type, ip_address, user_agent) VALUES (%s, %s, %s, %s, %s)",
                       (user['user_id'], user['email'], user['role'], ip, ua))
        conn.commit()
        
        # Dispatch login notification email
        try:
            prefs = get_notification_preferences(user['user_id'])
            if prefs.get('login_alerts', True):
                background_tasks.add_task(send_login_notification, user['email'], user['role'], user['name'], ip, ua)
        except Exception as e:
            print(f"Error queuing login notification: {e}")
        
        return {"status": "success", "role": user['role']}
    finally:
        conn.close()

class RegisterRequest(BaseModel):
    full_name: str
    email: str
    phone_number: str
    password: str
    role: str
    city: Optional[str] = None
    state: Optional[str] = None
    company_name: Optional[str] = None
    gst_number: Optional[str] = None
    address: Optional[str] = None

@router.post("/register")
def register(request: RegisterRequest, background_tasks: BackgroundTasks):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT user_id FROM users WHERE email=%s", (request.email,))
        if cursor.fetchone():
            return {"status": "error", "message": "Email already exists"}
            
        hashed_pass = hash_password(request.password)
        token = secrets.token_hex(20)
        cursor.execute("INSERT INTO users (name, email, phone, password_hash, role, email_verified, email_verification_token, email_verification_sent_at) VALUES (%s, %s, %s, %s, %s, FALSE, %s, NOW()) RETURNING user_id",
                       (request.full_name, request.email, request.phone_number, hashed_pass, request.role, token))
        res = cursor.fetchone()
        user_id = res['user_id'] if isinstance(res, dict) else res[0]
        
        # Dispatch the verification email in background
        background_tasks.add_task(send_email_verification, request.email, request.full_name, token)
        
        if request.role == 'Customer':
            cursor.execute("INSERT INTO customers (customer_id, city, state) VALUES (%s, %s, %s)",
                           (user_id, request.city, request.state))
        elif request.role == 'Vendor':
            cursor.execute("INSERT INTO vendors (vendor_id, company_name, gst_number, address, city, state) VALUES (%s, %s, %s, %s, %s, %s)",
                           (user_id, request.company_name, request.gst_number, request.address, request.city, request.state))
        
        conn.commit()
        return {"status": "success", "message": "Registration successful"}
    finally:
        conn.close()

class ResendVerificationRequest(BaseModel):
    email: str

@router.post("/resend-verification")
def resend_verification(request: ResendVerificationRequest, background_tasks: BackgroundTasks):
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT user_id, name, email_verified, email_verification_token FROM users WHERE email=%s", (request.email,))
        user = cursor.fetchone()
        
        if not user:
            return {"status": "error", "message": "Email not found"}
        if user.get('email_verified'):
            return {"status": "error", "message": "Email is already verified"}
            
        token = user.get('email_verification_token')
        if not token:
            token = secrets.token_hex(20)
            cursor.execute("UPDATE users SET email_verification_token=%s, email_verification_sent_at=NOW() WHERE user_id=%s", (token, user['user_id']))
            conn.commit()
            
        background_tasks.add_task(send_email_verification, request.email, user['name'], token)
        return {"status": "success", "message": "Verification email sent"}
    finally:
        conn.close()

@router.get("/verify-email")
def verify_email(token: str):
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT user_id FROM users WHERE email_verification_token=%s AND email_verified=FALSE", (token,))
        user = cursor.fetchone()
        
        if not user:
            return {"status": "error", "message": "Invalid or expired verification token."}
            
        cursor.execute("UPDATE users SET email_verified=TRUE, email_verification_token=NULL WHERE user_id=%s", (user['user_id'],))
        conn.commit()
        
        return {"status": "success", "message": "Email successfully verified!"}
    finally:
        conn.close()

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

@router.post("/forgot-password")
def forgot_password(request: ForgotPasswordRequest, background_tasks: BackgroundTasks):
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT user_id, email FROM users WHERE email=%s", (request.email,))
        user = cursor.fetchone()
        
        if user:
            token = secrets.token_hex(20)
            cursor.execute("UPDATE users SET reset_password_token=%s, reset_password_expires_at=NOW() + INTERVAL '1 hour' WHERE user_id=%s", (token, user['user_id']))
            conn.commit()
            background_tasks.add_task(send_password_reset_email, user['email'], token)
            
        # We return success even if user doesn't exist to prevent email enumeration
        return {"status": "success", "message": "If the account exists, a reset link has been sent."}
    finally:
        conn.close()

@router.post("/reset-password")
def reset_password(request: ResetPasswordRequest, background_tasks: BackgroundTasks):
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT user_id, email, name, role FROM users WHERE reset_password_token=%s AND reset_password_expires_at > NOW()", (request.token,))
        user = cursor.fetchone()
        
        if not user:
            return {"status": "error", "message": "Invalid or expired password reset token."}
            
        hashed_pass = hash_password(request.new_password)
        cursor.execute("UPDATE users SET password_hash=%s, reset_password_token=NULL, reset_password_expires_at=NULL WHERE user_id=%s", (hashed_pass, user['user_id']))
        conn.commit()
        
        background_tasks.add_task(send_password_change_notification, user['email'], user['name'], user['role'])
        
        return {"status": "success", "message": "Password has been successfully reset."}
    finally:
        conn.close()

@router.get("/profile")
def get_profile(request: Request):
    user_info = get_current_user_from_cookie(request)
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT user_id, name, email, phone, role FROM users WHERE user_id=%s", (user_info['user_id'],))
        user = cursor.fetchone()
        if not user: raise HTTPException(status_code=404)
        
        if user['role'] == 'Customer':
            cursor.execute("SELECT city, state FROM customers WHERE customer_id=%s", (user['user_id'],))
            user.update(cursor.fetchone() or {})
        elif user['role'] == 'Vendor':
            cursor.execute("SELECT company_name, gst_number, address, city, state, verification_status, qc_score FROM vendors WHERE vendor_id=%s", (user['user_id'],))
            user.update(cursor.fetchone() or {})
            
        return {"status": "success", "profile": user}
    finally:
        conn.close()

@router.put("/profile")
def update_profile(request: Request, data: dict):
    user_info = get_current_user_from_cookie(request)
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        # Update core user info
        cursor.execute("UPDATE users SET name=%s, phone=%s WHERE user_id=%s", 
                       (data.get('name'), data.get('phone'), user_info['user_id']))
        
        # Update role-specific info
        if user_info['role'] == 'Customer':
            cursor.execute("UPDATE customers SET city=%s, state=%s WHERE customer_id=%s",
                           (data.get('city'), data.get('state'), user_info['user_id']))
        elif user_info['role'] == 'Vendor':
            cursor.execute("UPDATE vendors SET company_name=%s, gst_number=%s, address=%s, city=%s, state=%s WHERE vendor_id=%s",
                           (data.get('company_name'), data.get('gst_number'), data.get('address'), data.get('city'), data.get('state'), user_info['user_id']))
        
        conn.commit()
        return {"status": "success", "message": "Profile updated successfully"}
    finally:
        conn.close()

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("session_token")
    return {"status": "success"}

@router.get("/maintenance-mode")
def get_maintenance_mode():
    is_maintenance = get_platform_setting("server_maintenance_mode", False)
    return {"status": "success", "maintenance_active": is_maintenance}

@router.get("/commission-rates")
def get_commission_rates():
    product_rate = get_platform_setting("product_commission_pct", 3.0)
    service_rate = get_platform_setting("service_commission_pct", 3.0)
    return {
        "status": "success", 
        "product_commission_pct": product_rate,
        "service_commission_pct": service_rate
    }

@router.post("/subscribe-push")
def subscribe_push(request: Request):
    # Mock implementation for now to prevent 404s
    return {"status": "success", "message": "Subscribed"}
