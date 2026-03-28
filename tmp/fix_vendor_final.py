import sys
sys.path.append('Backend')
from database import get_db_connection

conn = get_db_connection()
cursor = conn.cursor()
try:
    # 1. Expand Payments status enum and add created_at if missing
    print("Repairing Payments table...")
    try:
        cursor.execute("ALTER TABLE Payments MODIFY status ENUM('Pending', 'Completed', 'Failed', 'Paid', 'Refunded') DEFAULT 'Pending'")
    except Exception as e:
        print("Enum update warning:", e)
        
    try:
        cursor.execute("ALTER TABLE Payments ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    except Exception as e:
        print("Column add warning (already exists?):", e)
    
    conn.commit()
    print("Table repair complete.")

    path = r'Backend/routers/vendor.py'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 2. Fix transaction history query in vendor.py (change p.transaction_date to o.created_at)
    # Search for p.transaction_date and replace with o.created_at
    if "p.transaction_date" in content:
        content = content.replace("p.transaction_date", "o.created_at")
        print("Updated vendor.py: Changed p.transaction_date to o.created_at")

    if "raw_date" in content and "p.transaction_date" not in content:
         # Already fixed or using o.created_at
         pass

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

except Exception as e:
    print("Fatal error:", e)
finally:
    cursor.close()
    conn.close()
