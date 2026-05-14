import sys
import os
# Add Backend to path
sys.path.append(os.path.join(os.getcwd(), 'Backend'))

from database import get_db_connection, get_platform_setting
from invoice_generator import generate_commission_gst_invoice_pdf
import datetime
import tempfile

def test_pdf_generation(invoice_id):
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
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
                  AND o.payment_method IN ('COD', 'PayLater', 'Negotiable')
                  AND c.status = 'Paid'
                  AND c.created_at BETWEEN wi.billing_period_start AND wi.billing_period_end
               ) as orders_count,
               COALESCE((SELECT commission_rate FROM commissions WHERE vendor_id = wi.vendor_id AND created_at BETWEEN wi.billing_period_start AND wi.billing_period_end LIMIT 1), 3.0) as commission_rate
        FROM weekly_invoices wi
        JOIN Vendors v ON wi.vendor_id = v.vendor_id
        JOIN Users u ON v.vendor_id = u.user_id
        WHERE wi.invoice_id = %s
        """
        cursor.execute(sql, (invoice_id,))
        inv = cursor.fetchone()
        
        if not inv:
            print("Invoice not found")
            return

        platform_gstin = get_platform_setting('platform_gstin', None)
        base_commission = float(inv['amount'])
        
        gst_amount = round(base_commission * 0.18, 2)
        total_amount = round(base_commission + gst_amount, 2)
        cgst = round(gst_amount / 2, 2)
        sgst = round(gst_amount - cgst, 2)

        invoice_data = {
            'invoice_id':      inv['invoice_id'],
            'vendor_name':     inv['vendor_name'] or '',
            'company_name':    inv['company_name'] or '',
            'vendor_gstin':    inv['vendor_gstin'] or 'Not Provided',
            'platform_gstin':  platform_gstin or 'Not Provided',
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
            'commission_rate': inv['commission_rate'] or 3.0,
        }

        fd, path = tempfile.mkstemp(suffix=".pdf")
        os.close(fd)
        
        print(f"Attempting to generate PDF at {path}...")
        generate_commission_gst_invoice_pdf(invoice_data, path)
        print("Success! PDF generated.")
        os.remove(path)

    except Exception as e:
        print(f"CRASHED: {e}")
        import traceback
        traceback.print_exc()
    finally:
        conn.close()

if __name__ == "__main__":
    test_pdf_generation(1)
