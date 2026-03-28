path = r'Backend/routers/vendor.py'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: Update dashboard total_earnings query to be more inclusive
old_dash_earnings = "cursor.execute(\"SELECT SUM(amount) as s FROM Orders WHERE vendor_id=%s AND status='Completed'\", (vendor_id,))"
new_dash_earnings = """# Count gross sales for all orders with successful payments OR completed status
        cursor.execute(\"\"\"
            SELECT SUM(o.amount) as s 
            FROM Orders o 
            LEFT JOIN Payments p ON o.order_id = p.order_id 
            WHERE o.vendor_id=%s AND (o.status='Completed' OR p.status IN ('Completed', 'Paid'))
        \"\"\", (vendor_id,))"""

if old_dash_earnings in content:
    content = content.replace(old_dash_earnings, new_dash_earnings)

# Fix 2: pending_cod query (should ignore 'Paid' items)
old_pending_cod = "WHERE o.vendor_id=%s AND p.status != 'Completed' AND o.payment_method IN ('COD', 'Pay Later (Cash)')"
new_pending_cod = "WHERE o.vendor_id=%s AND p.status NOT IN ('Completed', 'Paid') AND o.payment_method IN ('COD', 'Pay Later (Cash)')"

if old_pending_cod in content:
    content = content.replace(old_pending_cod, new_pending_cod)

# Fix 3: total_gross/total and backward compatibility 'total' in vendor_earnings route
old_earnings_gross = "cursor.execute(\"SELECT SUM(amount) as s FROM Orders WHERE vendor_id=%s AND status='Completed'\", (vendor_id,))"
new_earnings_gross = """# Calculate Gross Total (Completed or Paid)
        cursor.execute(\"\"\"
            SELECT SUM(o.amount) as s 
            FROM Orders o 
            LEFT JOIN Payments p ON o.order_id = p.order_id 
            WHERE o.vendor_id=%s AND (o.status='Completed' OR p.status IN ('Completed', 'Paid'))
        \"\"\", (vendor_id,))"""

# Since old_earnings_gross might be identical to old_dash_earnings, we need a smarter approach or do it sequentially
# Actually they are identical. Let's find unique context or replace both.
content = content.replace(old_earnings_gross, new_earnings_gross)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Vendor.py updated.")
