from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import FileResponse
from database import get_db_connection
from routers.auth import get_current_user_from_cookie
from invoice_generator import generate_invoice_pdf
import os
import tempfile

router = APIRouter()

@router.get("/download/{order_id}")
async def get_order_invoice(order_id: int, user = Depends(get_current_user_from_cookie)):
    """
    Generates and returns a PDF invoice for a given order.
    Accessible by the Customer who placed the order OR an Admin.
    """
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        
        # Fetch order details with customer and vendor info
        # Using LEFT JOIN to allow Product or Service items
        sql = """
        SELECT o.order_id, o.customer_id, o.order_type, o.quantity, o.amount, o.base_amount, 
               o.commission_amount, o.status, o.payment_method, o.delivery_address,
               pvt.status as payment_status,
               COALESCE(p.name, s.name) as item_name,
               v.company_name as vendor_name,
               u_vend.email as vendor_email,
               u_cust.name as customer_name,
               u_cust.phone as customer_phone,
               DATE_FORMAT(o.created_at, '%d %b %Y') as date
        FROM Orders o
        LEFT JOIN Products p ON o.order_type = 'Product' AND o.item_id = p.product_id
        LEFT JOIN Services s ON o.order_type = 'Service' AND o.item_id = s.service_id
        JOIN Vendors v ON o.vendor_id = v.vendor_id
        JOIN Users u_vend ON v.vendor_id = u_vend.user_id
        JOIN Users u_cust ON o.customer_id = u_cust.user_id
        JOIN Payments pvt ON o.order_id = pvt.order_id
        WHERE o.order_id = %s
        """
        cursor.execute(sql, (order_id,))
        order = cursor.fetchone()
        
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
            
        # Security: Only the customer who owns the order OR an Admin can download
        if user['role'] != 'Admin' and order['customer_id'] != user['user_id']:
            raise HTTPException(status_code=403, detail="Unauthorized to access this invoice")
            
        # Create a temporary file for the PDF
        fd, path = tempfile.mkstemp(suffix=".pdf")
        os.close(fd)
        
        try:
            generate_invoice_pdf(order, path)
            return FileResponse(
                path, 
                media_type='application/pdf', 
                filename=f"Invoice_ConEco_{order_id}.pdf"
            )
        except Exception as e:
            if os.path.exists(path): os.remove(path)
            raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")
            
    finally:
        cursor.close()
        conn.close()
