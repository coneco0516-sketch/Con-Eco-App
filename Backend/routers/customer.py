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
        "SELECT p.product_id as item_id, p.name, p.description, p.price, 'Product' as type, v.company_name as vendor_name "
        "FROM Products p JOIN Vendors v ON p.vendor_id = v.vendor_id"
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
        "SELECT s.service_id as item_id, s.name, s.description, s.price, 'Service' as type, v.company_name as vendor_name "
        "FROM Services s JOIN Vendors v ON s.vendor_id = v.vendor_id"
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
        
        total = sum([(float(i['price']) * i['quantity']) for i in items])
        
        cursor.close()
        return {"status": "success", "items": items, "total": total}
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
            amount = float(item['price']) * item['quantity']
            cursor.execute("INSERT INTO Orders (customer_id, vendor_id, order_type, item_id, quantity, amount, status) VALUES (%s, %s, %s, %s, %s, %s, 'Pending')", 
                           (cust_id, item['vendor_id'], item['item_type'], item['item_id'], item['quantity'], amount))
            order_id = cursor.lastrowid
            
            txn_id = ''.join(random.choices(string.ascii_uppercase + string.digits, k=10))
            cursor.execute("INSERT INTO Payments (txn_id, order_id, amount, status) VALUES (%s, %s, %s, 'Pending')",
                           (txn_id, order_id, amount))
        
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
        SELECT o.order_id, o.order_type, o.quantity, o.amount, o.status, DATE_FORMAT(o.created_at, '%d %b %Y') as date, p.name as item_name, v.company_name as vendor_name
        FROM Orders o
        JOIN Products p ON o.item_id = p.product_id
        JOIN Vendors v ON o.vendor_id = v.vendor_id
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
        SELECT o.order_id, o.order_type, o.amount, o.status, DATE_FORMAT(o.created_at, '%d %b %Y') as date, s.name as item_name, v.company_name as vendor_name
        FROM Orders o
        JOIN Services s ON o.item_id = s.service_id
        JOIN Vendors v ON o.vendor_id = v.vendor_id
        WHERE o.customer_id=%s AND o.order_type='Service'
        ORDER BY o.created_at DESC
        """
        cursor.execute(sql, (cust_id,))
        services = cursor.fetchall()
        cursor.close()
        return {"status": "success", "services": services}
    finally:
        conn.close()
