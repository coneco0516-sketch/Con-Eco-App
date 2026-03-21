from fastapi import APIRouter, HTTPException, Response, Request
from pydantic import BaseModel
import jwt
from datetime import datetime, timedelta
from typing import Optional
from database import get_db_connection
import bcrypt

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
def login(request: LoginRequest, response: Response):
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
            cursor.execute("INSERT INTO Users (name, email, phone, password_hash, role) VALUES (%s, %s, %s, %s, %s)", 
                           (request.full_name, request.email, request.phone_number, hashed_password, request.role))
            user_id = cursor.lastrowid
            
            if request.role == 'Customer':
                cursor.execute("INSERT INTO Customers (customer_id, city, state) VALUES (%s, %s, %s)", 
                               (user_id, request.city, request.state))
            elif request.role == 'Vendor':
                cursor.execute("INSERT INTO Vendors (vendor_id, company_name, gst_number, address, city, state) VALUES (%s, %s, %s, %s, %s, %s)", 
                               (user_id, request.company_name or request.full_name, request.gst_number, request.address, request.city, request.state))
                
            conn.commit()
            cursor.close()
            return {"status": "success"}
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
        cursor = conn.cursor()
        
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
