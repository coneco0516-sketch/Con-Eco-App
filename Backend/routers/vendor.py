from fastapi import APIRouter, Depends, HTTPException, Request, Form, File, UploadFile
from pydantic import BaseModel
from database import get_db_connection
from routers.auth import get_current_user_from_cookie
import datetime
import os
import uuid
from pathlib import Path

router = APIRouter()

def check_vendor(user = Depends(get_current_user_from_cookie)):
    if user['role'] != 'Vendor':
        raise HTTPException(status_code=403, detail="Forbidden")
    return user

def auto_categorize(name, description, item_type):
    text = (name + " " + (description or "")).lower()
    if item_type == 'product':
        if any(w in text for w in ['cement', 'konark', 'acc', 'ultratech', 'dalmia', 'jk super', 'birla']): return 'Cement'
        if any(w in text for w in ['steel', 'rebar', 'iron rod', 'tata tiscon', 'jindal', 'tmt bar']): return 'Steel'
        if any(w in text for w in ['brick', 'block', 'interlock', 'fly ash', 'clay brick']): return 'Bricks'
        if any(w in text for w in ['sand', 'aggregate', 'stone', 'crush', 'm-sand', 'river sand', 'gravel']): return 'Sand'
        if any(w in text for w in ['wire', 'switch', 'cable', 'light', 'electric', 'mcb', 'conduit', 'socket']): return 'Electrical'
        if any(w in text for w in ['pipe', 'tap', 'faucet', 'plumbing', 'pvc', 'cpvc', 'tank', 'valve', 'fixture', 'basin', 'commode']): return 'Plumbing'
    else:
        if any(w in text for w in ['labor', 'worker', 'mason', 'helper', 'contractor', 'painter', 'carpenter', 'tiles fitter']): return 'Labor'
        if any(w in text for w in ['pipe', 'tap', 'plumbing', 'leak', 'drainage', 'sanitary']): return 'Plumbing'
        if any(w in text for w in ['wire', 'electric', 'short', 'circuit', 'wiring', 'installation']): return 'Electrical'
        if any(w in text for w in ['design', 'architecture', 'blueprint', 'plan', 'structure', 'elevation', 'drawing']): return 'Architecture'
    return 'General'

@router.get("/dashboard")
def dashboard(user = Depends(check_vendor)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        vendor_id = user['user_id']
        
        stats = {'catalogue_size': 0, 'pending_orders': 0, 'total_earnings': 0, 'verification_status': 'Pending', 'commission_strikes': 0, 'outstanding_commission': 0}
        
        cursor.execute("SELECT verification_status, commission_strikes FROM Vendors WHERE vendor_id=%s", (vendor_id,))
        res = cursor.fetchone()
        if res: 
            stats['verification_status'] = res['verification_status']
            stats['commission_strikes'] = res['commission_strikes']
        
        cursor.execute("SELECT (SELECT COUNT(*) FROM Products WHERE vendor_id=%s) + (SELECT COUNT(*) FROM Services WHERE vendor_id=%s) as c", (vendor_id, vendor_id))
        res = cursor.fetchone()
        if res: stats['catalogue_size'] = res['c'] or 0
        
        cursor.execute("SELECT COUNT(*) as c FROM Orders WHERE vendor_id=%s AND status='Pending'", (vendor_id,))
        res = cursor.fetchone()
        if res: stats['pending_orders'] = res['c'] or 0
        
        cursor.execute("SELECT SUM(amount) as s FROM Orders WHERE vendor_id=%s AND status='Completed'", (vendor_id,))
        res = cursor.fetchone()
        if res: stats['total_earnings'] = res['s'] or 0
        
        # Outstanding COD Invoices
        cursor.execute("SELECT SUM(amount) as total FROM weekly_invoices WHERE vendor_id=%s AND status='Unpaid'", (vendor_id,))
        res = cursor.fetchone()
        stats['outstanding_commission'] = res['total'] or 0.0

        cursor.close()
        return {"status": "success", "stats": stats}
    finally:
        conn.close()

@router.get("/catalogue")
def catalogue(user = Depends(check_vendor)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        vendor_id = user['user_id']
        
        items = []
        
        cursor.execute("SELECT product_id as id, 'product' as type, name, description, price, category, image_url, unit FROM Products WHERE vendor_id=%s", (vendor_id,))
        for row in cursor.fetchall():
            items.append(row)
            
        cursor.execute("SELECT service_id as id, 'service' as type, name, description, price, category, image_url, unit FROM Services WHERE vendor_id=%s", (vendor_id,))
        for row in cursor.fetchall():
            items.append(row)
            
        cursor.close()
        return {"status": "success", "items": items}
    finally:
        conn.close()

UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

@router.post("/upload_image")
async def upload_image(file: UploadFile = File(...), user = Depends(check_vendor)):
    try:
        # Create unique filename
        file_extension = os.path.splitext(file.filename)[1]
        new_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = UPLOAD_DIR / new_filename
        
        # Save file
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
            
        # Return the public URL
        return {"status": "success", "image_url": f"/uploads/{new_filename}"}
    except Exception as e:
        print(f"Error uploading image: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload image")

@router.post("/catalogue")
def add_catalogue_item(
    item_type: str = Form(...),
    name: str = Form(...),
    description: str = Form(...),
    price: float = Form(...),
    category: str = Form("General"),
    image_url: str = Form(""),
    unit: str = Form(""),
    user = Depends(check_vendor)
):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        vendor_id = user['user_id']
        
        # Auto-categorize if General is provided
        if category == 'General':
            category = auto_categorize(name, description, item_type)
            
        if item_type == 'product':
            cursor.execute("INSERT INTO Products (vendor_id, category, name, description, price, image_url, unit) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                           (vendor_id, category, name, description, price, image_url, unit))
        else:
            cursor.execute("INSERT INTO Services (vendor_id, category, name, description, price, image_url, unit) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                           (vendor_id, category, name, description, price, image_url, unit))
                           
        conn.commit()
        cursor.close()
        return {"status": "success"}
    except Exception as e:
        print(f"Error adding to catalogue: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.put("/catalogue")
def update_catalogue_item(
    item_id: int = Form(...),
    item_type: str = Form(...),
    name: str = Form(...),
    description: str = Form(...),
    price: float = Form(...),
    category: str = Form("General"),
    image_url: str = Form(""),
    unit: str = Form(""),
    user = Depends(check_vendor)
):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        vendor_id = user['user_id']
        
        # Auto-categorize if General is provided
        if category == 'General':
            category = auto_categorize(name, description, item_type)
            
        if item_type == 'product':
            cursor.execute(
                "UPDATE Products SET name=%s, description=%s, price=%s, category=%s, image_url=%s, unit=%s WHERE product_id=%s AND vendor_id=%s",
                (name, description, price, category, image_url, unit, item_id, vendor_id)
            )
        else:
            cursor.execute(
                "UPDATE Services SET name=%s, description=%s, price=%s, category=%s, image_url=%s, unit=%s WHERE service_id=%s AND vendor_id=%s",
                (name, description, price, category, image_url, unit, item_id, vendor_id)
            )
                           
        conn.commit()
        cursor.close()
        return {"status": "success"}
    except Exception as e:
        print(f"Error updating catalogue item: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.delete("/catalogue")
def delete_catalogue_item(id: int, type: str, user = Depends(check_vendor)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        vendor_id = user['user_id']
        
        if type == 'product':
            cursor.execute("DELETE FROM Products WHERE product_id=%s AND vendor_id=%s", (id, vendor_id))
        else:
            cursor.execute("DELETE FROM Services WHERE service_id=%s AND vendor_id=%s", (id, vendor_id))
            
        conn.commit()
        cursor.close()
        return {"status": "success"}
    finally:
        conn.close()

@router.get("/orders")
def vendor_orders(user = Depends(check_vendor)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        vendor_id = user['user_id']
        
        stats = { 'total': 0, 'pending': 0, 'completed': 0, 'cancelled': 0 }
        
        cursor.execute("SELECT status, COUNT(*) as c FROM Orders WHERE vendor_id=%s GROUP BY status", (vendor_id,))
        for row in cursor.fetchall():
            stats['total'] += row['c']
            st = row['status'].lower()
            if st in stats: stats[st] = row['c']
            
        sql = """
            SELECT o.order_id, u.name as customer_name, o.order_type, o.amount, o.status, 
                   o.delivery_address, o.payment_method, o.pay_later_stage, 
                   DATE_FORMAT(o.pay_later_due_date, '%d %b %Y') as pay_later_due_date, 
                   DATE_FORMAT(o.pay_later_stage2_due, '%d %b %Y') as pay_later_stage2_due, 
                   DATE_FORMAT(o.pay_later_stage3_due, '%d %b %Y') as pay_later_stage3_due,
                   COALESCE(cs.credit_score, 100) as customer_credit_score,
                   DATE_FORMAT(o.created_at, '%d %b %Y') as date 
            FROM Orders o
            JOIN Customers c ON o.customer_id = c.customer_id
            JOIN Users u ON c.customer_id = u.user_id
            LEFT JOIN credit_scores cs ON o.customer_id = cs.customer_id
            WHERE o.vendor_id=%s
            ORDER BY o.created_at DESC
        """
        cursor.execute(sql, (vendor_id,))
        orders = cursor.fetchall()
        
        cursor.close()
        return {"status": "success", "stats": stats, "orders": orders}
    finally:
        conn.close()

from credit_system import set_pay_later_timeline

class OrderStatusUpdate(BaseModel):
    order_id: int
    status: str

@router.post("/orders/update_status")
def vendor_update_order(data: OrderStatusUpdate, user = Depends(check_vendor)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        vendor_id = user['user_id']
        
        # Ensure 'Delivered', 'Shipped', 'Out for Delivery' are in the status enum
        try:
            cursor.execute("ALTER TABLE Orders MODIFY COLUMN status ENUM('Pending','Processing','Shipped','Out for Delivery','Completed','Cancelled','Delivered') DEFAULT 'Pending'")
            conn.commit()
        except:
            pass
        
        cursor.execute("UPDATE Orders SET status=%s WHERE order_id=%s AND vendor_id=%s", (data.status, data.order_id, vendor_id))
        
        if data.status == 'Completed':
            cursor.execute("UPDATE Payments SET status='Completed' WHERE order_id=%s", (data.order_id,))
        elif data.status == 'Cancelled':
            cursor.execute("UPDATE Payments SET status='Failed' WHERE order_id=%s", (data.order_id,))
        elif data.status == 'Delivered':
            # Check if this is a Pay Later order → trigger timeline
            cursor.execute("SELECT payment_method, customer_id FROM Orders WHERE order_id=%s", (data.order_id,))
            order = cursor.fetchone()
            if order and order['payment_method'] == 'Pay Later':
                conn.commit()
                set_pay_later_timeline(data.order_id)
            
        conn.commit()
        cursor.close()
        return {"status": "success"}
    except Exception as e:
        conn.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        conn.close()


@router.get("/earnings")
def vendor_earnings(user = Depends(check_vendor)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        vendor_id = user['user_id']
        
        stats = { 'total': 0, 'this_month': 0, 'pending': 0 }
        
        cursor.execute("SELECT SUM(amount) as s FROM Orders WHERE vendor_id=%s AND status='Completed'", (vendor_id,))
        res = cursor.fetchone()
        if res: stats['total'] = res['s'] or 0
        
        # Simple workaround for SQLite or MySQL generic date handling
        # Let's standardly map mysql
        cursor.execute("SELECT SUM(amount) as s FROM Orders WHERE vendor_id=%s AND status='Completed' AND MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE())", (vendor_id,))
        res = cursor.fetchone()
        if res: stats['this_month'] = res['s'] or 0
        
        cursor.execute("SELECT SUM(amount) as s FROM Orders WHERE vendor_id=%s AND status='Pending'", (vendor_id,))
        res = cursor.fetchone()
        if res: stats['pending'] = res['s'] or 0
        
        sql = """
            SELECT DATE_FORMAT(p.transaction_date, '%d %b %Y') as date, o.order_id, o.order_type, p.amount, p.status
            FROM Payments p
            JOIN Orders o ON p.order_id = o.order_id
            WHERE o.vendor_id=%s
            ORDER BY p.transaction_date DESC
        """
        cursor.execute(sql, (vendor_id,))
        transactions = cursor.fetchall()
        
        cursor.close()
        return {"status": "success", "stats": stats, "transactions": transactions}
    finally:
        conn.close()

@router.get("/invoices")
def get_invoices(user = Depends(check_vendor)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        vendor_id = user['user_id']
        
        cursor.execute("""
            SELECT invoice_id, amount, status, 
                   DATE_FORMAT(billing_period_start, '%d %b %Y') as start, 
                   DATE_FORMAT(billing_period_end, '%d %b %Y') as end, 
                   DATE_FORMAT(due_date, '%d %b %Y') as due 
            FROM weekly_invoices 
            WHERE vendor_id = %s 
            ORDER BY created_at DESC
        """, (vendor_id,))
        invoices = cursor.fetchall()
        
        cursor.close()
        return {"status": "success", "invoices": invoices}
    finally:
        conn.close()
