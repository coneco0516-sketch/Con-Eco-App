from database import get_db_connection
conn = get_db_connection()
cursor = conn.cursor(dictionary=True)
cursor.execute("SELECT name, category FROM Products")
print("Products:", cursor.fetchall())
cursor.execute("SELECT name, category FROM Services")
print("Services:", cursor.fetchall())
cursor.close()
conn.close()
