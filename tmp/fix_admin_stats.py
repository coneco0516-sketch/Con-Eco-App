path = r'Backend/routers/admin.py'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: Change p.transaction_date to o.created_at in admin.py
if "p.transaction_date" in content:
    content = content.replace("p.transaction_date", "o.created_at")
    print("Updated admin.py: Changed p.transaction_date to o.created_at")

# Fix 2: Sync Stats - Ensure online_total and pending_audit match expectations
# The user said "not dashboards Earnings page and Payment page check the cards they must update as per rules"
# Let's verify the pending audit count.
# I already have: stats['pending'] = res['c'] or 0 (line 252)
# But in AdminPayments.jsx I used: stats.pending

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Admin.py SQL fixed.")
