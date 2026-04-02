from fastapi import APIRouter, Depends, HTTPException, Request
from database import get_db_connection
from routers.auth import get_current_user_from_cookie
from pydantic import BaseModel
from typing import Optional
import random
import string

router = APIRouter()

def check_customer(user = Depends(get_current_user_from_cookie)):
    if user['role'] != 'Customer':
        raise HTTPException(status_code=403, detail="Forbidden")
    return user

@router.get("/products")
def get_products(user = Depends(check_customer)):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        "SELECT p.product_id as item_id, p.name, p.description, p.price, p.image_url, p.unit, p.brand, p.specifications, p.delivery_time, p.category, 'Product' as type, v.company_name as vendor_name "
        "FROM Products p JOIN Vendors v ON p.vendor_id = v.vendor_id "
        "WHERE v.verification_status='Verified'"
    )
    items = cursor.fetchall()
    cursor.close()
    conn.close()
    return {"status": "success", "items": items}

@router.get("/services")
def get_services(user = Depends(check_customer)):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        "SELECT s.service_id as item_id, s.name, s.description, s.price, s.image_url, s.unit, '' as brand, s.specifications, s.delivery_time, s.category, 'Service' as type, v.company_name as vendor_name "
        "FROM Services s JOIN Vendors v ON s.vendor_id = v.vendor_id "
        "WHERE v.verification_status='Verified'"
    )
    items = cursor.fetchall()
    cursor.close()
    conn.close()
    return {"status": "success", "items": items}

class CartItem(BaseModel):
    item_type: str
    item_id: int
    quantity: int

@router.get("/cart")
def get_cart(user = Depends(check_customer)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        user_id = user['user_id']
        
        cursor.execute("SELECT customer_id FROM Customers WHERE customer_id=%s", (user_id,))
        res = cursor.fetchone()
        if not res:
            cursor.close()
            return {"status": "error", "message": "Customer not found"}
        cust_id = res['customer_id']
        
        sql = """
        SELECT c.cart_id, c.item_type, c.item_id, c.quantity,
               COALESCE(p.name, s.name) as name,
               COALESCE(p.price, s.price) as price,
               COALESCE(v1.company_name, v2.company_name) as vendor_name
        FROM Cart c
        LEFT JOIN Products p ON c.item_type='Product' AND c.item_id=p.product_id
        LEFT JOIN Services s ON c.item_type='Service' AND c.item_id=s.service_id
        LEFT JOIN Vendors v1 ON p.vendor_id=v1.vendor_id
        LEFT JOIN Vendors v2 ON s.vendor_id=v2.vendor_id
        WHERE c.customer_id=%s
        """
        cursor.execute(sql, (cust_id,))
        items = cursor.fetchall()
        
        # Calculate totals with 18% GST and 5% platform commission
        base_total = sum([(float(i['price']) * i['quantity']) for i in items])
        gst_total = round(base_total * 0.18, 2)
        commission_rate = 5.0  # 5% platform commission
        commission_total = round(base_total * commission_rate / 100, 2)
        total = round(base_total + gst_total + commission_total, 2)
        
        cursor.close()
        return {
            "status": "success", 
            "items": items, 
            "base_total": round(base_total, 2),
            "gst_total": gst_total,
            "commission_total": commission_total,
            "total": total,
            "commission_rate": commission_rate
        }
    finally:
        conn.close()

@router.post("/cart")
def add_to_cart(data: CartItem, user = Depends(check_customer)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT customer_id FROM Customers WHERE customer_id=%s", (user['user_id'],))
        cust_id = cursor.fetchone()[0]
        
        cursor.execute("SELECT cart_id, quantity FROM Cart WHERE customer_id=%s AND item_type=%s AND item_id=%s",
                       (cust_id, data.item_type, data.item_id))
        existing = cursor.fetchone()
        
        if existing:
            cursor.execute("UPDATE Cart SET quantity = quantity + %s WHERE cart_id=%s", (data.quantity, existing[0]))
        else:
            cursor.execute("INSERT INTO Cart (customer_id, item_type, item_id, quantity) VALUES (%s, %s, %s, %s)",
                           (cust_id, data.item_type, data.item_id, data.quantity))
        conn.commit()
        cursor.close()
        return {"status": "success"}
    finally:
        conn.close()

class DeleteCartItem(BaseModel):
    cart_id: int

@router.delete("/cart")
def remove_from_cart(data: DeleteCartItem, user = Depends(check_customer)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM Cart WHERE cart_id=%s", (data.cart_id,))
        conn.commit()
        cursor.close()
        return {"status": "success"}
    finally:
        conn.close()

class UpdateCartItem(BaseModel):
    cart_id: int
    quantity: int

@router.put("/cart")
def update_cart_quantity(data: UpdateCartItem, user = Depends(check_customer)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT customer_id FROM Customers WHERE customer_id=%s", (user['user_id'],))
        cust_id = cursor.fetchone()[0]
        
        cursor.execute("UPDATE Cart SET quantity = %s WHERE cart_id = %s AND customer_id = %s",
                       (data.quantity, data.cart_id, cust_id))
        conn.commit()
        cursor.close()
        return {"status": "success"}
    finally:
        conn.close()


class CheckoutData(BaseModel):
    address: str
    city: str
    state: str
    payment_method: str

@router.post("/checkout")
def checkout(data: CheckoutData, user = Depends(check_customer)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT customer_id FROM Customers WHERE customer_id=%s", (user['user_id'],))
        cust_id = cursor.fetchone()['customer_id']
        
        sql = """
        SELECT c.*, COALESCE(p.vendor_id, s.vendor_id) as vendor_id, COALESCE(p.price, s.price) as price
        FROM Cart c
        LEFT JOIN Products p ON c.item_type='Product' AND c.item_id=p.product_id
        LEFT JOIN Services s ON c.item_type='Service' AND c.item_id=s.service_id
        WHERE c.customer_id=%s
        """
        cursor.execute(sql, (cust_id,))
        cart_items = cursor.fetchall()
        
        if not cart_items:
            cursor.close()
            return {"status": "error", "message": "Cart is empty"}
            
        for item in cart_items:
            base_amount = float(item['price']) * item['quantity']
            gst_amount = round(base_amount * 0.18, 2)
            commission_amount = round(base_amount * 0.05, 2)
            total_amount = round(base_amount + gst_amount + commission_amount, 2)
            
            cursor.execute("""
                INSERT INTO Orders (customer_id, vendor_id, order_type, item_id, quantity, amount, base_amount, gst_amount, commission_amount, total_amount, status, delivery_address, payment_method) 
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'Pending', %s, %s)
            """, (cust_id, item['vendor_id'], item['item_type'], item['item_id'], item['quantity'], total_amount, base_amount, gst_amount, commission_amount, total_amount, f"{data.address}, {data.city}, {data.state}", data.payment_method))
            order_id = cursor.lastrowid
            
            txn_id = ''.join(random.choices(string.ascii_uppercase + string.digits, k=10))
            cursor.execute("INSERT INTO Payments (txn_id, order_id, amount, status) VALUES (%s, %s, %s, 'Pending')",
                           (txn_id, order_id, total_amount))
        
        cursor.execute("DELETE FROM Cart WHERE customer_id=%s", (cust_id,))
        conn.commit()
        cursor.close()
        return {"status": "success"}
    finally:
        conn.close()

@router.get("/my_orders")
def get_my_orders(user = Depends(check_customer)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT customer_id FROM Customers WHERE customer_id=%s", (user['user_id'],))
        cust_id = cursor.fetchone()['customer_id']
        
        sql = """
        SELECT o.order_id, o.order_type, o.quantity, o.amount, o.status, o.payment_method, pvt.status as payment_status, 
               DATE_FORMAT(o.created_at, '%d %b %Y') as date, p.name as item_name, v.company_name as vendor_name, 
               u.email as vendor_email, u.phone as vendor_phone, o.delivery_address,
               o.pay_later_stage, DATE_FORMAT(o.pay_later_due_date, '%d %b %Y') as pay_later_due,
               DATE_FORMAT(o.pay_later_stage2_due, '%d %b %Y') as pay_later_stage2_due,
               DATE_FORMAT(o.pay_later_stage3_due, '%d %b %Y') as pay_later_stage3_due,
               o.is_bulk_request, o.customer_message, o.vendor_message, o.negotiated_price
        FROM Orders o
        JOIN Products p ON o.item_id = p.product_id
        JOIN Vendors v ON o.vendor_id = v.vendor_id
        JOIN Users u ON v.vendor_id = u.user_id
        JOIN Payments pvt ON o.order_id = pvt.order_id
        WHERE o.customer_id=%s AND o.order_type='Product'
        ORDER BY o.created_at DESC
        """
        cursor.execute(sql, (cust_id,))
        orders = cursor.fetchall()
        cursor.close()
        return {"status": "success", "orders": orders}
    finally:
        conn.close()

@router.get("/my_services")
def get_my_services(user = Depends(check_customer)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT customer_id FROM Customers WHERE customer_id=%s", (user['user_id'],))
        cust_id = cursor.fetchone()['customer_id']
        
        sql = """
        SELECT o.order_id, o.order_type, o.amount, o.status, o.payment_method, pvt.status as payment_status,
               DATE_FORMAT(o.created_at, '%d %b %Y') as date, s.name as item_name, v.company_name as vendor_name, 
               u.email as vendor_email, u.phone as vendor_phone, o.delivery_address,
               o.pay_later_stage, DATE_FORMAT(o.pay_later_due_date, '%d %b %Y') as pay_later_due,
               DATE_FORMAT(o.pay_later_stage2_due, '%d %b %Y') as pay_later_stage2_due,
               DATE_FORMAT(o.pay_later_stage3_due, '%d %b %Y') as pay_later_stage3_due
        FROM Orders o
        JOIN Services s ON o.item_id = s.service_id
        JOIN Vendors v ON o.vendor_id = v.vendor_id
        JOIN Users u ON v.vendor_id = u.user_id
        JOIN Payments pvt ON o.order_id = pvt.order_id
        WHERE o.customer_id=%s AND o.order_type='Service'
        ORDER BY o.created_at DESC
        """
        cursor.execute(sql, (cust_id,))
        services = cursor.fetchall()
        cursor.close()
        return {"status": "success", "services": services}
    finally:
        conn.close()

class CancelOrderData(BaseModel):
    order_id: int

@router.post("/orders/cancel")
def cancel_order(data: CancelOrderData, user = Depends(check_customer)):
    """
    Cancel an order ONLY if it is in 'Pending' state.
    Provides 100% refund for online payments (by marking payment as Refunded).
    For COD, simply marks as Cancelled.
    If not pending, customer is instructed to contact the vendor.
    """
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT customer_id FROM Customers WHERE customer_id=%s", (user['user_id'],))
        cust = cursor.fetchone()
        if not cust:
            raise HTTPException(status_code=404, detail="Customer not found")
        cust_id = cust['customer_id']

        cursor.execute("""
            SELECT status, payment_method, payment_status 
            FROM Orders o
            LEFT JOIN Payments p ON o.order_id = p.order_id
            WHERE o.order_id = %s AND o.customer_id = %s
        """, (data.order_id, cust_id))
        order = cursor.fetchone()

        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        if order['status'] != 'Pending':
            return {
                "status": "error", 
                "message": "Order has already been accepted or processed. To cancel, please contact the vendor and request them to change the status back to 'Pending'."
            }

        # Cancel the order
        cursor.execute("UPDATE Orders SET status='Cancelled' WHERE order_id=%s", (data.order_id,))
        
        # Handle payment status update
        if order['payment_method'] in ['Card', 'UPI', 'Pay Later']:
            cursor.execute("UPDATE Payments SET status='Refunded' WHERE order_id=%s", (data.order_id,))
            refund_msg = "Order cancelled successfully. 100% refund initiated."
        else:
            # COD
            cursor.execute("UPDATE Payments SET status='Failed' WHERE order_id=%s", (data.order_id,))
            refund_msg = "Order cancelled successfully (COD)."
            
        conn.commit()
        return {"status": "success", "message": refund_msg}

    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

class ReviewData(BaseModel):
    item_type: str
    item_id: int
    rating: int
    comment: str

@router.post("/reviews")
def add_review(data: ReviewData, user = Depends(check_customer)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT customer_id FROM Customers WHERE customer_id=%s", (user['user_id'],))
        cust = cursor.fetchone()
        if not cust:
            raise HTTPException(status_code=404, detail="Customer not found")
            
        cursor.execute(
            "INSERT INTO ItemReviews (item_type, item_id, customer_id, rating, comment) VALUES (%s, %s, %s, %s, %s)",
            (data.item_type, data.item_id, cust['customer_id'], data.rating, data.comment)
        )
        conn.commit()
        return {"status": "success", "message": "Review added successfully!"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@router.get("/reviews/{item_type}/{item_id}")
def get_reviews(item_type: str, item_id: int):
    # This route is optionally public or authenticated depending on needs, 
    # but we'll leave it without Depends(check_customer) so anyone can view reviews,
    # or with standard read access.
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        
        # Calculate average rating and count
        cursor.execute(
            "SELECT COALESCE(AVG(rating), 0) as average_rating, COUNT(*) as total_reviews "
            "FROM ItemReviews WHERE item_type=%s AND item_id=%s",
            (item_type.capitalize(), item_id)
        )
        stats = cursor.fetchone()
        
        # Get individual reviews
        sql = """
            SELECT r.review_id, r.rating, r.comment, DATE_FORMAT(r.created_at, '%d %b %Y') as date, u.name as customer_name
            FROM ItemReviews r
            JOIN Users u ON r.customer_id = u.user_id
            WHERE r.item_type=%s AND r.item_id=%s
            ORDER BY r.created_at DESC
        """
        cursor.execute(sql, (item_type.capitalize(), item_id))
        reviews = cursor.fetchall()
        
        return {
            "status": "success", 
            "stats": {
                "average_rating": round(float(stats['average_rating']), 1) if stats else 0,
                "total_reviews": stats['total_reviews'] if stats else 0
            },
            "reviews": reviews
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()
class BulkRequestData(BaseModel):
    item_type: str
    item_id: int
    quantity: int
    message: Optional[str] = None
    address: str
    city: str
    state: str

@router.post("/bulk-request")
def request_bulk_price(data: BulkRequestData, user = Depends(check_customer)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT customer_id FROM Customers WHERE customer_id=%s", (user['user_id'],))
        cust = cursor.fetchone()
        if not cust:
            raise HTTPException(status_code=404, detail="Customer not found")
        cust_id = cust['customer_id']
        
        # Get item details (price, vendor_id)
        if data.item_type.capitalize() == 'Product':
            cursor.execute("SELECT vendor_id, price FROM Products WHERE product_id=%s", (data.item_id,))
        else:
            cursor.execute("SELECT vendor_id, price FROM Services WHERE service_id=%s", (data.item_id,))
        
        item = cursor.fetchone()
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")
        
        # Calculate initial estimated amount (standard price)
        base_amount = float(item['price']) * data.quantity
        gst_amount = round(base_amount * 0.18, 2)
        commission_amount = round(base_amount * 0.05, 2)
        total_amount = round(base_amount + gst_amount + commission_amount, 2)
        
        full_address = f"{data.address}, {data.city}, {data.state}"
        
        item_type = data.item_type
        if item_type.lower().endswith('s'):
            item_type = item_type[:-1]
        item_type = item_type.capitalize()

        cursor.execute("""
            INSERT INTO Orders (
                customer_id, vendor_id, order_type, item_id, quantity, 
                amount, base_amount, gst_amount, commission_amount, total_amount,
                status, delivery_address, payment_method, 
                is_bulk_request, customer_message
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'Bulk Requested', %s, 'Negotiable', 1, %s)
        """, (cust_id, item['vendor_id'], item_type, data.item_id, data.quantity, 
              total_amount, base_amount, gst_amount, commission_amount, total_amount, full_address, data.message))
        
        order_id = cursor.lastrowid
        
        # Track commission for financial reporting
        cursor.execute(
            """INSERT INTO commissions (order_id, vendor_id, commission_amount, commission_rate, status) 
               VALUES (%s,%s,%s,%s,'Pending')""",
            (order_id, item['vendor_id'], commission_amount, 5.0)
        )
        
        # Create a placeholder payment
        txn_id = 'BULK-' + ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        cursor.execute("INSERT INTO Payments (txn_id, order_id, amount, status) VALUES (%s, %s, %s, 'Pending')",
                       (txn_id, order_id, total_amount))
        
        conn.commit()
        return {"status": "success", "message": "Bulk price request sent to vendor!"}
    except Exception as e:
        import traceback
        print(f"ERROR in request_bulk_price: {str(e)}")
        traceback.print_exc()
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        cursor.close()
        conn.close()
