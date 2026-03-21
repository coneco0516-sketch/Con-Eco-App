import mysql.connector

try:
    conn = mysql.connector.connect(
        host='caboose.proxy.rlwy.net',
        port=31353,
        user='root',
        password='XbRyzQaaWKiYnvEFBgXdWYhSruLGvPnA',
        database='railway'
    )
    cursor = conn.cursor()
    
    tables = [
        ("users", "Users"),
        ("customers", "Customers"),
        ("vendors", "Vendors"),
        ("products", "Products"),
        ("services", "Services"),
        ("cart", "Cart"),
        ("orders", "Orders"),
        ("payments", "Payments"),
        ("cartitems", "CartItems"),
        ("orderitems", "OrderItems"),
        ("bookedservices", "BookedServices"),
        ("cartservices", "CartServices"),
        ("contactmessages", "ContactMessages"),
        ("faqs", "FAQs"),
        ("otp_verifications", "OTP_Verifications"),
        ("platformsettings", "PlatformSettings"),
        ("vendorearnings", "VendorEarnings"),
        ("vendorreviews", "VendorReviews")
    ]
    
    for old, new in tables:
        try:
            cursor.execute(f"RENAME TABLE {old} TO {new}")
            print(f"Renamed {old} -> {new}")
        except Exception as e:
            print(f"Failed to rename {old} (might already be capitalized): {e}")

    conn.commit()
    cursor.close()
    conn.close()
    print("Done renaming tables!")
except Exception as e:
    print("Connection error:", e)
