from fastapi import APIRouter, HTTPException, Response, Request
from pydantic import BaseModel
import jwt
from datetime import datetime, timedelta
from typing import Optional
from database import get_db_connection
import bcrypt
import secrets
from email_service import (
    send_login_notification,
    send_email_verification,
    send_profile_update_notification,
    save_notification_preference,
    get_notification_preferences
)

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))

router = APIRouter()

import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.environ.get("JWT_SECRET", "coneco_super_secret_internship_key")
ALGORITHM = "HS256"

def create_access_token(data: dict, expires_delta: timedelta = timedelta(hours=24)):
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user_from_cookie(request: Request):
    # First try cookie (for same-origin or future production use)
    token = request.cookies.get("session_token")
    print(f"DEBUG: session_token cookie received: {'Yes' if token else 'No'}")
    
    # Fallback: try Authorization: Bearer header (for cross-origin dev where cookies are blocked)
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
            print(f"DEBUG: Using Bearer token from Authorization header")
    
    if not token:
        raise HTTPException(status_code=401, detail="not_logged_in")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        role = payload.get("role")
        if user_id is None:
            raise HTTPException(status_code=401, detail="invalid_token")
        return {"user_id": user_id, "role": role}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="token_expired")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="invalid_token")

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/login")
def login(request: LoginRequest, response: Response, http_request: Request):
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        query = "SELECT * FROM Users WHERE email=%s OR phone=%s"
        cursor.execute(query, (request.email, request.email))
        user = cursor.fetchone()
        cursor.close()
        
        # Verify the raw login password string against the stored bcrypt hash:
        if not user or not verify_password(request.password, user['password_hash']):
            return {"status": "error", "message": "Invalid credentials or User not found."}
            
        token = create_access_token({"user_id": user['user_id'], "role": user['role']})
        response.set_cookie(key="session_token", value=token, httponly=True, samesite="Lax")
        
        # Record login activity
        cursor = conn.cursor()
        ip_address = http_request.client.host if http_request.client else "unknown"
        user_agent = http_request.headers.get("user-agent", "")
        
        try:
            cursor.execute("""
                INSERT INTO login_activity (user_id, email, user_type, ip_address, user_agent, device_info)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (user['user_id'], user['email'], user['role'], ip_address, user_agent, "Web"))
            conn.commit()
        except Exception as e:
            print(f"Error recording login activity: {str(e)}")
        
        # Send login notification email if preferences allow
        try:
            prefs = get_notification_preferences(user['user_id'])
            if prefs.get('login_alerts', True):
                send_login_notification(
                    user['email'],
                    user['role'].lower(),
                    user['name'],
                    ip_address=ip_address,
                    browser_info=user_agent[:100] if user_agent else None
                )
        except Exception as e:
            print(f"Error sending login notification: {str(e)}")
        
        cursor.close()
        
        # The token is securely sent via the HttpOnly cookie. We do not expose it to JavaScript.
        return {"status": "success", "role": user['role']}
    finally:
        conn.close()

class RegisterRequest(BaseModel):
    full_name: str
    email: str
    phone_number: str
    password: str
    role: str
    company_name: Optional[str] = None
    gst_number: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None

@router.post("/register")
def register(request: RegisterRequest):
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT user_id FROM Users WHERE email=%s", (request.email,))
        if cursor.fetchone():
            cursor.close()
            return {"status": "error", "message": "Email already exists"}
            
        # The database columns are name, email, phone, password_hash, role
        try:
            # Securely hash the password before saving it to the database:
            hashed_password = hash_password(request.password)
            verification_token = secrets.token_urlsafe(32)
            
            cursor.execute("""INSERT INTO Users (name, email, phone, password_hash, role, email_verification_token, email_verification_sent_at, email_verified) 
                           VALUES (%s, %s, %s, %s, %s, %s, NOW(), FALSE)""", 
                           (request.full_name, request.email, request.phone_number, hashed_password, request.role, verification_token))
            user_id = cursor.lastrowid
            
            if request.role == 'Customer':
                cursor.execute("INSERT INTO Customers (customer_id, city, state) VALUES (%s, %s, %s)", 
                               (user_id, request.city, request.state))
            elif request.role == 'Vendor':
                cursor.execute("INSERT INTO Vendors (vendor_id, company_name, gst_number, address, city, state) VALUES (%s, %s, %s, %s, %s, %s)", 
                               (user_id, request.company_name or request.full_name, request.gst_number, request.address, request.city, request.state))
            
            # Initialize notification preferences
            cursor.execute("""
                INSERT INTO notification_preferences (user_id, user_type, login_alerts, password_change_alerts, 
                                                     profile_update_alerts, product_update_alerts, order_alerts, qc_status_alerts)
                VALUES (%s, %s, TRUE, TRUE, TRUE, TRUE, TRUE, %s)
            """, (user_id, request.role.lower(), request.role.lower() == 'vendor'))
                
            conn.commit()
            
            # Send email verification
            try:
                send_email_verification(request.email, request.full_name, verification_token)
            except Exception as e:
                print(f"Error sending verification email: {str(e)}")
            
            cursor.close()
            return {"status": "success", "message": "Registration successful. Please check your email to verify your account."}
        except Exception as db_err:
            print(f"DATABASE REGISTRATION ERROR: {db_err}")
            conn.rollback()
            return {"status": "error", "message": str(db_err)}
    finally:
        conn.close()

@router.get("/profile")
def get_profile(request: Request):
    user_info = get_current_user_from_cookie(request)
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        # Fetch base user info
        cursor.execute("SELECT user_id, name, email, phone, role FROM Users WHERE user_id=%s", (user_info['user_id'],))
        user = cursor.fetchone()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        # Fetch role-specific info
        if user['role'] == 'Customer':
            cursor.execute("SELECT city, state, verification_status FROM Customers WHERE customer_id=%s", (user['user_id'],))
            extra = cursor.fetchone()
            if extra: user.update(extra)
        elif user['role'] == 'Vendor':
            cursor.execute("SELECT company_name, gst_number, address, city, state, verification_status, qc_score FROM Vendors WHERE vendor_id=%s", (user['user_id'],))
            extra = cursor.fetchone()
            if extra: user.update(extra)
            
        return {"status": "success", "profile": user}
    finally:
        conn.close()

class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    company_name: Optional[str] = None
    gst_number: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None

@router.put("/profile")
def update_profile(request: Request, data: UpdateProfileRequest):
    user_info = get_current_user_from_cookie(request)
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        
        # Get current user email
        cursor.execute("SELECT email, name FROM Users WHERE user_id = %s", (user_info['user_id'],))
        user = cursor.fetchone()
        
        # Update Users table
        if data.name or data.phone:
            updates = []
            params = []
            if data.name:
                updates.append("name=%s")
                params.append(data.name)
            if data.phone:
                updates.append("phone=%s")
                params.append(data.phone)
            params.append(user_info['user_id'])
            cursor.execute(f"UPDATE Users SET {', '.join(updates)} WHERE user_id=%s", tuple(params))
            
        # Update Customer/Vendor tables
        if user_info['role'] == 'Customer':
            if data.city or data.state:
                updates = []
                params = []
                if data.city:
                    updates.append("city=%s")
                    params.append(data.city)
                if data.state:
                    updates.append("state=%s")
                    params.append(data.state)
                params.append(user_info['user_id'])
                cursor.execute(f"UPDATE Customers SET {', '.join(updates)} WHERE customer_id=%s", tuple(params))
        elif user_info['role'] == 'Vendor':
            if data.company_name or data.gst_number or data.address or data.city or data.state:
                updates = []
                params = []
                if data.company_name: updates.append("company_name=%s"); params.append(data.company_name)
                if data.gst_number: updates.append("gst_number=%s"); params.append(data.gst_number)
                if data.address: updates.append("address=%s"); params.append(data.address)
                if data.city: updates.append("city=%s"); params.append(data.city)
                if data.state: updates.append("state=%s"); params.append(data.state)
                params.append(user_info['user_id'])
                cursor.execute(f"UPDATE Vendors SET {', '.join(updates)} WHERE vendor_id=%s", tuple(params))
                
        conn.commit()
        
        # Send profile update notification
        try:
            prefs = get_notification_preferences(user_info['user_id'])
            if prefs.get('profile_update_alerts', True) and user:
                updates_dict = {}
                if data.name: updates_dict['Name'] = data.name
                if data.phone: updates_dict['Phone'] = data.phone
                if data.city: updates_dict['City'] = data.city
                if data.state: updates_dict['State'] = data.state
                if data.company_name: updates_dict['Company Name'] = data.company_name
                
                if updates_dict:
                    send_profile_update_notification(
                        user['email'],
                        user['name'],
                        user_info['role'].lower(),
                        updates_dict
                    )
        except Exception as e:
            print(f"Error sending profile update notification: {str(e)}")
        
        return {"status": "success", "message": "Profile updated successfully"}
    except Exception as e:
        conn.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        conn.close()

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("session_token")
    return {"status": "success"}


# ==================== Email Verification Endpoints ====================

@router.get("/verify-email")
def verify_email(token: str):
    """Verify user email with token"""
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT user_id, name, email FROM Users WHERE email_verification_token = %s
        """, (token,))
        
        user = cursor.fetchone()
        if not user:
            return {"status": "error", "message": "Invalid verification token"}
        
        # Check if token is still valid (24 hours)
        cursor.execute("""
            SELECT email_verification_sent_at FROM Users WHERE user_id = %s
        """, (user['user_id'],))
        
        result = cursor.fetchone()
        if result:
            sent_at = result['email_verification_sent_at']
            if sent_at and (datetime.utcnow() - sent_at).total_seconds() > 86400:
                return {"status": "error", "message": "Verification token has expired"}
        
        # Mark email as verified
        cursor.execute("""
            UPDATE Users SET email_verified = TRUE, email_verification_token = NULL 
            WHERE user_id = %s
        """, (user['user_id'],))
        
        conn.commit()
        cursor.close()
        
        return {"status": "success", "message": "Email verified successfully. You can now login."}
    finally:
        conn.close()


@router.post("/resend-verification")
def resend_verification(request: Request):
    """Resend email verification token"""
    user_info = get_current_user_from_cookie(request)
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT user_id, name, email, email_verified FROM Users WHERE user_id = %s
        """, (user_info['user_id'],))
        
        user = cursor.fetchone()
        if not user:
            return {"status": "error", "message": "User not found"}
        
        if user['email_verified']:
            return {"status": "success", "message": "Email is already verified"}
        
        # Generate new token
        verification_token = secrets.token_urlsafe(32)
        cursor.execute("""
            UPDATE Users SET email_verification_token = %s, email_verification_sent_at = NOW() 
            WHERE user_id = %s
        """, (verification_token, user_info['user_id']))
        
        conn.commit()
        cursor.close()
        
        # Send verification email
        try:
            send_email_verification(user['email'], user['name'], verification_token)
            return {"status": "success", "message": "Verification email sent. Please check your email."}
        except Exception as e:
            print(f"Error sending verification email: {str(e)}")
            return {"status": "error", "message": "Failed to send verification email"}
    finally:
        conn.close()


# ==================== Notification Preferences Endpoints ====================

class NotificationPreferencesUpdate(BaseModel):
    login_alerts: Optional[bool] = None
    password_change_alerts: Optional[bool] = None
    profile_update_alerts: Optional[bool] = None
    product_update_alerts: Optional[bool] = None
    order_alerts: Optional[bool] = None
    qc_status_alerts: Optional[bool] = None


@router.get("/notification-preferences")
def get_preferences(request: Request):
    """Get user notification preferences"""
    user_info = get_current_user_from_cookie(request)
    
    try:
        prefs = get_notification_preferences(user_info['user_id'])
        return {"status": "success", "preferences": prefs}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.put("/notification-preferences")
def update_preferences(request: Request, data: NotificationPreferencesUpdate):
    """Update user notification preferences"""
    user_info = get_current_user_from_cookie(request)
    conn = get_db_connection()
    
    try:
        cursor = conn.cursor(dictionary=True)
        
        # Get current user info for user_type
        cursor.execute("SELECT role FROM Users WHERE user_id = %s", (user_info['user_id'],))
        user = cursor.fetchone()
        
        if not user:
            return {"status": "error", "message": "User not found"}
        
        # Build update query
        updates = []
        params = []
        
        if data.login_alerts is not None:
            updates.append("login_alerts = %s")
            params.append(data.login_alerts)
        if data.password_change_alerts is not None:
            updates.append("password_change_alerts = %s")
            params.append(data.password_change_alerts)
        if data.profile_update_alerts is not None:
            updates.append("profile_update_alerts = %s")
            params.append(data.profile_update_alerts)
        if data.product_update_alerts is not None:
            updates.append("product_update_alerts = %s")
            params.append(data.product_update_alerts)
        if data.order_alerts is not None:
            updates.append("order_alerts = %s")
            params.append(data.order_alerts)
        if data.qc_status_alerts is not None:
            updates.append("qc_status_alerts = %s")
            params.append(data.qc_status_alerts)
        
        if updates:
            params.append(user_info['user_id'])
            query = f"UPDATE notification_preferences SET {', '.join(updates)} WHERE user_id = %s"
            cursor.execute(query, tuple(params))
            conn.commit()
        
        cursor.close()
        return {"status": "success", "message": "Notification preferences updated"}
    except Exception as e:
        conn.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        conn.close()


@router.get("/login-activity")
def get_login_activity(request: Request):
    """Get user's recent login activity"""
    user_info = get_current_user_from_cookie(request)
    conn = get_db_connection()
    
    try:
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT id, email, user_type, ip_address, user_agent, device_info, login_at
            FROM login_activity
            WHERE user_id = %s
            ORDER BY login_at DESC
            LIMIT 20
        """, (user_info['user_id'],))
        
        activities = cursor.fetchall()
        cursor.close()
        
        return {"status": "success", "activities": activities}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        conn.close()
