from fastapi import APIRouter, Depends, HTTPException, Request, Form, File, UploadFile, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
from database import get_db_connection, get_platform_setting, get_all_platform_settings
from routers.auth import get_current_user_from_cookie
import datetime
import os
import uuid
from pathlib import Path

router = APIRouter()

def check_vendor(user = Depends(get_current_user_from_cookie)):
    if user['role'] != 'Vendor':
        raise HTTPException(status_code=403, detail=f"Access denied: {user['role']} role cannot manage catalogue.")
    
    # Optional: Check verification status if you want to restrict unverified vendors
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT verification_status FROM Vendors WHERE vendor_id = %s", (user['user_id'],))
        vendor = cursor.fetchone()
        if vendor and vendor['verification_status'] == 'Blocked':
            raise HTTPException(status_code=403, detail="Forbidden: Your account has been blocked.")
        # If Pending, we allow them to add items so admin can review them
    finally:
        conn.close()
        
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
        
        cursor.execute("SELECT verification_status, commission_strikes FROM vendors WHERE vendor_id=%s", (vendor_id,))
        res = cursor.fetchone()
        if res: 
            stats['verification_status'] = res['verification_status']
            stats['commission_strikes'] = res['commission_strikes']
        
        # Ensure Vendor Wallet exists for this vendor
        cursor.execute("INSERT INTO vendorwallets (vendor_id, balance) VALUES (%s, 0.00) ON CONFLICT (vendor_id) DO NOTHING", (vendor_id,))
        conn.commit()
        
        cursor.execute("SELECT (SELECT COUNT(*) FROM Products WHERE vendor_id=%s) + (SELECT COUNT(*) FROM Services WHERE vendor_id=%s) as c", (vendor_id, vendor_id))
        res = cursor.fetchone()
        if res: stats['catalogue_size'] = res['c'] or 0
        
        # Include Bulk Requested in pending orders
        cursor.execute("SELECT COUNT(*) as c FROM Orders WHERE vendor_id=%s AND status IN ('Pending', 'Bulk Requested')", (vendor_id,))
        res = cursor.fetchone()
        if res: stats['pending_orders'] = res['c'] or 0
        
        # Count Net earnings (Base Amount)
        cursor.execute("""
            SELECT SUM(o.base_amount) as net, SUM(o.amount) as gross
            FROM Orders o 
            LEFT JOIN Payments p ON o.order_id = p.order_id 
            WHERE o.vendor_id=%s AND (o.status='Completed' OR p.status IN ('Completed', 'Paid'))
        """, (vendor_id,))
        res = cursor.fetchone()
        if res: 
            stats['total_earnings'] = float(res['net'] or 0)
            stats['total_gross'] = float(res['gross'] or 0)
        
        # Outstanding COD Invoices
        cursor.execute("SELECT SUM(amount) as total FROM weekly_invoices WHERE vendor_id=%s AND status='Unpaid'", (vendor_id,))
        res = cursor.fetchone()
        stats['outstanding_commission'] = float(res['total'] or 0)

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
        
        cursor.execute("SELECT product_id as id, 'product' as type, name, description, price, category, image_url, unit, brand, specifications, delivery_time FROM Products WHERE vendor_id=%s", (vendor_id,))
        for row in cursor.fetchall():
            items.append(row)
            
        cursor.execute("SELECT service_id as id, 'service' as type, name, description, price, category, image_url, unit, '' as brand, specifications, delivery_time FROM Services WHERE vendor_id=%s", (vendor_id,))
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
    brand: str = Form(""),
    specifications: str = Form(""),
    delivery_time: str = Form(""),
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
            cursor.execute("INSERT INTO Products (vendor_id, category, name, description, price, image_url, unit, brand, specifications, delivery_time) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
                           (vendor_id, category, name, description, price, image_url, unit, brand, specifications, delivery_time))
        else:
            cursor.execute("INSERT INTO Services (vendor_id, category, name, description, price, image_url, unit, specifications, delivery_time) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)",
                           (vendor_id, category, name, description, price, image_url, unit, specifications, delivery_time))
                           
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
    brand: str = Form(""),
    specifications: str = Form(""),
    delivery_time: str = Form(""),
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
                "UPDATE Products SET name=%s, description=%s, price=%s, category=%s, image_url=%s, unit=%s, brand=%s, specifications=%s, delivery_time=%s WHERE product_id=%s AND vendor_id=%s",
                (name, description, price, category, image_url, unit, brand, specifications, delivery_time, item_id, vendor_id)
            )
        else:
            cursor.execute(
                "UPDATE Services SET name=%s, description=%s, price=%s, category=%s, image_url=%s, unit=%s, specifications=%s, delivery_time=%s WHERE service_id=%s AND vendor_id=%s",
                (name, description, price, category, image_url, unit, specifications, delivery_time, item_id, vendor_id)
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
            SELECT o.order_id, u.name as customer_name, u.phone as customer_phone, o.order_type, 
                   o.amount, o.base_amount, o.status, 
                   o.payment_method, o.delivery_address, 
                   pvt.status as payment_status,
                   TO_CHAR(o.created_at, 'DD Mon YYYY') as date,
                   o.is_bulk_request, o.customer_message, o.vendor_message, o.negotiated_price, o.quantity
            FROM Orders o
            JOIN Customers c ON o.customer_id = c.customer_id
            JOIN Users u ON c.customer_id = u.user_id
            LEFT JOIN Payments pvt ON o.order_id = pvt.order_id
            WHERE o.vendor_id=%s
            ORDER BY o.created_at DESC
        """
        cursor.execute(sql, (vendor_id,))
        orders = cursor.fetchall()
        
        cursor.close()
        return {"status": "success", "stats": stats, "orders": orders}
    finally:
        conn.close()


class OrderStatusUpdate(BaseModel):
    order_id: int
    status: str

@router.post("/orders/update_status")
def vendor_update_order(data: OrderStatusUpdate, user = Depends(check_vendor), background_tasks: BackgroundTasks = None):
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        vendor_id = user['user_id']
        
        cursor.execute("SELECT payment_method, customer_id, delivered_at FROM Orders WHERE order_id=%s", (data.order_id,))
        order = cursor.fetchone()

        cursor.execute("UPDATE Orders SET status=%s WHERE order_id=%s AND vendor_id=%s", (data.status, data.order_id, vendor_id))
        
        if data.status in ['Completed', 'Delivered']:
            if data.status == 'Completed' and order and order['payment_method'] != 'COD':
                # For non-cash orders, mark payment as Completed when order is Completed
                cursor.execute("UPDATE Payments SET status='Completed' WHERE order_id=%s", (data.order_id,))
                
                
        if data.status == 'Cancelled':
            cursor.execute("UPDATE Payments SET status='Failed' WHERE order_id=%s", (data.order_id,))
        elif data.status not in ['Completed', 'Delivered']:
            # If moved back to an active state (Pending, Processing, Shipped), 
            # and it's a cash order, allow the vendor to "Undo" a manual 'Paid' mark.
            if order and order['payment_method'] == 'COD':
                cursor.execute("UPDATE Payments SET status='Pending' WHERE order_id=%s", (data.order_id,))
            
            # Universal repair: If turning from Cancelled to anything else, reset payment status to Pending
            cursor.execute("UPDATE Payments SET status='Pending' WHERE order_id=%s AND status IN ('Failed', 'Cancelled')", (data.order_id,))
            
        conn.commit()

        # ── SEND STATUS UPDATE EMAIL (Non-blocking) ──
        try:
            # Re-fetch order row for customer info
            cursor.execute("""
                SELECT u.name, u.email 
                FROM Orders o 
                JOIN Users u ON o.customer_id = u.user_id 
                WHERE o.order_id = %s
            """, (data.order_id,))
            cust_info = cursor.fetchone()
            if cust_info:
                from email_service import send_order_update
                if background_tasks:
                   background_tasks.add_task(send_order_update, cust_info['email'], cust_info['name'], data.order_id, data.status)
                else:
                   send_order_update(cust_info['email'], cust_info['name'], data.order_id, data.status)
        except Exception as e:
            print(f"[vendor/orders] Could not send status update email: {e}")

        cursor.close()
        return {"status": "success"}
    except Exception as e:
        conn.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        conn.close()

class BulkAction(BaseModel):
    order_id: int
    action: str # 'Accept' or 'Reject'
    negotiated_price: Optional[float] = None
    vendor_message: Optional[str] = None

@router.post("/orders/bulk_action")
def vendor_bulk_action(data: BulkAction, user = Depends(check_vendor), background_tasks: BackgroundTasks = None):
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        vendor_id = user['user_id']
        
        if data.action == 'Reject':
            cursor.execute("UPDATE Orders SET status='Cancelled', vendor_message=%s WHERE order_id=%s AND vendor_id=%s", (data.vendor_message, data.order_id, vendor_id))
            cursor.execute("UPDATE Payments SET status='Failed' WHERE order_id=%s", (data.order_id,))
        else:
            # Accept with a new price
            if data.negotiated_price is None:
                 return {"status": "error", "message": "Price is required to accept bulk request."}
            
            # Recalculate amounts
            cursor.execute("SELECT quantity, order_type FROM Orders WHERE order_id=%s", (data.order_id,))
            res = cursor.fetchone()
            qty = res['quantity'] if res else 1
            order_type = res.get('order_type', 'Product') if res else 'Product'
            
            base_amount = float(data.negotiated_price) * qty
            gst_amount = round(base_amount * 0.18, 2)
            
            comm_key = 'product_commission_pct' if order_type == 'Product' else 'service_commission_pct'
            commission_rate = float(get_platform_setting(comm_key, 3.0))
            
            commission_amount = round(base_amount * commission_rate / 100, 2)
            total_amount = round(base_amount + gst_amount + commission_amount, 2)
            
            cursor.execute("""
                UPDATE Orders 
                SET status='Pending', 
                    negotiated_price=%s, 
                    vendor_message=%s,
                    amount=%s,
                    base_amount=%s,
                    gst_amount=%s,
                    commission_amount=%s,
                    total_amount=%s
                WHERE order_id=%s AND vendor_id=%s
            """, (data.negotiated_price, data.vendor_message, total_amount, base_amount, gst_amount, commission_amount, total_amount, data.order_id, vendor_id))
            
            # Update commission entry
            cursor.execute("""
                UPDATE commissions 
                SET commission_amount=%s, commission_rate=%s 
                WHERE order_id=%s
            """, (commission_amount, commission_rate, data.order_id))
            
            # Also update the payment record
            cursor.execute("UPDATE Payments SET amount=%s WHERE order_id=%s", (total_amount, data.order_id))
            
        conn.commit()

        # ── SEND NOTIFICATION (Non-blocking) ──
        try:
            cursor.execute("SELECT u.email, u.name FROM Orders o JOIN Users u ON o.customer_id = u.user_id WHERE o.order_id = %s", (data.order_id,))
            cust = cursor.fetchone()
            if cust:
                from email_service import send_order_update
                new_status = 'Pending' if data.action != 'Reject' else 'Cancelled'
                if background_tasks:
                   background_tasks.add_task(send_order_update, cust['email'], cust['name'], data.order_id, new_status)
                else:
                   send_order_update(cust['email'], cust['name'], data.order_id, new_status)
        except Exception as e:
            print(f"[vendor/bulk] Could not send notification: {e}")

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
            
        if order['payment_method'] not in ['COD', 'Negotiable']:
            return {"status": "error", "message": "Only Cash/Offline orders can have their payment status updated manually."}
            
        cursor.execute("UPDATE Payments SET status=%s WHERE order_id=%s", (data.status, data.order_id))
        
            
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
        
        cursor.execute("SELECT balance FROM VendorWallets WHERE vendor_id=%s", (vendor_id,))
        res = cursor.fetchone()
        bal = res['balance'] if res and res['balance'] else 0
        
        if bal < data.amount or data.amount <= 0:
            return {"status": "error", "message": "Insufficient wallet balance"}
            
        try:
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS Payouts (
                payout_id SERIAL PRIMARY KEY,
                vendor_id INT,
                amount DECIMAL(10,2),
                account_name VARCHAR(100),
                account_number VARCHAR(100),
                ifsc VARCHAR(50),
                status VARCHAR(20) DEFAULT 'Pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (vendor_id) REFERENCES Vendors(vendor_id)
            )
            """)
        except:
            pass
        
        cursor.execute("UPDATE VendorWallets SET balance = balance - %s WHERE vendor_id=%s", (data.amount, vendor_id))
        
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

        # 1. Withdrawable (Online) - use VendorWallets table
        cursor.execute("SELECT balance FROM VendorWallets WHERE vendor_id=%s", (vendor_id,))
        w_res = cursor.fetchone()
        if not w_res:
            # If no wallet exists yet, treat as 0 (and maybe create at next credit)
            stats['online_total'] = 0
        else:
            stats['online_total'] = float(w_res['balance']) if w_res['balance'] else 0
        
        # 2. Collected Offline (COD)
        cursor.execute("""
            SELECT SUM(p.amount) as s 
            FROM Orders o 
            JOIN Payments p ON o.order_id = p.order_id 
            WHERE o.vendor_id=%s AND p.status IN ('Completed', 'Paid') AND o.payment_method = 'COD'
        """, (vendor_id,))
        cod_res = cursor.fetchone()
        stats['cod_total'] = float(cod_res['s']) if cod_res and cod_res['s'] else 0
        
        # 3. Pending Online (Not credited yet / needs admin audit)
        cursor.execute("""
            SELECT SUM(o.base_amount) as s 
            FROM Orders o 
            JOIN Payments p ON o.order_id = p.order_id
            WHERE o.vendor_id=%s AND o.payment_method != 'COD' AND COALESCE(o.vendor_credited, 0) = 0 AND p.status='Completed'
        """, (vendor_id,))
        ponline = cursor.fetchone()
        stats['pending_online'] = float(ponline['s']) if ponline and ponline['s'] else 0
        
        # 4. Pending COD (Not collected yet)
        cursor.execute("""
            SELECT SUM(p.amount) as s 
            FROM Orders o 
            JOIN Payments p ON o.order_id = p.order_id 
            WHERE o.vendor_id=%s AND p.status NOT IN ('Completed', 'Paid') AND o.payment_method IN ('COD', 'Negotiable')
        """, (vendor_id,))
        pcod = cursor.fetchone()
        stats['pending_cod'] = float(pcod['s']) if pcod and pcod['s'] else 0
        
        # Calculate Net COD (Subtracting commission)
        cursor.execute("""
            SELECT SUM(o.base_amount) as s 
            FROM Orders o 
            JOIN Payments p ON o.order_id = p.order_id 
            WHERE o.vendor_id=%s AND p.status IN ('Completed', 'Paid') AND o.payment_method IN ('COD', 'Negotiable')
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
        
        # For backward compatibility with the frontend if it uses 'total'
        stats['total'] = stats['total_gross']
        
        # Fetch current rates for the frontend to show in headers
        current_rates = {
            "product_commission_pct": float(get_platform_setting("product_commission_pct", 3.0)),
            "service_commission_pct": float(get_platform_setting("service_commission_pct", 3.0))
        }

        sql_payments = """
            SELECT TO_CHAR(o.created_at, 'DD Mon YYYY') as date, 
                   CONCAT('Order #', o.order_id, ' (', o.order_type, ')') as description, 
                   o.amount as gross,
                   o.gst_amount as gst,
                   o.commission_amount as commission,
                   cm.commission_rate,
                   o.base_amount as net,
                   CASE 
                     WHEN o.payment_method = 'COD' THEN p.status
                     WHEN COALESCE(o.vendor_credited, False) = True THEN 'Credited to Wallet'
                     ELSE 'Pending Audit'
                   END as status,
                   o.created_at as raw_date
            FROM Orders o
            LEFT JOIN Payments p ON o.order_id = p.order_id
            LEFT JOIN commissions cm ON o.order_id = cm.order_id
            WHERE o.vendor_id=%s 
              AND (o.payment_method IN ('COD', 'Negotiable') OR p.status IN ('Completed', 'Paid'))
        """
        
        sql_payouts = """
            SELECT TO_CHAR(created_at, 'DD Mon YYYY') as date,
                   'Bank Withdrawal' as description,
                   amount as gross,
                   0 as gst,
                   0 as commission,
                   0 as commission_rate,
                   -amount as net,
                   status,
                   created_at as raw_date
            FROM Payouts
            WHERE vendor_id=%s
        """
        
        cursor.execute(sql_payments, (vendor_id,))
        payments_rows = cursor.fetchall() or []
        
        cursor.execute(sql_payouts, (vendor_id,))
        payouts_rows = cursor.fetchall() or []
        
        transactions = sorted(
            payments_rows + payouts_rows,
            key=lambda x: x['raw_date'],
            reverse=True
        )
        
        # 4. JSON Cleanup
        cleaned = []
        for t in transactions:
            cleaned.append({
                'date': t['date'],
                'description': t['description'],
                'gross': float(t['gross'] or 0),
                'gst': float(t.get('gst') or 0),
                'commission': float(t.get('commission') or 0),
                'commission_rate': float(t.get('commission_rate') or 0),
                'net': float(t['net'] or 0),
                'status': t['status']
            })
        
        cursor.close()
        return {
            "status": "success", 
            "stats": stats, 
            "transactions": cleaned,
            "rates": current_rates
        }
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
                   TO_CHAR(billing_period_start, 'DD Mon YYYY') as start, 
                   TO_CHAR(billing_period_end, 'DD Mon YYYY') as end, 
                   TO_CHAR(due_date, 'DD Mon YYYY') as due 
            FROM weekly_invoices 
            WHERE vendor_id = %s 
            ORDER BY created_at DESC
        """, (vendor_id,))
        invoices = cursor.fetchall()
        
        cursor.close()
        return {"status": "success", "invoices": invoices}
    finally:
        conn.close()
