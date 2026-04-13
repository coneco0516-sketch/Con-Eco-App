import os
import bcrypt
import psycopg2
from dotenv import load_dotenv

# Load database environment variables
load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL")

def hash_password(password: str) -> str:
    """Securely hash a password using bcrypt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def create_super_admin():
    if not DATABASE_URL:
        print("Error: DATABASE_URL not found in .env file.")
        return

    # User details
    admin_data = {
        "name": "Super Admin",
        "email": "coneco0516@gmail.com",
        "password": "Admin@0516",
        "phone": "9449088128",
        "role": "Admin"
    }

    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()

        # Check if user already exists
        cursor.execute("SELECT user_id FROM users WHERE email = %s", (admin_data["email"],))
        if cursor.fetchone():
            print(f"User with email {admin_data['email']} already exists. Skipping creation.")
            cursor.close()
            conn.close()
            return

        # Hash the password
        password_hash = hash_password(admin_data["password"])

        # Insert into users table
        # Note: 'email_verified' is not in current schema, we use default 'role' constraints
        cursor.execute("""
            INSERT INTO users (name, email, phone, password_hash, role)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING user_id
        """, (
            admin_data["name"],
            admin_data["email"],
            admin_data["phone"],
            password_hash,
            admin_data["role"]
        ))

        user_id = cursor.fetchone()[0]
        conn.commit()

        print(f"Successfully created Super Admin user with ID: {user_id}")
        print(f"Login Email: {admin_data['email']}")
        print(f"Role: {admin_data['role']}")

        cursor.close()
        conn.close()

    except Exception as e:
        print(f"Error creating admin user: {e}")

if __name__ == "__main__":
    create_super_admin()
