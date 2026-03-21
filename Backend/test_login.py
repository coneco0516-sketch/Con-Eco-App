import requests
import json

# Test login with known credentials
base_url = "http://localhost:8000/api/auth/login"

test_users = [
    {"email": "admin@coneco.com", "password": "admin123", "expected_role": "Admin"},
    {"email": "vendor@coneco.com", "password": "vendor123", "expected_role": "Vendor"},
    {"email": "customer@coneco.com", "password": "customer123", "expected_role": "Customer"},
    {"email": "customer@coneco.com", "password": "wrong123", "expected_result": "error"},  # Wrong password
]

print("=" * 70)
print("TESTING LOGIN ENDPOINT")
print("=" * 70)

for i, user in enumerate(test_users, 1):
    email = user["email"]
    password = user["password"]
    
    payload = {
        "email": email,
        "password": password
    }
    
    try:
        print(f"\n[TEST {i}] Testing: {email} / {'*' * len(password)}")
        response = requests.post(base_url, json=payload)
        result = response.json()
        
        print(f"  Status: {response.status_code}")
        print(f"  Response: {json.dumps(result, indent=2)}")
        
        # Verify expectations
        if "expected_role" in user:
            if result.get("status") == "success" and result.get("role") == user["expected_role"]:
                print(f"  ✅ PASS: Got expected role {user['expected_role']}")
            else:
                print(f"  ❌ FAIL: Expected role {user['expected_role']}, got {result.get('role')}")
        elif "expected_result" in user:
            if result.get("status") == user["expected_result"]:
                print(f"  ✅ PASS: Got expected status {user['expected_result']}")
            else:
                print(f"  ❌ FAIL: Expected status {user['expected_result']}, got {result.get('status')}")
        
    except Exception as e:
        print(f"  ❌ ERROR: {e}")

print("\n" + "=" * 70)
