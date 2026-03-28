path = r'Backend/routers/vendor.py'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix: sql_combined build logic to avoid format character collision
old_combined = 'sql_combined = f"""'
new_combined = 'sql_combined = """' # Remove f-string

# We also need to fix the placeholders in the combined query because the sub-queries are included literally
# Actually, if we remove f-string, we must use concatenation
# Looking at the code:
# sql_combined = f"""
#     SELECT ... FROM (
#         ({sql_payments})
#         UNION ALL
#         ({sql_payouts})
#     ) as combined
#     ORDER BY raw_date DESC
# """

if 'sql_combined = f"""' in content:
    # Use concatenation instead of f-string
    content = content.replace('sql_combined = f"""', 'sql_combined = """')
    # And replace the variable interpolations
    content = content.replace('({sql_payments})', '" + sql_payments + "')
    content = content.replace('({sql_payouts})', '" + sql_payouts + "')
    # Wait, that's for normal strings. Let's do a cleaner replacement.
    
    better_combined = """        sql_combined = \"\"\"
            SELECT date, description, CAST(gross AS CHAR) as gross, CAST(commission AS CHAR) as commission, CAST(net AS CHAR) as net, status FROM (
                (\"\"\" + sql_payments + \"\"\")
                UNION ALL
                (\"\"\" + sql_payouts + \"\"\")
            ) as combined
            ORDER BY raw_date DESC
        \"\"\""""
    
    import re
    # Find the block and replace
    target_pattern = r'sql_combined = f""".*?ORDER BY raw_date DESC\s+"""'
    content = re.sub(target_pattern, better_combined, content, flags=re.DOTALL)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Vendor.py combined SQL fixed.")
