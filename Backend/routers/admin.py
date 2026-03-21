from fastapi import APIRouter, Depends, HTTPException, Request
from database import get_db_connection
from routers.auth import get_current_user_from_cookie
from pydantic import BaseModel
from typing import Optional

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
            'total_revenue': 0
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
            "SELECT c.customer_id, u.name, u.email, u.phone, c.verification_status "
            "FROM Customers c JOIN Users u ON c.customer_id = u.user_id"
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
        cursor = conn.cursor()
        # Validate QC score is between 0-100
        qc_score = max(0, min(100, data.qc_score))
        cursor.execute(
            "UPDATE Vendors SET verification_status=%s, qc_score=%s WHERE vendor_id=%s", 
            (data.verification_status, qc_score, data.vendor_id)
        )
        conn.commit()
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
               o.order_type, o.amount, o.status, DATE_FORMAT(o.created_at, '%d %M %Y') as date
        FROM Orders o
        JOIN Customers c ON o.customer_id = c.customer_id
        JOIN Users u_cust ON c.customer_id = u_cust.user_id
        JOIN Vendors v ON o.vendor_id = v.vendor_id
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
        
        cursor.execute("SELECT COUNT(*) as c FROM Payments WHERE status='Pending'")
        res = cursor.fetchone()
        if res: stats['pending'] = res['c'] or 0
        
        cursor.execute("SELECT COUNT(*) as c FROM Payments WHERE status='Completed'")
        res = cursor.fetchone()
        if res: stats['completed'] = res['c'] or 0
        
        # Fixed columns: transaction_date instead of payment_date, txn_id instead of payment_id
        sql = """
        SELECT DATE_FORMAT(p.transaction_date, '%d %b %Y') as date, p.txn_id, u_cust.name as customer_name,
               v.company_name as vendor_name, p.amount, p.status
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
