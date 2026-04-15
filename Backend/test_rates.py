from database import get_db_connection, get_platform_setting
import json

def test_earnings():
    # Mocking a vendor ID (let's use 2 since we know it has an order)
    vendor_id = 2
    
    current_rates = {
        "product_commission_pct": float(get_platform_setting("product_commission_pct", 3.0)),
        "service_commission_pct": float(get_platform_setting("service_commission_pct", 3.0))
    }
    
    print("Fetched Rates:", current_rates)

if __name__ == "__main__":
    test_earnings()
