import mysql.connector
from database import get_db_connection

def auto_categorize(name, description, item_type):
    text = (name + " " + (description or "")).lower()
    if item_type == 'product':
        if any(w in text for w in ['cement', 'konark', 'acc', 'ultratech']): return 'Cement'
        if any(w in text for w in ['steel', 'rebars', 'iron rod', 'tata tiscon']): return 'Steel'
        if any(w in text for w in ['brick', 'block', 'interlock']): return 'Bricks'
        if any(w in text for w in ['sand', 'aggregate', 'stone', 'crush']): return 'Sand'
        if any(w in text for w in ['wire', 'switch', 'cable', 'light', 'electric']): return 'Electrical'
        if any(w in text for w in ['pipe', 'tap', 'faucet', 'plumbing', 'pvc']): return 'Plumbing'
    else:
        if any(w in text for w in ['labor', 'worker', 'mason', 'helper']): return 'Labor'
        if any(w in text for w in ['pipe', 'tap', 'plumbing', 'leak']): return 'Plumbing'
        if any(w in text for w in ['wire', 'electric', 'short', 'circuit']): return 'Electrical'
        if any(w in text for w in ['design', 'architecture', 'blueprint', 'plan']): return 'Architecture'
    return 'General'

def migrate():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Update products
    cursor.execute("SELECT product_id, name, description, category FROM Products WHERE category='General'")
    products = cursor.fetchall()
    for p in products:
        new_cat = auto_categorize(p['name'], p['description'], 'product')
        if new_cat != 'General':
            cursor.execute("UPDATE Products SET category=%s WHERE product_id=%s", (new_cat, p['product_id']))
            print(f"Updated Product {p['product_id']} ({p['name']}) to {new_cat}")

    # Update services
    cursor.execute("SELECT service_id, name, description, category FROM Services WHERE category='General'")
    services = cursor.fetchall()
    for s in services:
        new_cat = auto_categorize(s['name'], s['description'], 'service')
        if new_cat != 'General':
            cursor.execute("UPDATE Services SET category=%s WHERE service_id=%s", (new_cat, s['service_id']))
            print(f"Updated Service {s['service_id']} ({s['name']}) to {new_cat}")
            
    conn.commit()
    cursor.close()
    conn.close()

if __name__ == "__main__":
    migrate()
