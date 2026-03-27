from fastapi import APIRouter, Depends, HTTPException, Request
from database import get_db_connection
from routers.auth import get_current_user_from_cookie
from pydantic import BaseModel
from typing import Optional
from email_service import send_qc_status_notification, get_notification_preferences, send_contact_reply

router = APIRouter()

def check_admin(user = Depends(get_current_user_from_cookie)):
    if user['role'] != 'Admin':
        raise HTTPException(status_code=403, detail="Forbidden")
    return user

@router.get("/dashboard_stats")
def dashboard_stats(user = Depends(check_admin)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        
        stats = {
            'pending_vendors': 0,
            'pending_customers': 0,
            'total_orders': 0,
            'total_revenue': 0,
            'total_commission': 0,
            'pending_settlement': 0
        }
        
        cursor.execute("SELECT COUNT(*) as c FROM Vendors WHERE verification_status='Pending'")
        res = cursor.fetchone()
        if res: stats['pending_vendors'] = res['c'] or 0
        
        cursor.execute("SELECT COUNT(*) as c FROM Customers WHERE verification_status='Pending'")
        res = cursor.fetchone()
        if res: stats['pending_customers'] = res['c'] or 0
        
        cursor.execute("SELECT COUNT(*) as c FROM Orders")
        res = cursor.fetchone()
        if res: stats['total_orders'] = res['c'] or 0
        
        cursor.execute("SELECT SUM(amount) as s FROM Payments WHERE status='Completed'")
        res = cursor.fetchone()
        if res: stats['total_revenue'] = res['s'] or 0
        
        # Add commission stats
        cursor.execute("SELECT SUM(commission_amount) as s FROM commissions WHERE status='Settled'")
        res = cursor.fetchone()
        if res and res.get('s'): 
            stats['total_commission'] = float(res.get('s', 0)) or 0
        
        cursor.execute("SELECT SUM(commission_amount) as s FROM commissions WHERE status='Pending'")
        res = cursor.fetchone()
        if res and res.get('s'): 
            stats['pending_settlement'] = float(res.get('s', 0)) or 0
        
        cursor.close()
        return {"status": "success", "stats": stats}
    finally:
        conn.close()

@router.get("/customers")
def get_customers(user = Depends(check_admin)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT c.customer_id, u.name, u.email, u.phone, c.verification_status, "
            "COALESCE(cs.credit_score, 100) as credit_score, cs.pay_later_blocked "
            "FROM Customers c "
            "JOIN Users u ON c.customer_id = u.user_id "
            "LEFT JOIN credit_scores cs ON c.customer_id = cs.customer_id"
        )
        customers = cursor.fetchall()
        cursor.close()
        return {"status": "success", "customers": customers}
    finally:
        conn.close()

class StatusUpdate(BaseModel):
    id: int
    status: str

class VendorQCUpdate(BaseModel):
    vendor_id: int
    verification_status: str
    qc_score: int

@router.post("/customers/update_status")
def update_customer_status(data: StatusUpdate, user = Depends(check_admin)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("UPDATE Customers SET verification_status=%s WHERE customer_id=%s", (data.status, data.id))
        conn.commit()
        cursor.close()
        return {"status": "success"}
    finally:
        conn.close()

@router.get("/vendors")
def get_vendors(user = Depends(check_admin)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT v.vendor_id, u.name, v.company_name, u.email, u.phone, v.verification_status, v.qc_score "
            "FROM Vendors v JOIN Users u ON v.vendor_id = u.user_id"
        )
        vendors = cursor.fetchall()
        cursor.close()
        return {"status": "success", "vendors": vendors}
    finally:
        conn.close()

@router.post("/vendors/update_status")
def update_vendor_status(data: StatusUpdate, user = Depends(check_admin)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("UPDATE Vendors SET verification_status=%s WHERE vendor_id=%s", (data.status, data.id))
        conn.commit()
        cursor.close()
        return {"status": "success"}
    finally:
        conn.close()

@router.post("/vendors/update_qc")
def update_vendor_qc(data: VendorQCUpdate, user = Depends(check_admin)):
    """Update vendor QC verification status and score"""
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        # Validate QC score is between 0-100
        qc_score = max(0, min(100, data.qc_score))
        
        # Get vendor details before updating
        cursor.execute("""
            SELECT u.email, v.company_name, u.user_id 
            FROM Vendors v 
            JOIN Users u ON v.vendor_id = u.user_id 
            WHERE v.vendor_id = %s
        """, (data.vendor_id,))
        
        vendor = cursor.fetchone()
        
        # Update QC status
        cursor.execute(
            "UPDATE Vendors SET verification_status=%s, qc_score=%s WHERE vendor_id=%s", 
            (data.verification_status, qc_score, data.vendor_id)
        )
        conn.commit()
        
        # Send notification email to vendor
        if vendor:
            try:
                prefs = get_notification_preferences(vendor['user_id'])
                if prefs.get('qc_status_alerts', True):
                    send_qc_status_notification(
                        vendor['email'],
                        vendor['company_name'],
                        data.verification_status,
                        qc_score=qc_score,
                        feedback=getattr(data, 'feedback', None)
                    )
            except Exception as e:
                print(f"Error sending QC notification: {str(e)}")
        
        cursor.close()
        return {"status": "success", "message": f"Vendor QC updated. Status: {data.verification_status}, QC Score: {qc_score}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.get("/orders")
def get_orders(user = Depends(check_admin)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        
        # Fixed: u_cust.name instead of full_name, and correct JOIN
        sql = """
        SELECT o.order_id, u_cust.name as customer_name, v.company_name as vendor_name, 
               o.order_type, o.amount, o.status, o.payment_method,
               o.pay_later_stage, 
               DATE_FORMAT(o.pay_later_due_date, '%d %b %Y') as pay_later_due_date, 
               DATE_FORMAT(o.pay_later_stage2_due, '%d %b %Y') as pay_later_stage2_due, 
               DATE_FORMAT(o.pay_later_stage3_due, '%d %b %Y') as pay_later_stage3_due,
               COALESCE(cs.credit_score, 100) as customer_credit_score,
               DATE_FORMAT(o.created_at, '%d %M %Y') as date
        FROM Orders o
        JOIN Customers c ON o.customer_id = c.customer_id
        JOIN Users u_cust ON c.customer_id = u_cust.user_id
        JOIN Vendors v ON o.vendor_id = v.vendor_id
        LEFT JOIN credit_scores cs ON o.customer_id = cs.customer_id
        ORDER BY o.created_at DESC
        """
        cursor.execute(sql)
        orders = cursor.fetchall()
        cursor.close()
        return {"status": "success", "orders": orders}
    finally:
        conn.close()

@router.get("/payments")
def get_payments(user = Depends(check_admin)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        
        stats = {'total_revenue': 0, 'pending': 0, 'completed': 0}
        
        cursor.execute("SELECT SUM(amount) as s FROM Payments WHERE status='Completed'")
        res = cursor.fetchone()
        if res: stats['total_revenue'] = res['s'] or 0
        
        cursor.execute("""
            SELECT COUNT(*) as c 
            FROM Payments p 
            JOIN Orders o ON p.order_id = o.order_id 
            WHERE p.status='Pending' AND o.payment_method NOT IN ('COD', 'Pay Later (Cash)')
        """)
        res = cursor.fetchone()
        if res: stats['pending'] = res['c'] or 0
        
        cursor.execute("""
            SELECT COUNT(*) as c 
            FROM Payments p 
            JOIN Orders o ON p.order_id = o.order_id 
            WHERE p.status='Completed' AND o.payment_method NOT IN ('COD', 'Pay Later (Cash)')
        """)
        res = cursor.fetchone()
        if res: stats['completed'] = res['c'] or 0
        
        # Added columns: payment_method, vendor_credited, order_id, base_amount
        sql = """
        SELECT DATE_FORMAT(p.transaction_date, '%d %b %Y') as date, p.txn_id, u_cust.name as customer_name,
               v.company_name as vendor_name, p.amount, (p.amount - o.base_amount) as commission, p.status, o.payment_method, COALESCE(o.vendor_credited, 0) as vendor_credited, o.order_id, o.base_amount
        FROM Payments p
        JOIN Orders o ON p.order_id = o.order_id
        JOIN Customers c ON o.customer_id = c.customer_id
        JOIN Users u_cust ON c.customer_id = u_cust.user_id
        JOIN Vendors v ON o.vendor_id = v.vendor_id
        ORDER BY p.transaction_date DESC
        """
        cursor.execute(sql)
        transactions = cursor.fetchall()
        
        cursor.close()
        return {"status": "success", "stats": stats, "transactions": transactions}
    finally:
        conn.close()

class CreditVendorUpdate(BaseModel):
    order_id: int

@router.post("/payments/credit_vendor")
def credit_vendor_wallet(data: CreditVendorUpdate, user = Depends(check_admin)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        # Safe schema checks
        try: cursor.execute("ALTER TABLE Vendors ADD COLUMN wallet_balance DECIMAL(10,2) DEFAULT 0.00")
        except: pass
        try: cursor.execute("ALTER TABLE Orders ADD COLUMN vendor_credited BOOLEAN DEFAULT False")
        except: pass
        conn.commit()

        cursor.execute("SELECT vendor_id, base_amount, vendor_credited FROM Orders WHERE order_id=%s", (data.order_id,))
        order = cursor.fetchone()
        
        if not order:
            return {"status": "error", "message": "Order not found"}
        if order['vendor_credited']:
            return {"status": "error", "message": "Vendor wallet already credited"}

        net_amount = order['base_amount']

        cursor.execute("UPDATE Vendors SET wallet_balance = COALESCE(wallet_balance, 0) + %s WHERE vendor_id=%s", (net_amount, order['vendor_id']))
        cursor.execute("UPDATE Orders SET vendor_credited = True WHERE order_id=%s", (data.order_id,))
        
        conn.commit()
        return {"status": "success", "message": f"Successfully credited ₹{net_amount} to vendor wallet."}
    except Exception as e:
        conn.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        cursor.close()
        conn.close()

@router.get("/payouts")
def get_payouts(user = Depends(check_admin)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        try: cursor.execute("CREATE TABLE IF NOT EXISTS Payouts (payout_id INT AUTO_INCREMENT PRIMARY KEY, vendor_id INT, amount DECIMAL(10,2), account_name VARCHAR(100), account_number VARCHAR(100), ifsc VARCHAR(50), status ENUM('Pending', 'Completed', 'Rejected') DEFAULT 'Pending', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (vendor_id) REFERENCES Vendors(vendor_id))")
        except: pass
        conn.commit()
        
        cursor.execute("""
            SELECT p.payout_id, v.company_name, p.amount, p.account_name, p.account_number, p.ifsc, p.status, DATE_FORMAT(p.created_at, '%d %b %Y') as date
            FROM Payouts p
            JOIN Vendors v ON p.vendor_id = v.vendor_id
            ORDER BY p.created_at DESC
        """)
        payouts = cursor.fetchall()
        return {"status": "success", "payouts": payouts}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        conn.close()

class PayoutAction(BaseModel):
    payout_id: int

@router.post("/payouts/approve")
def approve_payout(data: PayoutAction, user = Depends(check_admin)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("UPDATE Payouts SET status='Completed' WHERE payout_id=%s AND status='Pending'", (data.payout_id,))
        if cursor.rowcount == 0:
            return {"status": "error", "message": "Payout not found or already processed."}
        conn.commit()
        return {"status": "success", "message": "Payout approved."}
    finally:
        cursor.close()
        conn.close()

@router.post("/payouts/reject")
def reject_payout(data: PayoutAction, user = Depends(check_admin)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT vendor_id, amount FROM Payouts WHERE payout_id=%s AND status='Pending'", (data.payout_id,))
        p = cursor.fetchone()
        if not p:
            return {"status": "error", "message": "Payout not found or already processed."}
        
        cursor.execute("UPDATE Payouts SET status='Rejected' WHERE payout_id=%s", (data.payout_id,))
        cursor.execute("UPDATE Vendors SET wallet_balance = wallet_balance + %s WHERE vendor_id=%s", (p['amount'], p['vendor_id']))
        conn.commit()
        return {"status": "success", "message": "Payout rejected and amount refunded to vendor."}
    finally:
        cursor.close()
        conn.close()

@router.get("/commissions")
def get_commission_report(user = Depends(check_admin)):
    """
    Get commission earnings report for platform.
    Shows total commissions earned, pending settlements, and breakdown by vendor.
    """
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        
        # Overall commission stats
        stats = {
            'total_commission': 0,
            'pending_commission': 0,
            'settled_commission': 0,
            'total_orders_with_commission': 0
        }
        
        # Total commission from orders
        cursor.execute("SELECT SUM(commission_amount) as total FROM commissions WHERE status='Settled'")
        res = cursor.fetchone()
        if res and res.get('total'): 
            stats['settled_commission'] = float(res['total']) or 0
        
        cursor.execute("SELECT SUM(commission_amount) as total FROM commissions WHERE status='Pending'")
        res = cursor.fetchone()
        if res and res.get('total'): 
            stats['pending_commission'] = float(res['total']) or 0
        
        stats['total_commission'] = stats['settled_commission'] + stats['pending_commission']
        
        cursor.execute("SELECT COUNT(*) as count FROM commissions")
        res = cursor.fetchone()
        if res: 
            stats['total_orders_with_commission'] = res['count'] or 0
        
        # Commission breakdown by vendor
        cursor.execute("""
            SELECT v.vendor_id, v.company_name, 
                   SUM(CASE WHEN c.status='Settled' THEN c.commission_amount ELSE 0 END) as settled,
                   SUM(CASE WHEN c.status='Pending' THEN c.commission_amount ELSE 0 END) as pending,
                   COUNT(c.commission_id) as orders
            FROM commissions c
            JOIN Vendors v ON c.vendor_id = v.vendor_id
            GROUP BY v.vendor_id, v.company_name
            ORDER BY settled DESC
        """)
        vendor_breakdown = cursor.fetchall()
        
        # Recent commissions
        cursor.execute("""
            SELECT c.commission_id, c.commission_amount, c.commission_rate, c.status,
                   v.company_name, o.order_id, c.created_at
            FROM commissions c
            JOIN Vendors v ON c.vendor_id = v.vendor_id
            JOIN Orders o ON c.order_id = o.order_id
            ORDER BY c.created_at DESC
            LIMIT 20
        """)
        recent_commissions = cursor.fetchall()
        
        cursor.close()
        return {
            "status": "success", 
            "stats": stats,
            "vendor_breakdown": vendor_breakdown,
            "recent_commissions": recent_commissions
        }
    finally:
        conn.close()

# ===== CONTACT MESSAGES =====

@router.get("/contact_messages")
def get_contact_messages(user = Depends(check_admin)):
    """Get all contact form messages"""
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        
        # Ensure the table exists
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS contactmessages (
                message_id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) NOT NULL,
                message TEXT NOT NULL,
                status ENUM('Unread','Read','Replied') DEFAULT 'Unread',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
        
        cursor.execute("""
            SELECT message_id, name, email, message, status,
                   DATE_FORMAT(created_at, '%d %b %Y %H:%i') as date
            FROM contactmessages
            ORDER BY created_at DESC
        """)
        messages = cursor.fetchall()
        
        # Get counts
        cursor.execute("SELECT COUNT(*) as c FROM contactmessages WHERE status='Unread'")
        res = cursor.fetchone()
        unread_count = res['c'] if res else 0
        
        cursor.execute("SELECT COUNT(*) as c FROM contactmessages")
        res = cursor.fetchone()
        total_count = res['c'] if res else 0
        
        cursor.close()
        return {
            "status": "success",
            "messages": messages,
            "unread_count": unread_count,
            "total_count": total_count
        }
    except Exception as e:
        print(f"Error fetching contact messages: {str(e)}")
        return {"status": "error", "message": str(e), "messages": [], "unread_count": 0, "total_count": 0}
    finally:
        conn.close()

class ContactStatusUpdate(BaseModel):
    message_id: int
    status: str

@router.post("/contact_messages/update_status")
def update_contact_status(data: ContactStatusUpdate, user = Depends(check_admin)):
    """Update contact message status (Unread, Read, Replied)"""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE contactmessages SET status=%s WHERE message_id=%s",
            (data.status, data.message_id)
        )
        conn.commit()
        cursor.close()
        return {"status": "success"}
    finally:
        conn.close()

class ContactReply(BaseModel):
    message_id: int
    reply: str

@router.post("/contact_messages/reply")
def reply_to_contact(data: ContactReply, user = Depends(check_admin)):
    """Reply to a contact message - sends branded email to user"""
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        
        # Get the original message
        cursor.execute(
            "SELECT name, email, message FROM contactmessages WHERE message_id=%s",
            (data.message_id,)
        )
        msg = cursor.fetchone()
        
        if not msg:
            raise HTTPException(status_code=404, detail="Message not found")
        
        # Send official reply email
        send_contact_reply(msg['name'], msg['email'], msg['message'], data.reply)
        
        # Update status to Replied
        cursor.execute(
            "UPDATE contactmessages SET status='Replied' WHERE message_id=%s",
            (data.message_id,)
        )
        conn.commit()
        cursor.close()
        
        return {"status": "success", "message": f"Reply sent to {msg['email']}"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


# ===== WEEKLY COMMISSION INVOICES (Admin) =====

@router.get("/weekly_invoices")
def get_all_weekly_invoices(user = Depends(check_admin)):
    """Admin view: All vendor weekly commission invoices."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT i.invoice_id, u.name as vendor_name, v.company_name,
                   i.amount, i.status,
                   DATE_FORMAT(i.billing_period_start, '%d %b %Y') as period_start,
                   DATE_FORMAT(i.billing_period_end, '%d %b %Y') as period_end,
                   DATE_FORMAT(i.due_date, '%d %b %Y') as due_date,
                   v.commission_strikes,
                   EXISTS(SELECT 1 FROM Users u2 WHERE u2.user_id = v.vendor_id AND u2.is_blocked = 1) as is_blocked
            FROM weekly_invoices i
            JOIN Vendors v ON i.vendor_id = v.vendor_id
            JOIN Users u ON v.vendor_id = u.user_id
            ORDER BY i.created_at DESC
        """)
        invoices = cursor.fetchall()

        # Summary stats
        cursor.execute("SELECT SUM(amount) as total FROM weekly_invoices WHERE status='Unpaid'")
        res = cursor.fetchone()
        outstanding = float(res['total'] or 0)

        cursor.execute("SELECT SUM(amount) as total FROM weekly_invoices WHERE status='Paid'")
        res = cursor.fetchone()
        collected = float(res['total'] or 0)

        cursor.close()
        return {
            "status": "success",
            "invoices": invoices,
            "outstanding": outstanding,
            "collected": collected
        }
    finally:
        conn.close()

@router.post("/enforce_commission_penalties")
def run_penalty_enforcement(user = Depends(check_admin)):
    """Manually trigger penalty enforcement for overdue invoices."""
    from commission_invoicing import enforce_penalties
    try:
        enforce_penalties()
        return {"status": "success", "message": "Penalty enforcement complete."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate_weekly_invoices")
def run_invoice_generation(user = Depends(check_admin)):
    """Manually trigger weekly invoice generation."""
    from commission_invoicing import generate_weekly_invoices
    try:
        generate_weekly_invoices()
        return {"status": "success", "message": "Weekly invoices generated."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@router.post("/pay_later/check_overdue")
def run_pay_later_check(user = Depends(check_admin)):
    """Manually trigger check for overdue pay later orders."""
    from credit_system import check_overdue_orders
    try:
        actions = check_overdue_orders()
        return {"status": "success", "message": f"Credit check complete. Actions taken: {len(actions)}", "actions": actions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
