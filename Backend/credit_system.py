"""
Pay Later Credit Score System
Handles 3-stage pay later logic and credit score management
"""
from database import get_db_connection
from datetime import datetime, timedelta
from email_service import send_pay_later_warning, send_pay_later_blocked_notification


# ── Stage Configuration ──────────────────────────────────────────────────────
STAGE1_DAYS = 30   # Days after delivery for stage 1
STAGE2_DAYS = 10   # Extra days for stage 2
STAGE3_DAYS = 1    # Day 41 - must pay on this day
BLOCK_MONTHS = 3   # Months to block after stage 3 failure

# Credit score deductions
STAGE1_DEDUCTION = 0
STAGE2_DEDUCTION = 10
STAGE3_DEDUCTION = 20
DEFAULT_DEDUCTION = 30
CONSECUTIVE_STAGE3_DEDUCTION = 30  # If paying in stage 3 for 2+ consecutive orders


def ensure_credit_tables():
    """Create credit_scores table and add pay later columns to orders if they don't exist."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        # Create credit_scores table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS credit_scores (
                customer_id INT PRIMARY KEY,
                credit_score INT DEFAULT 100,
                last_deduction INT DEFAULT 0,
                consecutive_stage3 INT DEFAULT 0,
                pay_later_blocked BOOLEAN DEFAULT FALSE,
                blocked_until DATETIME NULL,
                total_pay_later_orders INT DEFAULT 0,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        """)
        
        # Standardize table name for Orders (handling case sensitivity on Linux)
        try:
            cursor.execute("DESCRIBE Orders")
            table_name = "Orders"
        except:
            table_name = "orders"
            
        # Add pay later columns (safe - only adds if not exists)
        columns_to_add = [
            ("delivered_at", "DATETIME NULL"),
            ("pay_later_stage", "VARCHAR(20) NULL"),
            ("pay_later_due_date", "DATETIME NULL"),
            ("pay_later_stage2_due", "DATETIME NULL"),
            ("pay_later_stage3_due", "DATETIME NULL")
        ]
        
        for col_name, col_type in columns_to_add:
            try:
                cursor.execute(f"ALTER TABLE {table_name} ADD COLUMN {col_name} {col_type}")
                print(f"Added column {col_name} to {table_name}")
            except:
                pass
        
        # Ensure 'Delivered', 'Shipped', 'Out for Delivery' are in the status enum
        try:
            cursor.execute(f"ALTER TABLE {table_name} MODIFY COLUMN status ENUM('Pending','Processing','Shipped','Out for Delivery','Completed','Cancelled','Delivered') DEFAULT 'Pending'")
        except:
            pass
        
        conn.commit()
        cursor.close()
    except Exception as e:
        print(f"Error ensuring credit tables: {e}")
    finally:
        conn.close()


def get_or_create_credit_score(customer_id):
    """Get a customer's credit score, creating the record if it doesn't exist."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM credit_scores WHERE customer_id=%s", (customer_id,))
        row = cursor.fetchone()
        
        if not row:
            cursor.execute(
                "INSERT INTO credit_scores (customer_id, credit_score) VALUES (%s, 100)",
                (customer_id,)
            )
            conn.commit()
            cursor.execute("SELECT * FROM credit_scores WHERE customer_id=%s", (customer_id,))
            row = cursor.fetchone()
        
        cursor.close()
        return row
    finally:
        conn.close()


def is_pay_later_eligible(customer_id):
    """Check if a customer can use Pay Later."""
    score_data = get_or_create_credit_score(customer_id)
    
    if score_data['pay_later_blocked']:
        blocked_until = score_data['blocked_until']
        if blocked_until and datetime.now() < blocked_until:
            return False, f"Pay Later blocked until {blocked_until.strftime('%d %b %Y')}", score_data['credit_score']
        else:
            # Unblock - the block period has expired
            conn = get_db_connection()
            try:
                cursor = conn.cursor()
                cursor.execute(
                    "UPDATE credit_scores SET pay_later_blocked=FALSE, blocked_until=NULL WHERE customer_id=%s",
                    (customer_id,)
                )
                conn.commit()
                cursor.close()
            finally:
                conn.close()
    
    # Check for existing unpaid pay later orders
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT COUNT(*) as c FROM Orders 
            WHERE customer_id=%s AND payment_method='Pay Later' 
            AND pay_later_stage NOT IN ('Completed') 
            AND pay_later_stage IS NOT NULL
        """, (customer_id,))
        res = cursor.fetchone()
        cursor.close()
        
        if res and res['c'] > 0:
            return False, "You have unpaid Pay Later orders. Please settle them first.", score_data['credit_score']
    finally:
        conn.close()
    
    return True, "Eligible", score_data['credit_score']


def set_pay_later_timeline(order_id, delivered_at=None):
    """Called when vendor marks an order as Delivered. Sets the pay later timeline."""
    if not delivered_at:
        delivered_at = datetime.now()
    
    stage1_due = delivered_at + timedelta(days=STAGE1_DAYS)
    stage2_due = stage1_due + timedelta(days=STAGE2_DAYS)
    stage3_due = stage2_due + timedelta(days=STAGE3_DAYS)
    
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE Orders SET 
                delivered_at=%s,
                pay_later_stage='Stage1',
                pay_later_due_date=%s,
                pay_later_stage2_due=%s,
                pay_later_stage3_due=%s
            WHERE order_id=%s AND payment_method='Pay Later'
        """, (delivered_at, stage1_due, stage2_due, stage3_due, order_id))
        conn.commit()
        cursor.close()
    finally:
        conn.close()


def process_pay_later_payment(order_id, customer_id):
    """
    Called when a Pay Later order is paid. 
    Determines which stage the payment was made in and adjusts credit score.
    """
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        
        # Get the order details
        cursor.execute("""
            SELECT pay_later_stage, pay_later_due_date, pay_later_stage2_due, pay_later_stage3_due, delivered_at
            FROM Orders WHERE order_id=%s
        """, (order_id,))
        order = cursor.fetchone()
        
        if not order or not order['delivered_at']:
            cursor.close()
            return
        
        now = datetime.now()
        stage1_due = order['pay_later_due_date']
        stage2_due = order['pay_later_stage2_due']
        
        # Determine which stage the payment was made in
        if stage1_due and now <= stage1_due:
            paid_stage = 'Stage1'
            deduction = STAGE1_DEDUCTION
        elif stage2_due and now <= stage2_due:
            paid_stage = 'Stage2'
            deduction = STAGE2_DEDUCTION
        else:
            paid_stage = 'Stage3'
            deduction = STAGE3_DEDUCTION
        
        # Mark order as completed
        cursor.execute(
            "UPDATE Orders SET pay_later_stage='Completed' WHERE order_id=%s",
            (order_id,)
        )
        
        # Get current credit score data
        cursor.execute("SELECT * FROM credit_scores WHERE customer_id=%s", (customer_id,))
        score_data = cursor.fetchone()
        
        if not score_data:
            cursor.execute("INSERT INTO credit_scores (customer_id, credit_score) VALUES (%s, 100)", (customer_id,))
            conn.commit()
            cursor.execute("SELECT * FROM credit_scores WHERE customer_id=%s", (customer_id,))
            score_data = cursor.fetchone()
        
        current_score = score_data['credit_score']
        last_deduction = score_data['last_deduction']
        consecutive_stage3 = score_data['consecutive_stage3']
        
        new_score = current_score
        new_last_deduction = 0
        new_consecutive_stage3 = consecutive_stage3
        
        if paid_stage == 'Stage1':
            # Recovery: add half of last deduction back
            if last_deduction > 0:
                recovery = last_deduction // 2
                new_score = min(100, current_score + recovery)
            new_last_deduction = 0
            new_consecutive_stage3 = 0  # Reset consecutive stage3 counter
            
        elif paid_stage == 'Stage2':
            new_score = max(0, current_score - deduction)
            new_last_deduction = deduction
            new_consecutive_stage3 = 0
            
        elif paid_stage == 'Stage3':
            new_consecutive_stage3 = consecutive_stage3 + 1
            # Escalated deduction for consecutive stage 3 payments
            if new_consecutive_stage3 >= 2:
                deduction = CONSECUTIVE_STAGE3_DEDUCTION
            new_score = max(0, current_score - deduction)
            new_last_deduction = deduction
        
        # Update credit score
        cursor.execute("""
            UPDATE credit_scores SET 
                credit_score=%s, 
                last_deduction=%s, 
                consecutive_stage3=%s,
                total_pay_later_orders=total_pay_later_orders+1
            WHERE customer_id=%s
        """, (new_score, new_last_deduction, new_consecutive_stage3, customer_id))
        
        conn.commit()
        cursor.close()
        
        return {
            'paid_stage': paid_stage,
            'deduction': deduction if paid_stage != 'Stage1' else 0,
            'recovery': (last_deduction // 2) if paid_stage == 'Stage1' and last_deduction > 0 else 0,
            'new_score': new_score
        }
    finally:
        conn.close()


def process_pay_later_default(order_id, customer_id):
    """
    Called when a customer fails to pay even in Stage 3.
    Blocks Pay Later for 3 months and deducts 30 points.
    """
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        
        blocked_until = datetime.now() + timedelta(days=BLOCK_MONTHS * 30)
        
        # Mark order as defaulted
        cursor.execute(
            "UPDATE Orders SET pay_later_stage='Defaulted' WHERE order_id=%s",
            (order_id,)
        )
        
        # Get current score
        cursor.execute("SELECT * FROM credit_scores WHERE customer_id=%s", (customer_id,))
        score_data = cursor.fetchone()
        
        if not score_data:
            cursor.execute("INSERT INTO credit_scores (customer_id, credit_score) VALUES (%s, 100)", (customer_id,))
            conn.commit()
            cursor.execute("SELECT * FROM credit_scores WHERE customer_id=%s", (customer_id,))
            score_data = cursor.fetchone()
        
        new_score = max(0, score_data['credit_score'] - DEFAULT_DEDUCTION)
        
        cursor.execute("""
            UPDATE credit_scores SET 
                credit_score=%s,
                last_deduction=%s,
                pay_later_blocked=TRUE,
                blocked_until=%s,
                consecutive_stage3=consecutive_stage3+1
            WHERE customer_id=%s
        """, (new_score, DEFAULT_DEDUCTION, blocked_until, customer_id))
        
        conn.commit()
        cursor.close()
        
        return {'new_score': new_score, 'blocked_until': blocked_until}
    finally:
        conn.close()


def check_overdue_orders():
    """
    Check and update stages for overdue Pay Later orders.
    Should be called periodically (e.g., daily via a cron endpoint).
    Returns list of actions taken for email notifications.
    """
    conn = get_db_connection()
    actions = []
    try:
        cursor = conn.cursor(dictionary=True)
        now = datetime.now()
        
        # 1. Stage 1 → Stage 2: Past stage 1 due date (30 days)
        cursor.execute("""
            SELECT o.order_id, o.customer_id, o.pay_later_due_date, o.delivered_at, o.amount, u.email, u.name 
            FROM Orders o
            JOIN Users u ON o.customer_id = u.user_id
            WHERE o.payment_method='Pay Later' 
            AND o.pay_later_stage='Stage1' 
            AND o.pay_later_due_date IS NOT NULL 
            AND o.pay_later_due_date < %s
        """, (now,))
        
        for order in cursor.fetchall():
            cursor.execute("UPDATE Orders SET pay_later_stage='Stage2' WHERE order_id=%s", (order['order_id'],))
            
            # Send Stage 2 warning
            # Stage 2 due date is 40 days after delivery (10 days after stage 1 due)
            stage2_due_str = (order['delivered_at'] + timedelta(days=40)).strftime('%d %b %Y')
            send_pay_later_warning(order['email'], order['name'], order['order_id'], "Stage 2", stage2_due_str, order['amount'])
            
            actions.append({'type': 'stage2_warning', 'order_id': order['order_id'], 'customer_email': order['email']})
        
        # 2. Stage 2 → Stage 3: Past stage 2 due date (40 days)
        cursor.execute("""
            SELECT o.order_id, o.customer_id, o.pay_later_stage2_due, o.delivered_at, o.amount, u.email, u.name 
            FROM Orders o
            JOIN Users u ON o.customer_id = u.user_id
            WHERE o.payment_method='Pay Later' 
            AND o.pay_later_stage='Stage2' 
            AND o.pay_later_stage2_due IS NOT NULL 
            AND o.pay_later_stage2_due < %s
        """, (now,))
        
        for order in cursor.fetchall():
            cursor.execute("UPDATE Orders SET pay_later_stage='Stage3' WHERE order_id=%s", (order['order_id'],))
            
            # Send Stage 3 warning (FINAL DAY)
            stage3_due_str = (order['delivered_at'] + timedelta(days=41)).strftime('%d %b %Y')
            send_pay_later_warning(order['email'], order['name'], order['order_id'], "Stage 3 (FINAL)", stage3_due_str, order['amount'])
            
            actions.append({'type': 'stage3_warning', 'order_id': order['order_id'], 'customer_email': order['email']})
        
        # 3. Stage 3 default: Past stage 3 due date (41 days)
        cursor.execute("""
            SELECT o.order_id, o.customer_id, o.pay_later_stage3_due, u.email, u.name 
            FROM Orders o
            JOIN Users u ON o.customer_id = u.user_id
            WHERE o.payment_method='Pay Later' 
            AND o.pay_later_stage='Stage3' 
            AND o.pay_later_stage3_due IS NOT NULL 
            AND o.pay_later_stage3_due < %s
        """, (now,))
        
        for order in cursor.fetchall():
            result = process_pay_later_default(order['order_id'], order['customer_id'])
            
            # Send Blocked notification
            blocked_until_str = result['blocked_until'].strftime('%d %b %Y')
            send_pay_later_blocked_notification(order['email'], order['name'], order['order_id'], blocked_until_str)
            
            actions.append({
                'type': 'defaulted', 
                'order_id': order['order_id'], 
                'customer_email': order['email'],
                'blocked_until': blocked_until_str
            })
        
        conn.commit()
        cursor.close()
    except Exception as e:
        print(f"Error checking overdue orders: {e}")
    finally:
        conn.close()
    
    return actions
