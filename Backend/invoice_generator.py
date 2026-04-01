from fpdf import FPDF
from datetime import datetime
import os

class InvoicePDF(FPDF):
    def header(self):
        # Logo or Platform Name
        self.set_font('helvetica', 'B', 24)
        self.set_text_color(35, 134, 54) # ConEco Green
        self.cell(0, 10, 'ConEco', ln=True, align='L')
        
        self.set_font('helvetica', '', 10)
        self.set_text_color(100, 100, 100)
        self.cell(0, 5, 'Connectivity & Ecology Marketplace', ln=True, align='L')
        
        self.set_y(10)
        self.set_font('helvetica', 'B', 16)
        self.set_text_color(0, 0, 0)
        self.cell(0, 10, 'TAX INVOICE', ln=True, align='R')
        self.ln(10)

    def footer(self):
        self.set_y(-25)
        self.set_font('helvetica', 'I', 8)
        self.set_text_color(128, 128, 128)
        self.cell(0, 10, 'This is a computer generated invoice and does not require a physical signature.', align='C', ln=True)
        self.cell(0, 5, f'Page {self.page_no()}', align='C')

def clean_text(text):
    """Encodes text to latin-1 to avoid PDF generation errors with special characters."""
    if not text: return ""
    return str(text).encode('latin-1', 'replace').decode('latin-1')

def generate_invoice_pdf(order_data, output_path):
    pdf = InvoicePDF()
    pdf.add_page()
    
    # Pre-clean data for safety
    cust_name = clean_text(order_data.get('customer_name', 'Guest'))
    order_id = order_data.get('order_id', '0')
    cust_phone = clean_text(order_data.get('customer_phone', ''))
    date = clean_text(order_data.get('date', ''))
    addr = clean_text(order_data.get('delivery_address', ''))
    status = clean_text(order_data.get('status', ''))
    vend_name = clean_text(order_data.get('vendor_name', ''))
    vend_email = clean_text(order_data.get('vendor_email', ''))
    item_name = clean_text(order_data.get('item_name', ''))
    order_type = clean_text(order_data.get('order_type', ''))
    payment_method = clean_text(order_data.get('payment_method', ''))
    payment_status = clean_text(order_data.get('payment_status', ''))
    
    quantity = order_data.get('quantity', 1)
    amount = float(order_data.get('amount') or 0)
    base_amount = float(order_data.get('base_amount') or 0)
    commission_amount = float(order_data.get('commission_amount') or 0)

    # Order Info Section
    pdf.set_font('helvetica', 'B', 11)
    pdf.cell(95, 7, 'Billed To:', ln=False)
    pdf.cell(95, 7, 'Order Details:', ln=True)
    
    pdf.set_font('helvetica', '', 10)
    # Left Side: Customer
    pdf.cell(95, 5, f"Name: {cust_name}", ln=False)
    # Right Side: Order Info
    pdf.cell(95, 5, f"Order ID: #{order_id}", ln=True)
    
    pdf.cell(95, 5, f"Phone: {cust_phone}", ln=False)
    pdf.cell(95, 5, f"Date: {date}", ln=True)
    
    pdf.cell(95, 5, f"Address: {addr[:45]}", ln=False)
    pdf.cell(95, 5, f"Status: {status}", ln=True)
    
    if len(addr) > 45:
        pdf.cell(95, 5, f"{addr[45:90]}", ln=True)
    
    pdf.ln(10)
    
    # Vendor Info Section
    pdf.set_font('helvetica', 'B', 11)
    pdf.cell(0, 7, 'Vendor Information:', ln=True)
    pdf.set_font('helvetica', '', 10)
    pdf.cell(0, 5, f"Company: {vend_name}", ln=True)
    if vend_email:
        pdf.cell(0, 5, f"Email: {vend_email}", ln=True)
    
    pdf.ln(10)
    
    # Table Header
    pdf.set_fill_color(240, 240, 240)
    pdf.set_font('helvetica', 'B', 10)
    pdf.cell(100, 10, 'Item Description', border=1, fill=True)
    pdf.cell(30, 10, 'Type', border=1, fill=True, align='C')
    pdf.cell(20, 10, 'Qty', border=1, fill=True, align='C')
    pdf.cell(40, 10, 'Total (INR)', border=1, fill=True, align='R')
    pdf.ln()
    
    # Table Content
    pdf.set_font('helvetica', '', 10)
    pdf.cell(100, 10, item_name, border=1)
    pdf.cell(30, 10, order_type, border=1, align='C')
    pdf.cell(20, 10, str(quantity), border=1, align='C')
    pdf.cell(40, 10, f"INR {amount:.2f}", border=1, align='R')
    pdf.ln(12)
    
    # Totals
    pdf.set_x(130)
    pdf.set_font('helvetica', 'B', 10)
    pdf.cell(30, 8, 'Subtotal:', align='L')
    pdf.cell(30, 8, f"INR {base_amount:.2f}", align='R', ln=True)
    
    pdf.set_x(130)
    pdf.cell(30, 8, 'Commission (5%):', align='L')
    pdf.cell(30, 8, f"INR {commission_amount:.2f}", align='R', ln=True)
    
    pdf.set_x(130)
    pdf.set_fill_color(35, 134, 54)
    pdf.set_text_color(255, 255, 255)
    pdf.cell(30, 10, 'Grand Total:', fill=True, align='L')
    pdf.cell(30, 10, f"INR {amount:.2f}", fill=True, align='R', ln=True)
    
    pdf.set_text_color(0, 0, 0)
    pdf.ln(10)
    
    # Payment Method
    pdf.set_font('helvetica', 'B', 10)
    pdf.cell(0, 5, f"Payment Method: {payment_method}", ln=True)
    pdf.set_font('helvetica', '', 9)
    pdf.cell(0, 5, f"Payment Status: {payment_status}", ln=True)

    pdf.output(output_path)
    return output_path
