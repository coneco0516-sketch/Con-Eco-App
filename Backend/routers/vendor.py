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
        
        # Count gross sales for all orders with successful payments OR completed status
        cursor.execute("""
            SELECT SUM(o.amount) as s 
            FROM Orders o 
            LEFT JOIN Payments p ON o.order_id = p.order_id 
            WHERE o.vendor_id=%s AND (o.status='Completed' OR p.status IN ('Completed', 'Paid'))
        """, (vendor_id,))
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
        # Removed heavy data repair join from global GET - moved to update step for efficiency
        cursor.execute("SELECT status, COUNT(*) as c FROM Orders WHERE vendor_id=%s GROUP BY status", (vendor_id,))
        for row in cursor.fetchall():
            stats['total'] += row['c']
            st = row['status'].lower()
            if st in stats: stats[st] = row['c']
            
        sql = """
            SELECT o.order_id, u.name as customer_name, u.phone as customer_phone, o.order_type, o.amount, o.base_amount, o.status, 
                   o.delivery_address, o.payment_method, o.pay_later_stage, pvt.status as payment_status,
                   DATE_FORMAT(o.pay_later_due_date, '%d %b %Y') as pay_later_due_date, 
                   DATE_FORMAT(o.pay_later_stage2_due, '%d %b %Y') as pay_later_stage2_due, 
                   DATE_FORMAT(o.pay_later_stage3_due, '%d %b %Y') as pay_later_stage3_due,
                   COALESCE(cs.credit_score, 100) as customer_credit_score,
                   DATE_FORMAT(o.created_at, '%d %b %Y') as date 
            FROM Orders o
            JOIN Customers c ON o.customer_id = c.customer_id
            JOIN Users u ON c.customer_id = u.user_id
            JOIN Payments pvt ON o.order_id = pvt.order_id
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
        
        cursor.execute("SELECT payment_method, customer_id, delivered_at FROM Orders WHERE order_id=%s", (data.order_id,))
        order = cursor.fetchone()

        cursor.execute("UPDATE Orders SET status=%s WHERE order_id=%s AND vendor_id=%s", (data.status, data.order_id, vendor_id))
        
        if data.status in ['Completed', 'Delivered']:
            if data.status == 'Completed' and order and order['payment_method'] not in ['COD', 'Pay Later (Cash)']:
                # For non-cash orders, mark payment as Completed when order is Completed
                cursor.execute("UPDATE Payments SET status='Completed' WHERE order_id=%s", (data.order_id,))
                
            if data.status == 'Delivered' and order and order['payment_method'].startswith('Pay Later') and order['delivered_at'] is None:
                # Rule: Timeline triggers
                conn.commit()
                set_pay_later_timeline(data.order_id)
                
        if data.status == 'Cancelled':
            cursor.execute("UPDATE Payments SET status='Failed' WHERE order_id=%s", (data.order_id,))
        elif data.status not in ['Completed', 'Delivered']:
            # If moved back to an active state (Pending, Processing, Shipped), 
            # and it's a cash order, allow the vendor to "Undo" a manual 'Paid' mark.
            if order and order['payment_method'] in ['COD', 'Pay Later (Cash)']:
                cursor.execute("UPDATE Payments SET status='Pending' WHERE order_id=%s", (data.order_id,))
            
            # Universal repair: If turning from Cancelled to anything else, reset payment status to Pending
            cursor.execute("UPDATE Payments SET status='Pending' WHERE order_id=%s AND status IN ('Failed', 'Cancelled')", (data.order_id,))
            
        conn.commit()
        cursor.close()
        return {"status": "success"}
    except Exception as e:
        conn.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        conn.close()


class PaymentStatusUpdate(BaseModel):
    order_id: int
    status: str

@router.post("/orders/update_payment_status")
def vendor_update_payment_status(data: PaymentStatusUpdate, user = Depends(check_vendor)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        vendor_id = user['user_id']
        
        cursor.execute("SELECT payment_method FROM Orders WHERE order_id=%s AND vendor_id=%s", (data.order_id, vendor_id))
        order = cursor.fetchone()
        
        if not order:
            return {"status": "error", "message": "Order not found or no permission"}
            
        if order['payment_method'] not in ['COD', 'Pay Later (Cash)']:
            return {"status": "error", "message": "Only Cash/Offline orders can have their payment status updated manually."}
            
        cursor.execute("UPDATE Payments SET status=%s WHERE order_id=%s", (data.status, data.order_id))
        
        # If it's a Pay Later order and marked as Completed/Paid, also update the order record
        if data.status == 'Completed' and order['payment_method'] == 'Pay Later (Cash)':
            cursor.execute("UPDATE Orders SET pay_later_stage='Completed' WHERE order_id=%s", (data.order_id,))
            
        conn.commit()
        return {"status": "success"}
    except Exception as e:
        conn.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        cursor.close()
        conn.close()

class WithdrawRequest(BaseModel):
    amount: float
    account_name: str
    account_number: str
    ifsc: str

@router.post("/withdraw")
def vendor_withdraw(data: WithdrawRequest, user = Depends(check_vendor)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        vendor_id = user['user_id']
        
        cursor.execute("SELECT wallet_balance FROM Vendors WHERE vendor_id=%s", (vendor_id,))
        res = cursor.fetchone()
        bal = res['wallet_balance'] if res and res['wallet_balance'] else 0
        
        if bal < data.amount or data.amount <= 0:
            return {"status": "error", "message": "Insufficient wallet balance"}
            
        try:
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS Payouts (
                payout_id INT AUTO_INCREMENT PRIMARY KEY,
                vendor_id INT,
                amount DECIMAL(10,2),
                account_name VARCHAR(100),
                account_number VARCHAR(100),
                ifsc VARCHAR(50),
                status ENUM('Pending', 'Completed', 'Rejected') DEFAULT 'Pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (vendor_id) REFERENCES Vendors(vendor_id)
            )
            """)
        except:
            pass
        
        cursor.execute("UPDATE Vendors SET wallet_balance = wallet_balance - %s WHERE vendor_id=%s", (data.amount, vendor_id))
        
        cursor.execute("INSERT INTO Payouts (vendor_id, amount, account_name, account_number, ifsc) VALUES (%s, %s, %s, %s, %s)",
                       (vendor_id, data.amount, data.account_name, data.account_number, data.ifsc))
        conn.commit()
        return {"status": "success"}
    except Exception as e:
        conn.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        cursor.close()
        conn.close()

@router.get("/earnings")
def vendor_earnings(user = Depends(check_vendor)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        vendor_id = user['user_id']
        
        stats = {
            'online_total': 0,
            'cod_total': 0,
            'pending_online': 0,
            'pending_cod': 0,
            'cod_net': 0,
            'total_net': 0,
            'total_gross': 0,
            'total': 0
        }
        
        # 0. Data Repair: If any orders are missing payment_method (due to the old bug), 
        # assume they are COD if they were placed via the offline flow.
        cursor.execute("UPDATE Orders SET payment_method='COD' WHERE payment_method IS NULL AND vendor_id=%s", (vendor_id,))
        conn.commit()

        # 1. Withdrawable (Online) - strict wallet balance
        cursor.execute("SELECT wallet_balance FROM Vendors WHERE vendor_id=%s", (vendor_id,))
        v_res = cursor.fetchone()
        stats['online_total'] = float(v_res['wallet_balance']) if v_res and v_res['wallet_balance'] else 0
        
        # 2. Collected Offline (COD)
        cursor.execute("""
            SELECT SUM(p.amount) as s 
            FROM Orders o 
            JOIN Payments p ON o.order_id = p.order_id 
            WHERE o.vendor_id=%s AND p.status IN ('Completed', 'Paid') AND o.payment_method IN ('COD', 'Pay Later (Cash)')
        """, (vendor_id,))
        cod_res = cursor.fetchone()
        stats['cod_total'] = float(cod_res['s']) if cod_res and cod_res['s'] else 0
        
        # 3. Pending Online (Not credited yet / needs admin audit)
        cursor.execute("""
            SELECT SUM(o.base_amount) as s 
            FROM Orders o 
            JOIN Payments p ON o.order_id = p.order_id
            WHERE o.vendor_id=%s AND o.payment_method NOT IN ('COD', 'Pay Later (Cash)') AND COALESCE(o.vendor_credited, 0) = 0 AND p.status='Completed'
        """, (vendor_id,))
        ponline = cursor.fetchone()
        stats['pending_online'] = float(ponline['s']) if ponline and ponline['s'] else 0
        
        # 4. Pending COD (Not collected yet)
        cursor.execute("""
            SELECT SUM(p.amount) as s 
            FROM Orders o 
            JOIN Payments p ON o.order_id = p.order_id 
            WHERE o.vendor_id=%s AND p.status NOT IN ('Completed', 'Paid') AND o.payment_method IN ('COD', 'Pay Later (Cash)')
        """, (vendor_id,))
        pcod = cursor.fetchone()
        stats['pending_cod'] = float(pcod['s']) if pcod and pcod['s'] else 0
        
        # Calculate Net COD (Subtracting commission)
        cursor.execute("""
            SELECT SUM(o.base_amount) as s 
            FROM Orders o 
            JOIN Payments p ON o.order_id = p.order_id 
            WHERE o.vendor_id=%s AND p.status IN ('Completed', 'Paid') AND o.payment_method IN ('COD', 'Pay Later (Cash)')
        """, (vendor_id,))
        cod_net_res = cursor.fetchone()
        stats['cod_net'] = float(cod_net_res['s']) if cod_net_res and cod_net_res['s'] else 0
        
        # Total for the stats panel
        stats['total_net'] = stats['online_total'] + stats['cod_net']
        
        # Count gross sales for all orders with successful payments OR completed status
        cursor.execute("""
            SELECT SUM(o.amount) as s 
            FROM Orders o 
            LEFT JOIN Payments p ON o.order_id = p.order_id 
            WHERE o.vendor_id=%s AND (o.status='Completed' OR p.status IN ('Completed', 'Paid'))
        """, (vendor_id,))
        gross_res = cursor.fetchone()
        stats['total_gross'] = float(gross_res['s']) if gross_res and gross_res['s'] else 0
        
        # For backward compatibility with the frontend if it uses 'total'
        stats['total'] = stats['total_gross']
        
        try:
            cursor.execute("CREATE TABLE IF NOT EXISTS Payouts (payout_id INT AUTO_INCREMENT PRIMARY KEY, vendor_id INT, amount DECIMAL(10,2), account_name VARCHAR(100), account_number VARCHAR(100), ifsc VARCHAR(50), status ENUM('Pending', 'Completed', 'Rejected') DEFAULT 'Pending', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (vendor_id) REFERENCES Vendors(vendor_id))")
            conn.commit()
        except:
            pass
            
        sql_payments = """
            SELECT DATE_FORMAT(o.created_at, '%%d %%b %%Y') as date, 
                   CONCAT('Order #', o.order_id) as description, 
                   p.amount as gross,
                   (o.amount - o.base_amount) as commission,
                   o.base_amount as net,
                   p.status,
                   o.created_at as raw_date
            FROM Payments p
            JOIN Orders o ON p.order_id = o.order_id
            WHERE o.vendor_id=%s 
              AND (o.payment_method IN ('COD', 'Pay Later (Cash)') OR COALESCE(o.vendor_credited, False) = True)
        """
        
        sql_payouts = """
            SELECT DATE_FORMAT(created_at, '%%d %%b %%Y') as date,
                   'Bank Withdrawal' as description,
                   amount as gross,
                   0 as commission,
                   -amount as net,
                   status,
                   created_at as raw_date
            FROM Payouts
            WHERE vendor_id=%s
        """
        
        sql_combined = """
            SELECT * FROM (
                " + sql_payments + "
                UNION ALL
                " + sql_payouts + "
            ) as combined
            ORDER BY raw_date DESC
        """
        cursor.execute(sql_combined, (vendor_id, vendor_id))
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
