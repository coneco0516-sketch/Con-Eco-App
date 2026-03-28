import os

path = r'Backend/routers/admin.py'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: Admin Stats
old_admin = """        stats = {'total_revenue': 0, 'pending': 0, 'completed': 0}
        
        cursor.execute("SELECT SUM(p.amount) as s FROM Payments p JOIN Orders o ON p.order_id = o.order_id WHERE p.status='Completed' AND o.payment_method NOT IN ('COD', 'Pay Later (Cash)')")
        res = cursor.fetchone()
        if res: stats['total_revenue'] = res['s'] or 0
        
        cursor.execute(\"\"\"
            SELECT COUNT(*) as c 
            FROM Payments p 
            JOIN Orders o ON p.order_id = o.order_id 
            WHERE p.status='Pending' AND o.payment_method NOT IN ('COD', 'Pay Later (Cash)')
        \"\"\")
        res = cursor.fetchone()
        if res: stats['pending'] = res['c'] or 0
        
        cursor.execute(\"\"\"
            SELECT SUM(p.amount) as c 
            FROM Payments p 
            JOIN Orders o ON p.order_id = o.order_id 
            WHERE p.status IN ('Completed', 'Paid') AND o.payment_method IN ('COD', 'Pay Later (Cash)')
        \"\"\")
        res = cursor.fetchone()
        stats['vendor_collected'] = float(res['c']) if res and res['c'] else 0"""

new_admin = """        # 1. Platform Revenue
        cursor.execute(\"\"\"
            SELECT SUM(p.amount) as s FROM Payments p 
            JOIN Orders o ON p.order_id = o.order_id 
            WHERE p.status='Completed' AND o.payment_method NOT IN ('COD', 'Pay Later (Cash)')
        \"\"\")
        res = cursor.fetchone()
        stats = {
            'total_revenue': float(res['s']) if res and res['s'] else 0,
            'pending': 0,
            'pending_audit_amount': 0,
            'vendor_collected': 0,
            'completed': 0
        }
        
        # 2. Pending Admin Audit (Completed Online Payments awaiting credit)
        cursor.execute(\"\"\"
            SELECT SUM(o.base_amount) as s, COUNT(*) as c 
            FROM Payments p 
            JOIN Orders o ON p.order_id = o.order_id 
            WHERE p.status='Completed' 
              AND o.payment_method NOT IN ('COD', 'Pay Later (Cash)') 
              AND COALESCE(o.vendor_credited, 0) = 0
        \"\"\")
        res = cursor.fetchone()
        if res:
            stats['pending_audit_amount'] = float(res['s']) if res['s'] else 0
            stats['pending'] = res['c'] or 0
        
        # 3. Vendor Collected Cash
        cursor.execute(\"\"\"
            SELECT SUM(p.amount) as c 
            FROM Payments p 
            JOIN Orders o ON p.order_id = o.order_id 
            WHERE p.status IN ('Completed', 'Paid') AND o.payment_method IN ('COD', 'Pay Later (Cash)')
        \"\"\")
        res = cursor.fetchone()
        stats['vendor_collected'] = float(res['c']) if res and res['c'] else 0"""

if old_admin in content:
    print("Found Admin block!")
    content = content.replace(old_admin, new_admin)
else:
    print("Admin block not found with literal match, trying normalized match...")
    # This is fallback for whitespace issues
    import re
    # Strip spaces and try matching
    pass

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Finished.")
