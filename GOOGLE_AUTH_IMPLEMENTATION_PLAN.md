# Google Authentication Implementation Plan

This document outlines the steps to integrate "Continue with Google" authentication into the ConEco platform.

## 1. Google Cloud Setup (Required)

You must obtain a **Google Client ID** to enable authentication:
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (e.g., "ConEco-Auth").
3. Navigate to **APIs & Services > Credentials**.
4. Click **Create Credentials > OAuth client ID**.
5. Select **Web application**.
6. Add your local and production URLs to **Authorized JavaScript origins**:
   - `http://localhost:5173` (Vite default)
   - `https://your-production-url.com`
7. Click **Create** and copy your **Client ID**.

---

## 2. Backend Implementation (Python/FastAPI)

### Dependencies
Add this to your `Backend/requirements.txt`:
```text
google-auth-library==2.22.0
```

### Configuration
Add your Client ID to `Backend/.env`:
```text
GOOGLE_CLIENT_ID=your_client_id_here
```

### Auth Router Update (`Backend/routers/auth.py`)
Add the following endpoint to handle Google tokens:

```python
from google.oauth2 import id_token
from google.auth.transport import requests

# ... existing imports ...

GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID")

@router.post("/google")
def google_auth(request: dict, response: Response):
    token = request.get("credential")
    role_requested = request.get("role", "Customer") # Default to Customer if not provided
    
    try:
        # 1. Verify the Google ID Token
        idinfo = id_token.verify_oauth2_token(token, requests.Request(), GOOGLE_CLIENT_ID)
        
        # ID token is valid. Get user's Google info.
        email = idinfo['email']
        name = idinfo.get('name', 'Google User')
        
        conn = get_db_connection()
        try:
            cursor = conn.cursor(dictionary=True)
            
            # 2. Check if user already exists
            cursor.execute("SELECT * FROM users WHERE email=%s", (email,))
            user = cursor.fetchone()
            
            if not user:
                # 3. Create new user if they don't exist
                cursor.execute(
                    "INSERT INTO users (name, email, role, email_verified) VALUES (%s, %s, %s, TRUE) RETURNING user_id",
                    (name, email, role_requested)
                )
                res = cursor.fetchone()
                user_id = res['user_id']
                
                # Add to role-specific tables (customers or vendors)
                if role_requested == 'Vendor':
                    cursor.execute("INSERT INTO vendors (vendor_id) VALUES (%s)", (user_id,))
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
            
        finally:
            conn.close()
            
    except ValueError:
        # Invalid token
        raise HTTPException(status_code=401, detail="Invalid Google token")
```

---

## 3. Frontend Implementation (React/Vite)

### Dependencies
Run this in the `Frontend` folder:
```bash
npm install @react-oauth/google
```

### Main Entry Point (`Frontend/src/main.jsx`)
Wrap your app with the provider:

```javascript
import { GoogleOAuthProvider } from '@react-oauth/google';

ReactDOM.createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
    <App />
  </GoogleOAuthProvider>
);
```

### Login Page (`Frontend/src/pages/Login.jsx`)
Add the Google button:

```javascript
import { GoogleLogin } from '@react-oauth/google';

// Inside your Login component:
const handleGoogleSuccess = async (credentialResponse) => {
  const response = await fetch(`${API}/api/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential: credentialResponse.credential }),
  });
  
  const data = await response.json();
  if (data.status === 'success') {
    localStorage.setItem('is_logged_in', 'true');
    localStorage.setItem('user_role', data.role);
    // Navigate based on role...
  }
};

// Add to your JSX below the Sign In button:
<div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
  <div style={{ margin: '1rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>OR</div>
  <GoogleLogin
    onSuccess={handleGoogleSuccess}
    onError={() => console.log('Login Failed')}
    theme="filled_blue"
    shape="pill"
  />
</div>
```

---

## 4. Verification

1. **Login Flow**: Ensure that signing in with a Google account that already exists (matching email) logs the user into their existing profile.
2. **Registration Flow**: Ensure that using Google for a new account correctly creates the user in the database with the verified email flag.
