"""
Migration: Referral Loyalty Program
------------------------------------
- Adds `referral_code` (unique 8-char) to users table
- Adds `referred_by_user_id` to users table
- Creates `referral_milestones` table to track prize tier achievements
- Backfills referral codes for existing users
"""
from database import get_db_connection


def migrate():
    conn = get_db_connection()
    cursor = conn.cursor()

    print("[MIGRATION] Starting referral loyalty program migration...")

    # 1. Add referral_code column to users
    try:
        cursor.execute("""
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS referral_code VARCHAR(12) UNIQUE
        """)
        print("[OK] Added referral_code column to users")
    except Exception as e:
        print(f"[SKIP] referral_code: {e}")

    # 2. Add referred_by_user_id column to users
    try:
        cursor.execute("""
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS referred_by_user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL
        """)
        print("[OK] Added referred_by_user_id column to users")
    except Exception as e:
        print(f"[SKIP] referred_by_user_id: {e}")

    conn.commit()

    # 3. Backfill unique 8-char codes for all existing users who don't have one
    try:
        cursor.execute("""
            UPDATE users 
            SET referral_code = UPPER(SUBSTRING(MD5(RANDOM()::TEXT || user_id::TEXT || RANDOM()::TEXT), 1, 8))
            WHERE referral_code IS NULL
        """)
        updated = cursor.rowcount
        print(f"[OK] Backfilled referral_code for {updated} existing users")
    except Exception as e:
        print(f"[ERROR] Backfill: {e}")

    conn.commit()

    # 4. Create referral_milestones table
    try:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS referral_milestones (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
                tier INTEGER NOT NULL,
                role VARCHAR(20) NOT NULL,
                referral_count INTEGER NOT NULL,
                achieved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                prize_fulfilled BOOLEAN DEFAULT FALSE,
                fulfilled_at TIMESTAMP,
                fulfilled_by_admin_id INTEGER,
                notes TEXT,
                UNIQUE(user_id, tier)
            )
        """)
        print("[OK] Created referral_milestones table")
    except Exception as e:
        print(f"[SKIP] referral_milestones: {e}")

    conn.commit()
    cursor.close()
    conn.close()
    print("[MIGRATION] Referral migration complete!")


if __name__ == "__main__":
    migrate()
