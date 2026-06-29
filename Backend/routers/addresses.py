from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import Optional, List
from database import get_db_connection
from routers.auth import get_current_user_from_cookie
import httpx

router = APIRouter()

class AddressCreate(BaseModel):
    label: Optional[str] = "Other"
    full_name: Optional[str] = None
    phone: Optional[str] = None
    line1: str
    line2: Optional[str] = None
    city: str
    state: str
    pincode: str
    is_default: Optional[bool] = False

@router.get("/")
def get_addresses(user=Depends(get_current_user_from_cookie)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT * FROM SavedAddresses WHERE user_id = %s AND user_type = %s ORDER BY is_default DESC, created_at DESC",
            (user['user_id'], user['role'])
        )
        addresses = cursor.fetchall()
        return {"status": "success", "addresses": addresses}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        conn.close()

@router.post("/")
def add_address(data: AddressCreate, user=Depends(get_current_user_from_cookie)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        
        # Check how many addresses exist
        cursor.execute("SELECT COUNT(*) as c FROM SavedAddresses WHERE user_id=%s AND user_type=%s", (user['user_id'], user['role']))
        count = cursor.fetchone()['c']
        
        if count >= 10:
            return {"status": "error", "message": "Maximum of 10 addresses allowed."}
            
        # If this is the first address, force it to be default
        is_default = data.is_default or count == 0
        
        if is_default:
            # Unset default for others
            cursor.execute("UPDATE SavedAddresses SET is_default=FALSE WHERE user_id=%s AND user_type=%s", (user['user_id'], user['role']))
            
        cursor.execute("""
            INSERT INTO SavedAddresses 
            (user_id, user_type, label, full_name, phone, line1, line2, city, state, pincode, is_default)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING address_id
        """, (
            user['user_id'], user['role'], data.label, data.full_name, data.phone, 
            data.line1, data.line2, data.city, data.state, data.pincode, is_default
        ))
        
        conn.commit()
        return {"status": "success", "message": "Address added successfully"}
    except Exception as e:
        conn.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        conn.close()

@router.put("/{address_id}")
def update_address(address_id: int, data: AddressCreate, user=Depends(get_current_user_from_cookie)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT * FROM SavedAddresses WHERE address_id=%s AND user_id=%s AND user_type=%s", 
                       (address_id, user['user_id'], user['role']))
        if not cursor.fetchone():
            return {"status": "error", "message": "Address not found"}
            
        if data.is_default:
            cursor.execute("UPDATE SavedAddresses SET is_default=FALSE WHERE user_id=%s AND user_type=%s", (user['user_id'], user['role']))
            
        cursor.execute("""
            UPDATE SavedAddresses SET 
            label=%s, full_name=%s, phone=%s, line1=%s, line2=%s, city=%s, state=%s, pincode=%s, is_default=%s
            WHERE address_id=%s
        """, (
            data.label, data.full_name, data.phone, data.line1, data.line2, data.city, data.state, data.pincode, data.is_default, address_id
        ))
        
        conn.commit()
        return {"status": "success", "message": "Address updated successfully"}
    except Exception as e:
        conn.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        conn.close()

@router.delete("/{address_id}")
def delete_address(address_id: int, user=Depends(get_current_user_from_cookie)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT is_default FROM SavedAddresses WHERE address_id=%s AND user_id=%s AND user_type=%s", 
                       (address_id, user['user_id'], user['role']))
        addr = cursor.fetchone()
        
        if not addr:
            return {"status": "error", "message": "Address not found"}
            
        cursor.execute("DELETE FROM SavedAddresses WHERE address_id=%s", (address_id,))
        
        # If we deleted the default address, make the newest remaining address the default
        if addr['is_default']:
            cursor.execute("""
                UPDATE SavedAddresses SET is_default=TRUE 
                WHERE address_id = (
                    SELECT address_id FROM SavedAddresses 
                    WHERE user_id=%s AND user_type=%s 
                    ORDER BY created_at DESC LIMIT 1
                )
            """, (user['user_id'], user['role']))
            
        conn.commit()
        return {"status": "success", "message": "Address deleted"}
    except Exception as e:
        conn.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        conn.close()

@router.post("/{address_id}/set_default")
def set_default(address_id: int, user=Depends(get_current_user_from_cookie)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        
        # Verify ownership
        cursor.execute("SELECT * FROM SavedAddresses WHERE address_id=%s AND user_id=%s AND user_type=%s", 
                       (address_id, user['user_id'], user['role']))
        if not cursor.fetchone():
            return {"status": "error", "message": "Address not found"}
            
        cursor.execute("UPDATE SavedAddresses SET is_default=FALSE WHERE user_id=%s AND user_type=%s", (user['user_id'], user['role']))
        cursor.execute("UPDATE SavedAddresses SET is_default=TRUE WHERE address_id=%s", (address_id,))
        
        conn.commit()
        return {"status": "success", "message": "Default address updated"}
    except Exception as e:
        conn.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        conn.close()

@router.get("/pincode/{pincode}")
async def lookup_pincode(pincode: str):
    if len(pincode) != 6 or not pincode.isdigit():
        return {"status": "error", "message": "Invalid pincode"}
        
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"https://api.postalpincode.in/pincode/{pincode}", timeout=5.0)
            data = resp.json()
            if data and isinstance(data, list) and len(data) > 0 and data[0].get("Status") == "Success":
                po = data[0]["PostOffice"][0]
                return {"status": "success", "city": po.get("District", ""), "state": po.get("State", "")}
    except Exception as e:
        print(f"Pincode lookup error: {e}")
        pass
        
    return {"status": "error", "message": "Could not fetch details", "city": "", "state": ""}
