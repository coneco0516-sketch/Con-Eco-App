path = r'Backend/routers/vendor.py'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: sql_combined Select All (ensure raw_date is available for ordering)
# Previous: SELECT date, description, CAST(gross AS CHAR) as gross, CAST(commission AS CHAR) as commission, CAST(net AS CHAR) as net, status FROM (
# Change: SELECT * FROM (
if "SELECT date, description, CAST(gross AS CHAR) as gross, CAST(commission AS CHAR) as commission, CAST(net AS CHAR) as net, status FROM (" in content:
    content = content.replace(
        "SELECT date, description, CAST(gross AS CHAR) as gross, CAST(commission AS CHAR) as commission, CAST(net AS CHAR) as net, status FROM (",
        "SELECT * FROM ("
    )
    print("Updated vendor.py: Changed outer SELECT to * to ensure raw_date is available for ORDER BY.")

# Fix 2: CAST within subqueries to ensure consistent types for UNION
# Sometimes MySQL gets grumpy about UNION ALL with CHAR vs DECIMAL
# But let's stick to selecting all columns for now.

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Vendor.py SQL fixed (ORDER BY bug).")
