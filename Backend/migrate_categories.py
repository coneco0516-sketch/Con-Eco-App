from database import get_db_connection

def auto_categorize(name, description, item_type):
    text = (name + " " + (description or "")).lower()
    if item_type == 'product':
        if any(w in text for w in ['cement', 'konark', 'acc', 'ultratech', 'dalmia', 'jk super', 'birla']): return 'Cement'
        if any(w in text for w in ['steel', 'rebar', 'iron rod', 'tata tiscon', 'jindal', 'tmt bar']): return 'Steel'
        if any(w in text for w in ['brick', 'block', 'interlock', 'fly ash', 'clay brick']): return 'Bricks'
        if any(w in text for w in ['sand', 'aggregate', 'stone', 'crush', 'm-sand', 'river sand', 'gravel']): return 'Sand'
        if any(w in text for w in ['wire', 'switch', 'cable', 'light', 'electric', 'mcb', 'conduit', 'socket']): return 'Electrical'
        if any(w in text for w in ['pipe', 'tap', 'faucet', 'plumbing', 'pvc', 'cpvc', 'tank', 'valve', 'fixture', 'basin', 'commode']): return 'Plumbing'
    else:
        if any(w in text for w in ['labor', 'worker', 'mason', 'helper', 'contractor', 'painter', 'carpenter', 'tiles fitter']): return 'Labor'
        if any(w in text for w in ['pipe', 'tap', 'plumbing', 'leak', 'drainage', 'sanitary']): return 'Plumbing'
        if any(w in text for w in ['wire', 'electric', 'short', 'circuit', 'wiring', 'installation']): return 'Electrical'
        if any(w in text for w in ['design', 'architecture', 'blueprint', 'plan', 'structure', 'elevation', 'drawing']): return 'Architecture'
    return 'General'

def migrate_data():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Update products
    cursor.execute("SELECT product_id, name, description, category FROM Products WHERE category='General' OR category IS NULL OR category=''")
    products = cursor.fetchall()
    for p in products:
        new_cat = auto_categorize(p['name'], p['description'], 'product')
        if new_cat != 'General':
            cursor.execute("UPDATE Products SET category=%s WHERE product_id=%s", (new_cat, p['product_id']))
            print(f"Updated Product {p['product_id']} to {new_cat}")

    # Update services
    cursor.execute("SELECT service_id, name, description, category FROM Services WHERE category='General' OR category IS NULL OR category=''")
    services = cursor.fetchall()
    for s in services:
        new_cat = auto_categorize(s['name'], s['description'], 'service')
        if new_cat != 'General':
            cursor.execute("UPDATE Services SET category=%s WHERE service_id=%s", (new_cat, s['service_id']))
            print(f"Updated Service {s['service_id']} to {new_cat}")
            
    conn.commit()
    cursor.close()
    conn.close()
    print("Data migration finished!")

if __name__ == "__main__":
    migrate_data()
