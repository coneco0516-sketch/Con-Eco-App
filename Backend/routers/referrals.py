"""
Referral Loyalty Program Router
---------------------------------
Handles:
  GET  /api/referrals/my-stats        → referral code, count, milestones
  GET  /api/referrals/history         → list of users referred
  GET  /api/admin/referrals           → admin view of all referrers
  PUT  /api/admin/referrals/{uid}/fulfill/{tier} → mark prize fulfilled
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from database import get_db_connection
from routers.auth import get_current_user_from_cookie
import secrets
import string

def trigger_referral_check_for_order(order_id: int, conn):
    """Helper to check and award milestones when an order is completed."""
    cursor = conn.cursor(dictionary=True)
    # Check physical orders
    cursor.execute("SELECT customer_id, vendor_id FROM orders WHERE order_id = %s", (order_id,))
    order = cursor.fetchone()
    # Check booked services if not in orders (same order_id might be used for services, or we just pass it)
    if not order:
        cursor.execute("SELECT customer_id, vendor_id FROM bookedservices WHERE booking_id = %s", (str(order_id),))
        order = cursor.fetchone()
        
    if not order:
        cursor.close()
        return

    # For customer
    if order.get("customer_id"):
        cursor.execute("SELECT referred_by_user_id FROM users WHERE user_id = %s", (order["customer_id"],))
        c_user = cursor.fetchone()
        if c_user and c_user.get("referred_by_user_id"):
            check_and_award_milestones(c_user["referred_by_user_id"], conn)
            
    # For vendor
    if order.get("vendor_id"):
        cursor.execute("SELECT referred_by_user_id FROM users WHERE user_id = %s", (order["vendor_id"],))
        v_user = cursor.fetchone()
        if v_user and v_user.get("referred_by_user_id"):
            check_and_award_milestones(v_user["referred_by_user_id"], conn)
            
    cursor.close()

router = APIRouter()

# ─── Milestone thresholds (same-role only) ────────────────────────────────────
VENDOR_MILESTONES = {1: 50, 2: 100, 3: 200}
CUSTOMER_MILESTONES = {1: 25, 2: 50, 3: 100}


def get_milestones_for_role(role: str) -> dict:
    if role == "Vendor":
        return VENDOR_MILESTONES
    return CUSTOMER_MILESTONES


def generate_referral_code() -> str:
    """Generate a unique 8-character alphanumeric code (uppercase)."""
    alphabet = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(8))


def ensure_referral_code(user_id: int, conn) -> str:
    """Ensure the user has a referral code; generate one if not."""
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT referral_code FROM users WHERE user_id = %s", (user_id,))
    row = cursor.fetchone()
    code = row.get("referral_code") if row else None

    if not code:
        # Generate a unique code
        for _ in range(10):
            candidate = generate_referral_code()
            cursor.execute("SELECT user_id FROM users WHERE referral_code = %s", (candidate,))
            if not cursor.fetchone():
                cursor.execute(
                    "UPDATE users SET referral_code = %s WHERE user_id = %s",
                    (candidate, user_id)
                )
                conn.commit()
                code = candidate
                break
    cursor.close()
    return code


def check_and_award_milestones(referrer_id: int, conn):
    """Check if the referrer has hit any new milestones and log them."""
    cursor = conn.cursor(dictionary=True)

    # Get referrer's role
    cursor.execute("SELECT role FROM users WHERE user_id = %s", (referrer_id,))
    user_row = cursor.fetchone()
    if not user_row:
        cursor.close()
        return
    role = user_row["role"]

    # Count ALL referrals (any role) who have met order requirements
    cursor.execute("""
        SELECT COUNT(*) as total
        FROM users u
        WHERE u.referred_by_user_id = %s AND u.email_verified = TRUE
          AND (
            (u.role = 'Customer' AND (
                (SELECT COUNT(*) FROM orders o WHERE o.customer_id = u.user_id AND o.status = 'Completed') +
                (SELECT COUNT(*) FROM bookedservices bs WHERE bs.customer_id = u.user_id AND bs.status = 'Completed')
            ) >= 2)
            OR
            (u.role = 'Vendor' AND (
                (SELECT COUNT(*) FROM orders o WHERE o.vendor_id = u.user_id AND o.status = 'Completed') +
                (SELECT COUNT(*) FROM bookedservices bs WHERE bs.vendor_id = u.user_id AND bs.status = 'Completed')
            ) >= 3)
          )
    """, (referrer_id,))
    count_row = cursor.fetchone()
    total_referrals = count_row["total"] if count_row else 0

    milestones = get_milestones_for_role(role)

    for tier, threshold in milestones.items():
        if total_referrals >= threshold:
            # Check if already logged
            cursor.execute(
                "SELECT id FROM referral_milestones WHERE user_id = %s AND tier = %s",
                (referrer_id, tier)
            )
            existing = cursor.fetchone()
            if not existing:
                cursor.execute("""
                    INSERT INTO referral_milestones (user_id, tier, role, referral_count)
                    VALUES (%s, %s, %s, %s)
                """, (referrer_id, tier, role, total_referrals))
                conn.commit()
                print(f"[REFERRAL] User {referrer_id} ({role}) achieved Tier {tier} milestone!")

    cursor.close()


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/my-stats")
def get_my_referral_stats(request: Request):
    """Return the logged-in user's referral code, count, and milestone progress."""
    user = get_current_user_from_cookie(request)
    user_id = user["user_id"]
    role = user["role"]

    conn = get_db_connection()
    try:
        # Ensure user has a code
        code = ensure_referral_code(user_id, conn)

        cursor = conn.cursor(dictionary=True)

        # Count ALL verified referrals (any role) and split by qualification
        cursor.execute("""
            SELECT 
                COUNT(*) as total_signups,
                SUM(CASE WHEN (
                    (u.role = 'Customer' AND ((SELECT COUNT(*) FROM orders o WHERE o.customer_id = u.user_id AND o.status = 'Completed') + (SELECT COUNT(*) FROM bookedservices bs WHERE bs.customer_id = u.user_id AND bs.status = 'Completed')) >= 2)
                    OR
                    (u.role = 'Vendor' AND ((SELECT COUNT(*) FROM orders o WHERE o.vendor_id = u.user_id AND o.status = 'Completed') + (SELECT COUNT(*) FROM bookedservices bs WHERE bs.vendor_id = u.user_id AND bs.status = 'Completed')) >= 3)
                ) THEN 1 ELSE 0 END) as total_completed
            FROM users u
            WHERE u.referred_by_user_id = %s AND u.email_verified = TRUE
        """, (user_id,))
        row = cursor.fetchone()
        total_completed = int(row["total_completed"] or 0) if row else 0
        total_signups = int(row["total_signups"] or 0) if row else 0
        total_pending = max(0, total_signups - total_completed)
        total_referrals = total_completed # Only completed count towards milestones

        # Get achieved milestones
        cursor.execute("""
            SELECT tier, referral_count, achieved_at, prize_fulfilled
            FROM referral_milestones
            WHERE user_id = %s
            ORDER BY tier ASC
        """, (user_id,))
        achieved_raw = cursor.fetchall()
        achieved_tiers = {m["tier"] for m in achieved_raw}

        milestones = get_milestones_for_role(role)

        # Build milestone list
        milestone_list = []
        next_milestone = None
        for tier, threshold in sorted(milestones.items()):
            is_achieved = tier in achieved_tiers
            progress_pct = min(100, int((total_referrals / threshold) * 100))
            remaining = max(0, threshold - total_referrals)
            m_data = {
                "tier": tier,
                "required": threshold,
                "achieved": is_achieved,
                "progress_pct": progress_pct if not is_achieved else 100,
                "remaining": remaining if not is_achieved else 0
            }
            if achieved_raw:
                for am in achieved_raw:
                    if am["tier"] == tier:
                        m_data["achieved_at"] = str(am["achieved_at"])
                        m_data["prize_fulfilled"] = am["prize_fulfilled"]
            milestone_list.append(m_data)
            if not is_achieved and next_milestone is None:
                next_milestone = {"tier": tier, "required": threshold, "remaining": remaining}

        # Build shareable referral link
        base_url = "https://coneco.store"
        referral_link = f"{base_url}/register?ref={code}"

        cursor.close()
        return {
            "status": "success",
            "referral_code": code,
            "referral_link": referral_link,
            "total_referrals": total_referrals,
            "total_pending_referrals": total_pending,
            "total_signups": total_signups,
            "role": role,
            "milestones": milestone_list,
            "next_milestone": next_milestone
        }
    finally:
        conn.close()


@router.get("/history")
def get_referral_history(request: Request):
    """Return a list of users referred by the logged-in user (same role only)."""
    user = get_current_user_from_cookie(request)
    user_id = user["user_id"]
    role = user["role"]

    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT 
                u.user_id,
                u.name,
                u.role AS referred_role,
                TO_CHAR(u.created_at, 'DD Mon YYYY') AS joined_date,
                u.email_verified,
                CASE WHEN (
                    (u.role = 'Customer' AND ((SELECT COUNT(*) FROM orders o WHERE o.customer_id = u.user_id AND o.status = 'Completed') + (SELECT COUNT(*) FROM bookedservices bs WHERE bs.customer_id = u.user_id AND bs.status = 'Completed')) >= 2)
                    OR
                    (u.role = 'Vendor' AND ((SELECT COUNT(*) FROM orders o WHERE o.vendor_id = u.user_id AND o.status = 'Completed') + (SELECT COUNT(*) FROM bookedservices bs WHERE bs.vendor_id = u.user_id AND bs.status = 'Completed')) >= 3)
                ) THEN TRUE ELSE FALSE END AS is_completed
            FROM users u
            WHERE u.referred_by_user_id = %s
            ORDER BY u.created_at DESC
            LIMIT 100
        """, (user_id,))
        referred_users = cursor.fetchall()
        cursor.close()
        return {"status": "success", "referred_users": referred_users}
    finally:
        conn.close()


# ─── Admin Endpoints ──────────────────────────────────────────────────────────

@router.get("/admin/all")
def admin_get_all_referrals(request: Request):
    """Admin: Get all users with their referral stats and milestone status."""
    user = get_current_user_from_cookie(request)
    if user.get("role") not in ("Super Admin", "Admin", "Employee"):
        raise HTTPException(status_code=403, detail="Admin access required")

    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT
                u.user_id,
                u.name,
                u.email,
                u.role,
                u.referral_code,
                TO_CHAR(u.created_at, 'DD Mon YYYY') AS joined_date,
                (
                    SELECT COUNT(*) FROM users r
                    WHERE r.referred_by_user_id = u.user_id AND r.email_verified = TRUE
                ) AS total_signups,
                (
                    SELECT COUNT(*) FROM users r
                    WHERE r.referred_by_user_id = u.user_id AND r.email_verified = TRUE
                      AND (
                        (r.role = 'Customer' AND ((SELECT COUNT(*) FROM orders o WHERE o.customer_id = r.user_id AND o.status = 'Completed') + (SELECT COUNT(*) FROM bookedservices bs WHERE bs.customer_id = r.user_id AND bs.status = 'Completed')) >= 2)
                        OR
                        (r.role = 'Vendor' AND ((SELECT COUNT(*) FROM orders o WHERE o.vendor_id = r.user_id AND o.status = 'Completed') + (SELECT COUNT(*) FROM bookedservices bs WHERE bs.vendor_id = r.user_id AND bs.status = 'Completed')) >= 3)
                      )
                ) AS referral_count
            FROM users u
            WHERE u.role IN ('Customer', 'Vendor')
            ORDER BY referral_count DESC, u.created_at DESC
        """)
        users = cursor.fetchall()

        # Attach milestone info for each user
        for usr in users:
            cursor.execute("""
                SELECT tier, referral_count, achieved_at, prize_fulfilled, fulfilled_at
                FROM referral_milestones WHERE user_id = %s ORDER BY tier
            """, (usr["user_id"],))
            usr["milestones_achieved"] = cursor.fetchall()

        cursor.close()
        return {"status": "success", "users": users}
    finally:
        conn.close()


@router.put("/admin/fulfill/{user_id}/{tier}")
def admin_fulfill_prize(user_id: int, tier: int, request: Request):
    """Admin: Mark a user's milestone prize as fulfilled."""
    admin = get_current_user_from_cookie(request)
    if admin.get("role") not in ("Super Admin", "Admin"):
        raise HTTPException(status_code=403, detail="Admin access required")

    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            UPDATE referral_milestones
            SET prize_fulfilled = TRUE, fulfilled_at = NOW(), fulfilled_by_admin_id = %s
            WHERE user_id = %s AND tier = %s
            RETURNING id
        """, (admin["user_id"], user_id, tier))
        result = cursor.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Milestone not found or not yet achieved")
        conn.commit()
        cursor.close()
        return {"status": "success", "message": f"Tier {tier} prize marked as fulfilled for user {user_id}"}
    finally:
        conn.close()
