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

@router.get("/dashboard")
def dashboard(user = Depends(check_vendor)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        vendor_id = user['user_id']
        
        stats = {'catalogue_size': 0, 'pending_orders': 0, 'total_earnings': 0, 'verification_status': 'Pending'}
        
        cursor.execute("SELECT verification_status FROM Vendors WHERE vendor_id=%s", (vendor_id,))
        res = cursor.fetchone()
        if res: stats['verification_status'] = res['verification_status']
        
        cursor.execute("SELECT (SELECT COUNT(*) FROM Products WHERE vendor_id=%s) + (SELECT COUNT(*) FROM Services WHERE vendor_id=%s) as c", (vendor_id, vendor_id))
        res = cursor.fetchone()
        if res: stats['catalogue_size'] = res['c'] or 0
        
        cursor.execute("SELECT COUNT(*) as c FROM Orders WHERE vendor_id=%s AND status='Pending'", (vendor_id,))
        res = cursor.fetchone()
        if res: stats['pending_orders'] = res['c'] or 0
        
        cursor.execute("SELECT SUM(amount) as s FROM Orders WHERE vendor_id=%s AND status='Completed'", (vendor_id,))
        res = cursor.fetchone()
        if res: stats['total_earnings'] = res['s'] or 0
        
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
        
        cursor.execute("SELECT product_id as id, 'product' as type, name, description, price, image_url, unit FROM Products WHERE vendor_id=%s", (vendor_id,))
        for row in cursor.fetchall():
            items.append(row)
            
        cursor.execute("SELECT service_id as id, 'service' as type, name, description, price, image_url, unit FROM Services WHERE vendor_id=%s", (vendor_id,))
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
    image_url: str = Form(""),
    unit: str = Form(""),
    user = Depends(check_vendor)
):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        vendor_id = user['user_id']
        
        if item_type == 'product':
            cursor.execute("INSERT INTO Products (vendor_id, category, name, description, price, image_url, unit) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                           (vendor_id, 'General', name, description, price, image_url, unit))
        else:
            cursor.execute("INSERT INTO Services (vendor_id, category, name, description, price, image_url, unit) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                           (vendor_id, 'General', name, description, price, image_url, unit))
                           
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
    image_url: str = Form(""),
    unit: str = Form(""),
    user = Depends(check_vendor)
):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        vendor_id = user['user_id']
        
        if item_type == 'product':
            cursor.execute(
                "UPDATE Products SET name=%s, description=%s, price=%s, image_url=%s, unit=%s WHERE product_id=%s AND vendor_id=%s",
                (name, description, price, image_url, unit, item_id, vendor_id)
            )
        else:
            cursor.execute(
                "UPDATE Services SET name=%s, description=%s, price=%s, image_url=%s, unit=%s WHERE service_id=%s AND vendor_id=%s",
                (name, description, price, image_url, unit, item_id, vendor_id)
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
            SELECT o.order_id, u.name as customer_name, o.order_type, o.amount, o.status, o.delivery_address, o.payment_method, DATE_FORMAT(o.created_at, '%d %b %Y') as date 
            FROM Orders o
            JOIN Customers c ON o.customer_id = c.customer_id
            JOIN Users u ON c.customer_id = u.user_id
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
        
        # Ensure 'Delivered' is in the status enum
        try:
            cursor.execute("ALTER TABLE Orders MODIFY COLUMN status ENUM('Pending','Processing','Completed','Cancelled','Delivered') DEFAULT 'Pending'")
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
