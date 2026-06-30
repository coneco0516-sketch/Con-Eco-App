from fastapi import APIRouter, Depends, HTTPException
from database import get_db_connection
from routers.vendor import check_vendor
from routers.customer import check_customer
from routers.auth import get_current_user_from_cookie
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class MessagePayload(BaseModel):
    message: Optional[str] = None
    offer_price: Optional[float] = None


class AcceptOfferPayload(BaseModel):
    msg_id: int


def _verify_order_access(cursor, order_id: int, user_id: int, role: str):
    """Verify the user has access to this order's negotiation thread."""
    if role == "Vendor":
        cursor.execute(
            "SELECT order_id, is_bulk_request FROM Orders WHERE order_id = %s AND vendor_id = %s",
            (order_id, user_id)
        )
    else:
        cursor.execute(
            """SELECT o.order_id, o.is_bulk_request 
               FROM Orders o
               JOIN Customers c ON o.customer_id = c.customer_id
               WHERE o.order_id = %s AND c.customer_id = %s""",
            (order_id, user_id)
        )
    order = cursor.fetchone()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found or access denied")
    return order


@router.get("/{order_id}")
def get_negotiation_thread(order_id: int, user=Depends(get_current_user_from_cookie)):
    """Fetch all negotiation messages for an order. Accessible to both Customer and Vendor."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)

        # Check access by role
        role = user["role"]
        user_id = user["user_id"]
        if role == "Vendor":
            cursor.execute(
                "SELECT order_id FROM Orders WHERE order_id = %s AND vendor_id = %s",
                (order_id, user_id)
            )
        else:
            cursor.execute(
                """SELECT o.order_id FROM Orders o
                   JOIN Customers c ON o.customer_id = c.customer_id
                   WHERE o.order_id = %s AND c.customer_id = %s""",
                (order_id, user_id)
            )
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Order not found or access denied")

        cursor.execute("""
            SELECT nm.msg_id, nm.order_id, nm.sender_role, nm.sender_id,
                   nm.message, nm.offer_price, nm.is_accepted,
                   TO_CHAR(nm.created_at, 'DD Mon YYYY HH24:MI') as created_at,
                   u.name as sender_name
            FROM NegotiationMessages nm
            JOIN Users u ON nm.sender_id = u.user_id
            WHERE nm.order_id = %s
            ORDER BY nm.created_at ASC
        """, (order_id,))
        messages = cursor.fetchall()

        return {"status": "success", "messages": messages}
    finally:
        conn.close()


@router.post("/{order_id}/message")
def send_negotiation_message(order_id: int, payload: MessagePayload, user=Depends(get_current_user_from_cookie)):
    """Send a plain message or a price counter-offer."""
    if not payload.message and payload.offer_price is None:
        raise HTTPException(status_code=400, detail="Provide a message or an offer price")

    role = user["role"]
    user_id = user["user_id"]

    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)

        # Verify access
        if role == "Vendor":
            cursor.execute(
                "SELECT order_id, is_bulk_request, status FROM Orders WHERE order_id = %s AND vendor_id = %s",
                (order_id, user_id)
            )
        else:
            cursor.execute(
                """SELECT o.order_id, o.is_bulk_request, o.status 
                   FROM Orders o
                   JOIN Customers c ON o.customer_id = c.customer_id
                   WHERE o.order_id = %s AND c.customer_id = %s""",
                (order_id, user_id)
            )
        order = cursor.fetchone()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found or access denied")
        if order["status"] in ("Completed", "Cancelled", "Delivered"):
            raise HTTPException(status_code=400, detail="Cannot send messages on a closed order")

        cursor.execute("""
            INSERT INTO NegotiationMessages (order_id, sender_role, sender_id, message, offer_price)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING msg_id
        """, (order_id, role, user_id, payload.message, payload.offer_price))
        msg = cursor.fetchone()
        conn.commit()

        return {"status": "success", "msg_id": msg["msg_id"], "message": "Message sent"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.post("/{order_id}/accept")
def accept_price_offer(order_id: int, payload: AcceptOfferPayload, user=Depends(check_vendor)):
    """Vendor accepts a price offer — marks the message as accepted and updates order amount."""
    vendor_id = user["user_id"]

    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)

        # Verify this order belongs to vendor
        cursor.execute(
            "SELECT order_id, amount, quantity FROM Orders WHERE order_id = %s AND vendor_id = %s",
            (order_id, vendor_id)
        )
        order = cursor.fetchone()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found or access denied")

        # Fetch the specific message
        cursor.execute(
            "SELECT msg_id, offer_price, is_accepted FROM NegotiationMessages WHERE msg_id = %s AND order_id = %s",
            (payload.msg_id, order_id)
        )
        msg = cursor.fetchone()
        if not msg:
            raise HTTPException(status_code=404, detail="Message not found")
        if msg["offer_price"] is None:
            raise HTTPException(status_code=400, detail="This message has no price offer")
        if msg["is_accepted"]:
            raise HTTPException(status_code=400, detail="This offer is already accepted")

        new_amount = float(msg["offer_price"]) * int(order.get("quantity", 1))

        # Mark message as accepted
        cursor.execute("UPDATE NegotiationMessages SET is_accepted = TRUE WHERE msg_id = %s", (payload.msg_id,))

        # Update order amount and status to Processing (Accepted)
        cursor.execute("""
            UPDATE Orders 
            SET amount = %s, negotiated_price = %s, status = 'Processing', vendor_message = 'Price offer accepted via negotiation chat.'
            WHERE order_id = %s
        """, (new_amount, msg["offer_price"], order_id))

        conn.commit()
        return {"status": "success", "message": f"Price offer of ₹{msg['offer_price']} accepted. Order amount updated to ₹{new_amount}."}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
