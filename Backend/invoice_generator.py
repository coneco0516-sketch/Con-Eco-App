from fpdf import FPDF
from datetime import datetime
import os

GST_RATE = 18.0  # India GST rate in %

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def clean_text(text):
    """Encode text to latin-1 to avoid PDF generation errors with special chars."""
    if not text:
        return ""
    return str(text).encode('latin-1', 'replace').decode('latin-1')


# ---------------------------------------------------------------------------
# ORDER SUMMARY PDF  (Customer / Vendor / Admin view)
# NOT a Tax Invoice — the physical Tax Invoice is given by the vendor when
# collecting cash.  This is purely an order confirmation / summary document.
# ---------------------------------------------------------------------------

class OrderSummaryPDF(FPDF):
    def header(self):
        self.set_font('helvetica', 'B', 24)
        self.set_text_color(35, 134, 54)
        self.cell(0, 10, 'ConEco', ln=True, align='L')

        self.set_font('helvetica', '', 10)
        self.set_text_color(100, 100, 100)
        self.cell(0, 5, 'Unified Construction Ecommerce Platform', ln=True, align='L')

        self.set_y(10)
        self.set_font('helvetica', 'B', 16)
        self.set_text_color(0, 0, 0)
        self.cell(0, 10, 'ORDER SUMMARY', ln=True, align='R')
        self.ln(5)

        # Note banner
        self.set_font('helvetica', 'I', 8)
        self.set_text_color(180, 100, 0)
        self.set_fill_color(255, 248, 230)
        self.cell(
            0, 7,
            '  NOTE: This is an Order Summary only. The Tax Invoice will be provided by the vendor '
            'at the time of cash collection.',
            border=1, fill=True, ln=True
        )
        self.set_text_color(0, 0, 0)
        self.ln(5)

    def footer(self):
        self.set_y(-25)
        self.set_font('helvetica', 'I', 8)
        self.set_text_color(128, 128, 128)
        self.cell(
            0, 10,
            'This is a computer-generated Order Summary and does not constitute a Tax Invoice.',
            align='C', ln=True
        )
        self.cell(0, 5, f'Page {self.page_no()}', align='C')


def generate_order_summary_pdf(order_data, output_path):
    """
    Generate an Order Summary PDF for the given order.
    Used by Customer, Admin views.
    This is NOT a GST Tax Invoice.
    """
    pdf = OrderSummaryPDF()
    pdf.add_page()

    cust_name       = clean_text(order_data.get('customer_name', 'Guest'))
    order_id        = order_data.get('order_id', '0')
    cust_phone      = clean_text(order_data.get('customer_phone', ''))
    date            = clean_text(order_data.get('date', ''))
    addr            = clean_text(order_data.get('delivery_address', ''))
    status          = clean_text(order_data.get('status', ''))
    vend_name       = clean_text(order_data.get('vendor_name', ''))
    vend_email      = clean_text(order_data.get('vendor_email', ''))
    item_name       = clean_text(order_data.get('item_name', ''))
    order_type      = clean_text(order_data.get('order_type', ''))
    payment_method  = clean_text(order_data.get('payment_method', 'COD'))
    payment_status  = clean_text(order_data.get('payment_status', ''))

    quantity        = order_data.get('quantity', 1) or 1
    amount          = float(order_data.get('amount') or 0)
    base_amount     = float(order_data.get('base_amount') or 0)
    gst_amount      = float(order_data.get('gst_amount') or 0)
    commission_amt  = float(order_data.get('commission_amount') or 0)

    # ---- Billing + Order Info ----
    pdf.set_font('helvetica', 'B', 11)
    pdf.cell(95, 7, 'Customer Details:', ln=False)
    pdf.cell(95, 7, 'Order Details:', ln=True)

    pdf.set_font('helvetica', '', 10)
    pdf.cell(95, 5, f"Name: {cust_name}", ln=False)
    pdf.cell(95, 5, f"Order ID: #{order_id}", ln=True)
    pdf.cell(95, 5, f"Phone: {cust_phone}", ln=False)
    pdf.cell(95, 5, f"Date: {date}", ln=True)
    pdf.cell(95, 5, f"Address: {addr[:45]}", ln=False)
    pdf.cell(95, 5, f"Order Status: {status}", ln=True)
    if len(addr) > 45:
        pdf.cell(95, 5, addr[45:90], ln=True)
    pdf.ln(8)

    # ---- Vendor Info ----
    pdf.set_font('helvetica', 'B', 11)
    pdf.cell(0, 7, 'Vendor / Supplier:', ln=True)
    pdf.set_font('helvetica', '', 10)
    pdf.cell(0, 5, f"Company: {vend_name}", ln=True)
    if vend_email:
        pdf.cell(0, 5, f"Email: {vend_email}", ln=True)
    pdf.ln(8)

    # ---- Items Table ----
    pdf.set_fill_color(230, 250, 235)
    pdf.set_font('helvetica', 'B', 10)
    pdf.cell(100, 10, 'Item Description', border=1, fill=True)
    pdf.cell(30,  10, 'Type',            border=1, fill=True, align='C')
    pdf.cell(20,  10, 'Qty',             border=1, fill=True, align='C')
    pdf.cell(40,  10, 'Amount (INR)',    border=1, fill=True, align='R')
    pdf.ln()

    pdf.set_font('helvetica', '', 10)
    pdf.cell(100, 10, item_name, border=1)
    pdf.cell(30,  10, order_type, border=1, align='C')
    pdf.cell(20,  10, str(quantity), border=1, align='C')
    pdf.cell(40,  10, f"INR {amount:.2f}", border=1, align='R')
    pdf.ln(12)

    # ---- Totals ----
    pdf.set_x(130)
    pdf.set_font('helvetica', '', 10)
    pdf.cell(30, 7, 'Item Total:', align='L')
    pdf.cell(30, 7, f"INR {base_amount:.2f}", align='R', ln=True)

    pdf.set_x(130)
    pdf.cell(30, 7, 'GST (18%):', align='L')
    pdf.cell(30, 7, f"INR {gst_amount:.2f}", align='R', ln=True)

    pdf.set_x(130)
    pdf.cell(30, 7, 'Platform Fee (3%):', align='L')
    pdf.cell(30, 7, f"INR {commission_amt:.2f}", align='R', ln=True)

    pdf.set_x(130)
    pdf.set_fill_color(35, 134, 54)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font('helvetica', 'B', 10)
    pdf.cell(30, 10, 'Total Payable:', fill=True, align='L')
    pdf.cell(30, 10, f"INR {amount:.2f}", fill=True, align='R', ln=True)
    pdf.set_text_color(0, 0, 0)
    pdf.ln(8)

    # ---- Payment Info ----
    pdf.set_font('helvetica', 'B', 10)
    pdf.cell(0, 5, f"Payment Method: {payment_method}", ln=True)
    pdf.set_font('helvetica', '', 9)
    pdf.cell(0, 5, f"Payment Status: {payment_status}", ln=True)

    pdf.output(output_path)
    return output_path


# ---------------------------------------------------------------------------
# GST COMMISSION INVOICE PDF  (Vendor ← Platform billing)
# This IS a proper GST Tax Invoice issued BY the Platform TO the Vendor for
# the weekly commission.  The vendor uses this to claim Input Tax Credit (ITC).
# GST Rate: 18% (CGST 9% + SGST 9% for intra-state / IGST 18% for inter-state)
# ---------------------------------------------------------------------------

class CommissionGSTInvoicePDF(FPDF):
    def header(self):
        self.set_font('helvetica', 'B', 24)
        self.set_text_color(35, 134, 54)
        self.cell(0, 10, 'ConEco', ln=True, align='L')

        self.set_font('helvetica', '', 10)
        self.set_text_color(100, 100, 100)
        self.cell(0, 5, 'Unified Construction Ecommerce Platform', ln=True, align='L')
        self.cell(0, 5, 'GSTIN: [Platform GSTIN]  |  PAN: [Platform PAN]', ln=True, align='L')

        self.set_y(10)
        self.set_font('helvetica', 'B', 16)
        self.set_text_color(35, 134, 54)
        self.cell(0, 10, 'GST TAX INVOICE', ln=True, align='R')
        self.set_font('helvetica', '', 10)
        self.set_text_color(100, 100, 100)
        self.cell(0, 5, '(For Platform Commission — Input Tax Credit applicable)', ln=True, align='R')
        self.set_text_color(0, 0, 0)
        self.ln(5)

    def footer(self):
        self.set_y(-30)
        self.set_font('helvetica', 'I', 8)
        self.set_text_color(128, 128, 128)
        self.cell(0, 5, 'This is a computer-generated GST Tax Invoice.', align='C', ln=True)
        self.cell(0, 5, 'Vendor may use this document to claim Input Tax Credit (ITC) under GST rules.', align='C', ln=True)
        self.cell(0, 5, f'Page {self.page_no()}', align='C')


def generate_commission_gst_invoice_pdf(invoice_data, output_path):
    """
    Generate a GST Tax Invoice for the platform commission charged to a vendor.
    The vendor can use this for ITC (Input Tax Credit) claims.

    invoice_data keys:
        invoice_id, vendor_name, company_name, vendor_gstin,
        period_start, period_end, due_date, paid_date,
        base_commission,   # commission excluding GST
        gst_amount,        # 18% GST on base_commission
        total_amount,      # base_commission + gst_amount
        cgst, sgst,        # intra-state (each 9%)
        igst,              # inter-state (18%, if applicable)
        orders_count
    """
    pdf = CommissionGSTInvoicePDF()
    pdf.add_page()

    inv_id       = invoice_data.get('invoice_id', '')
    vend_name    = clean_text(invoice_data.get('vendor_name', ''))
    company      = clean_text(invoice_data.get('company_name', ''))
    vend_gstin   = clean_text(invoice_data.get('vendor_gstin', 'Not Provided'))
    period_start = clean_text(invoice_data.get('period_start', ''))
    period_end   = clean_text(invoice_data.get('period_end', ''))
    paid_date    = clean_text(invoice_data.get('paid_date', datetime.now().strftime('%d %b %Y')))

    base_comm    = float(invoice_data.get('base_commission', 0))
    gst_amount   = float(invoice_data.get('gst_amount', 0))
    total_amount = float(invoice_data.get('total_amount', 0))
    cgst         = float(invoice_data.get('cgst', 0))
    sgst         = float(invoice_data.get('sgst', 0))
    igst         = float(invoice_data.get('igst', 0))
    orders_count = invoice_data.get('orders_count', '-')

    invoice_no   = f"CNE-COMM-{inv_id:04d}" if isinstance(inv_id, int) else f"CNE-COMM-{inv_id}"

    # ---- Invoice header info ----
    pdf.set_font('helvetica', 'B', 11)
    pdf.cell(95, 7, 'Invoice From (Supplier):', ln=False)
    pdf.cell(95, 7, 'Invoice To (Recipient):', ln=True)

    pdf.set_font('helvetica', '', 10)
    pdf.cell(95, 5, 'ConEco Platform Pvt. Ltd.', ln=False)
    pdf.cell(95, 5, f"{company}", ln=True)
    pdf.cell(95, 5, 'GSTIN: [Platform GSTIN]', ln=False)
    pdf.cell(95, 5, f"GSTIN: {vend_gstin}", ln=True)
    pdf.cell(95, 5, f"Invoice No: {invoice_no}", ln=False)
    pdf.cell(95, 5, f"Vendor: {vend_name}", ln=True)
    pdf.cell(95, 5, f"Invoice Date: {paid_date}", ln=True)
    pdf.ln(8)

    # ---- Billing Period ----
    pdf.set_font('helvetica', 'B', 10)
    pdf.set_fill_color(240, 248, 255)
    pdf.cell(0, 8, f"  Billing Period:  {period_start}  to  {period_end}   |   Orders Covered: {orders_count}", border=1, fill=True, ln=True)
    pdf.ln(5)

    # ---- Service Table ----
    pdf.set_fill_color(230, 250, 235)
    pdf.set_font('helvetica', 'B', 10)
    pdf.cell(90,  10, 'Service Description',          border=1, fill=True)
    pdf.cell(30,  10, 'SAC Code',                     border=1, fill=True, align='C')
    pdf.cell(30,  10, 'Rate',                         border=1, fill=True, align='C')
    pdf.cell(40,  10, 'Taxable Amount (INR)',          border=1, fill=True, align='R')
    pdf.ln()

    pdf.set_font('helvetica', '', 10)
    pdf.cell(90,  10, 'Platform Marketplace Commission', border=1)
    pdf.cell(30,  10, '998314',                           border=1, align='C')   # SAC for online marketplace
    pdf.cell(30,  10, '5%',                               border=1, align='C')
    pdf.cell(40,  10, f"INR {base_comm:.2f}",             border=1, align='R')
    pdf.ln(12)

    # ---- GST Breakdown ----
    pdf.set_x(110)
    pdf.set_font('helvetica', '', 10)
    pdf.cell(40, 7, 'Taxable Value:', align='L')
    pdf.cell(40, 7, f"INR {base_comm:.2f}", align='R', ln=True)

    if igst > 0:
        pdf.set_x(110)
        pdf.cell(40, 7, f"IGST @ {GST_RATE:.0f}%:", align='L')
        pdf.cell(40, 7, f"INR {igst:.2f}", align='R', ln=True)
    else:
        pdf.set_x(110)
        pdf.cell(40, 7, f"CGST @ {GST_RATE/2:.0f}%:", align='L')
        pdf.cell(40, 7, f"INR {cgst:.2f}", align='R', ln=True)
        pdf.set_x(110)
        pdf.cell(40, 7, f"SGST @ {GST_RATE/2:.0f}%:", align='L')
        pdf.cell(40, 7, f"INR {sgst:.2f}", align='R', ln=True)

    pdf.set_x(110)
    pdf.set_fill_color(35, 134, 54)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font('helvetica', 'B', 10)
    pdf.cell(40, 10, 'Total Invoice Amount:', fill=True, align='L')
    pdf.cell(40, 10, f"INR {total_amount:.2f}", fill=True, align='R', ln=True)
    pdf.set_text_color(0, 0, 0)
    pdf.ln(8)

    # ---- ITC Declaration ----
    pdf.set_font('helvetica', 'B', 9)
    pdf.set_fill_color(230, 255, 230)
    pdf.cell(0, 7, '  Input Tax Credit (ITC) Notice:', border=1, fill=True, ln=True)
    pdf.set_font('helvetica', '', 8)
    pdf.set_text_color(50, 100, 50)
    msg = (
        f"  The GST amount of INR {gst_amount:.2f} charged on this invoice is eligible for ITC claim by the "
        f"recipient vendor, subject to compliance with GST rules (Section 16 of CGST Act, 2017). "
        f"Ensure this invoice appears in GSTR-2A/2B before claiming."
    )
    pdf.multi_cell(0, 5, msg)
    pdf.set_text_color(0, 0, 0)

    pdf.output(output_path)
    return output_path


# ---------------------------------------------------------------------------
# Backward compat alias — old code called generate_invoice_pdf
# ---------------------------------------------------------------------------
def generate_invoice_pdf(order_data, output_path):
    """Backward-compatible alias → now generates an Order Summary (not Tax Invoice)."""
    return generate_order_summary_pdf(order_data, output_path)
