from fastapi import APIRouter, HTTPException, Response, Request, BackgroundTasks
from pydantic import BaseModel
import jwt
import bcrypt
import os
import secrets
from datetime import datetime, timedelta
from typing import Optional
from database import get_db_connection

from email_service import (
    send_login_notification,
    send_email_verification,
    send_profile_update_notification,
    get_notification_preferences
)

load_dotenv = lambda: None # Mock
SECRET_KEY = os.environ.get("JWT_SECRET", "coneco_super_secret_internship_key")
ALGORITHM = "HS256"

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))

router = APIRouter()

def get_platform_setting(key, default):
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT setting_value FROM platformsettings WHERE setting_key = %s", (key,))
        row = cursor.fetchone()
        if row:
            val = row['setting_value']
            if str(val).lower() == 'true': return True
            if str(val).lower() == 'false': return False
            try: return float(val) if '.' in str(val) else int(val)
            except: return val
        return default
    except: return default
    finally: conn.close()

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

@router.post("/login")
def login(request: LoginRequest, response: Response, http_request: Request, background_tasks: BackgroundTasks):
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE email=%s OR phone=%s", (request.email, request.email))
        user = cursor.fetchone()
        
        if not user or not verify_password(request.password, user['password_hash']):
            return {"status": "error", "message": "Invalid credentials"}
            
        token = create_access_token({"user_id": user['user_id'], "role": user['role']})
        response.set_cookie(key="session_token", value=token, httponly=True, samesite="Lax")
        
        # Record activity
        ip = http_request.client.host if http_request.client else "unknown"
        ua = http_request.headers.get("user-agent", "")
        cursor.execute("INSERT INTO login_activity (user_id, email, user_type, ip_address, user_agent) VALUES (%s, %s, %s, %s, %s)",
                       (user['user_id'], user['email'], user['role'], ip, ua))
        conn.commit()
        
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
def register(request: RegisterRequest):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT user_id FROM users WHERE email=%s", (request.email,))
        if cursor.fetchone():
            return {"status": "error", "message": "Email already exists"}
            
        hashed_pass = hash_password(request.password)
        cursor.execute("INSERT INTO users (name, email, phone, password_hash, role) VALUES (%s, %s, %s, %s, %s) RETURNING user_id",
                       (request.full_name, request.email, request.phone_number, hashed_pass, request.role))
        user_id = cursor.fetchone()[0]
        
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
            cursor.execute("SELECT company_name, gst_number, address, city, state FROM vendors WHERE vendor_id=%s", (user['user_id'],))
            user.update(cursor.fetchone() or {})
            
        return {"status": "success", "profile": user}
    finally:
        conn.close()

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("session_token")
    return {"status": "success"}
