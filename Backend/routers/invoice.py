from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import FileResponse
from database import get_db_connection
from routers.auth import get_current_user_from_cookie
from invoice_generator import generate_order_summary_pdf, generate_commission_gst_invoice_pdf
import os
import tempfile
import datetime

router = APIRouter()

GST_RATE = 18.0  # India GST %


# ---------------------------------------------------------------------------
# ORDER SUMMARY DOWNLOAD — Customer / Admin
# NOT a Tax Invoice.  Physical Tax Invoice is given by vendor when
# collecting cash from the customer.
# ---------------------------------------------------------------------------

@router.get("/download/{order_id}")
async def get_order_summary(order_id: int, user=Depends(get_current_user_from_cookie)):
    """
    Generate and return a PDF Order Summary for a given order.
    Accessible by the Customer who placed the order OR an Admin.
    This is NOT a GST Tax Invoice.
    """
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)

        sql = """
        SELECT o.order_id, o.customer_id, o.order_type, o.quantity, o.amount, o.base_amount,
               o.gst_amount, o.commission_amount, o.status, o.payment_method, o.delivery_address,
               pvt.status as payment_status,
               COALESCE(p.name, s.name) as item_name,
               v.company_name as vendor_name,
               u_vend.email as vendor_email,
               u_cust.name as customer_name,
               u_cust.phone as customer_phone,
               TO_CHAR(o.created_at, 'DD Mon YYYY') as date
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

        # Security: Only the owning customer OR an Admin can download
        if user['role'] != 'Admin' and order['customer_id'] != user['user_id']:
            raise HTTPException(status_code=403, detail="Unauthorized to access this order summary")

        fd, path = tempfile.mkstemp(suffix=".pdf")
        os.close(fd)

        try:
            generate_order_summary_pdf(order, path)
            return FileResponse(
                path,
                media_type='application/pdf',
                filename=f"OrderSummary_ConEco_{order_id}.pdf"
            )
        except Exception as e:
            if os.path.exists(path):
                os.remove(path)
            raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")

    finally:
        cursor.close()
        conn.close()


# ---------------------------------------------------------------------------
# GST COMMISSION INVOICE DOWNLOAD — Vendor only (after paying weekly invoice)
# This IS a proper GST Tax Invoice issued by the Platform to the Vendor for
# the weekly commission payment.  Vendor uses it to claim ITC.
# ---------------------------------------------------------------------------

@router.get("/commission_gst/{invoice_id}")
async def get_commission_gst_invoice(invoice_id: int, user=Depends(get_current_user_from_cookie)):
    """
    Generate and return a GST Tax Invoice for a paid weekly commission invoice.
    Only accessible by the Vendor who owns the invoice (or Admin).
    Vendor must have PAID the invoice before downloading.
    """
    if user['role'] not in ('Vendor', 'Admin'):
        raise HTTPException(status_code=403, detail="Forbidden")

    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)

        # Fetch invoice + vendor details
        sql = """
        SELECT wi.invoice_id, wi.vendor_id, wi.amount, wi.status,
               TO_CHAR(wi.billing_period_start, 'DD Mon YYYY') as period_start,
               TO_CHAR(wi.billing_period_end,   'DD Mon YYYY') as period_end,
               TO_CHAR(wi.due_date,             'DD Mon YYYY') as due_date,
               TO_CHAR(wi.created_at,           'DD Mon YYYY') as created_date,
               u.name as vendor_name,
               v.company_name,
               v.gstin as vendor_gstin,
               (SELECT COUNT(*) 
                FROM commissions c
                JOIN Orders o ON c.order_id = o.order_id
                WHERE c.vendor_id = wi.vendor_id
                  AND o.payment_method IN ('COD','Pay Later (Cash)','Negotiable')
                  AND c.status = 'Pending'
                  AND c.created_at BETWEEN wi.billing_period_start AND wi.billing_period_end
               ) as orders_count
        FROM weekly_invoices wi
        JOIN Vendors v ON wi.vendor_id = v.vendor_id
        JOIN Users u ON v.vendor_id = u.user_id
        WHERE wi.invoice_id = %s
        """
        cursor.execute(sql, (invoice_id,))
        inv = cursor.fetchone()

        if not inv:
            raise HTTPException(status_code=404, detail="Invoice not found")

        # Verify ownership for vendor
        if user['role'] == 'Vendor' and inv['vendor_id'] != user['user_id']:
            raise HTTPException(status_code=403, detail="Unauthorized")

        # Must be paid to download GST invoice
        if inv['status'] != 'Paid':
            raise HTTPException(
                status_code=400,
                detail="GST Invoice is only available after the commission has been paid."
            )

        # --- GST Calculation ---
        # The amount stored in weekly_invoices is the raw 5% commission (no GST embedded).
        # We need to add 18% GST on top for the GST invoice.
        base_commission = float(inv['amount'])  # pre-tax commission amount
        gst_amount      = round(base_commission * GST_RATE / 100, 2)
        total_amount    = round(base_commission + gst_amount, 2)
        # Intra-state split (CGST + SGST), assuming platform and vendor in same state.
        # Adjust to IGST if inter-state.
        cgst = round(gst_amount / 2, 2)
        sgst = round(gst_amount - cgst, 2)

        invoice_data = {
            'invoice_id':      inv['invoice_id'],
            'vendor_name':     inv['vendor_name'] or '',
            'company_name':    inv['company_name'] or '',
            'vendor_gstin':    inv['vendor_gstin'] or 'Not Provided',
            'period_start':    inv['period_start'] or '',
            'period_end':      inv['period_end'] or '',
            'due_date':        inv['due_date'] or '',
            'paid_date':       datetime.datetime.now().strftime('%d %b %Y'),
            'base_commission': base_commission,
            'gst_amount':      gst_amount,
            'total_amount':    total_amount,
            'cgst':            cgst,
            'sgst':            sgst,
            'igst':            0.0,
            'orders_count':    inv['orders_count'] or 0,
        }

        fd, path = tempfile.mkstemp(suffix=".pdf")
        os.close(fd)

        try:
            generate_commission_gst_invoice_pdf(invoice_data, path)
            return FileResponse(
                path,
                media_type='application/pdf',
                filename=f"GSTInvoice_ConEco_Commission_{invoice_id}.pdf"
            )
        except Exception as e:
            if os.path.exists(path):
                os.remove(path)
            raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")

    finally:
        cursor.close()
        conn.close()
