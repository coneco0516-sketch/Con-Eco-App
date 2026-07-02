from fastapi import APIRouter, Depends, HTTPException
from database import get_db_connection
from routers.vendor import check_vendor
from routers.customer import check_customer
from pydantic import BaseModel
from typing import List, Optional
from datetime import date

router = APIRouter()

class MilestoneItem(BaseModel):
    title: str
    description: Optional[str] = None
    scheduled_date: Optional[date] = None
    payment_percentage: int

class MilestonePlan(BaseModel):
    milestones: List[MilestoneItem]

@router.get("/{order_id}")
def get_order_milestones(order_id: int):
    """Fetch all milestones for a service order."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        # Fetch order details to check if it is a service order
        cursor.execute("SELECT order_type, amount, status FROM Orders WHERE order_id = %s", (order_id,))
        order = cursor.fetchone()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        # Fetch milestones
        cursor.execute("""
            SELECT milestone_id, order_id, title, description, 
                   TO_CHAR(scheduled_date, 'YYYY-MM-DD') as scheduled_date, 
                   payment_percentage, payment_amount, status, vendor_note, customer_note,
                   TO_CHAR(completed_at, 'YYYY-MM-DD HH24:MI:SS') as completed_at,
                   TO_CHAR(approved_at, 'YYYY-MM-DD HH24:MI:SS') as approved_at
            FROM ServiceMilestones 
            WHERE order_id = %s 
            ORDER BY milestone_id ASC
        """, (order_id,))
        milestones = cursor.fetchall()
        
        return {
            "status": "success",
            "order_type": order["order_type"],
            "order_amount": float(order["amount"] or 0),
            "order_status": order["status"],
            "milestones": milestones
        }
    finally:
        conn.close()

@router.post("/vendor/orders/{order_id}/milestones")
def create_milestone_plan(order_id: int, plan: MilestonePlan, user = Depends(check_vendor)):
    """Create or replace milestone plan for a service order."""
    vendor_id = user['user_id']
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        
        # Verify order belongs to this vendor and is a Service
        cursor.execute("""
            SELECT order_id, order_type, amount, status 
            FROM Orders 
            WHERE order_id = %s AND vendor_id = %s
        """, (order_id, vendor_id))
        order = cursor.fetchone()
        
        if not order:
            raise HTTPException(status_code=404, detail="Order not found or access denied")
        if order["order_type"] != "Service":
            raise HTTPException(status_code=400, detail="Milestones can only be created for Service bookings")
            
        # Verify that sum of percentages is exactly 100
        total_pct = sum(m.payment_percentage for m in plan.milestones)
        if total_pct != 100:
            raise HTTPException(status_code=400, detail="The sum of milestone percentages must equal exactly 100%")
            
        # Verify if any milestone is already completed/approved, which blocks resetting the plan
        cursor.execute("SELECT COUNT(*) as c FROM ServiceMilestones WHERE order_id = %s AND status IN ('Done', 'Approved')", (order_id,))
        progress = cursor.fetchone()
        if progress and progress["c"] > 0:
            raise HTTPException(status_code=400, detail="Cannot update plan as some milestones are already completed or approved")
            
        # Clear existing plan
        cursor.execute("DELETE FROM ServiceMilestones WHERE order_id = %s", (order_id,))
        
        order_amount = float(order["amount"] or 0)
        
        # Insert new milestones
        for m in plan.milestones:
            payment_amount = round(order_amount * m.payment_percentage / 100, 2)
            cursor.execute("""
                INSERT INTO ServiceMilestones (order_id, title, description, scheduled_date, payment_percentage, payment_amount, status)
                VALUES (%s, %s, %s, %s, %s, %s, 'Pending')
            """, (order_id, m.title, m.description, m.scheduled_date, m.payment_percentage, payment_amount))
            
        # Automatically update order status to Scheduled if it was Pending or Confirmed
        if order["status"] in ["Pending", "Confirmed"]:
            cursor.execute("UPDATE Orders SET status = 'Scheduled' WHERE order_id = %s", (order_id,))
            
        conn.commit()
        return {"status": "success", "message": "Milestone plan created successfully"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

class MilestoneNote(BaseModel):
    note: Optional[str] = None

@router.put("/vendor/milestones/{milestone_id}/complete")
def complete_milestone(milestone_id: int, data: MilestoneNote, user = Depends(check_vendor)):
    """Mark a milestone as completed by the vendor."""
    vendor_id = user['user_id']
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        
        # Verify milestone exists and order belongs to this vendor
        cursor.execute("""
            SELECT sm.milestone_id, sm.status, o.order_id, o.vendor_id
            FROM ServiceMilestones sm
            JOIN Orders o ON sm.order_id = o.order_id
            WHERE sm.milestone_id = %s AND o.vendor_id = %s
        """, (milestone_id, vendor_id))
        milestone = milestone = cursor.fetchone()
        
        if not milestone:
            raise HTTPException(status_code=404, detail="Milestone not found or access denied")
        if milestone["status"] != "Pending" and milestone["status"] != "In Progress":
            raise HTTPException(status_code=400, detail=f"Milestone is already {milestone['status']}")
            
        # Update milestone status to 'Done'
        cursor.execute("""
            UPDATE ServiceMilestones 
            SET status = 'Done', vendor_note = %s, completed_at = CURRENT_TIMESTAMP
            WHERE milestone_id = %s
        """, (data.note, milestone_id))
        
        # Update order status to 'In Progress' if it wasn't already
        cursor.execute("UPDATE Orders SET status = 'In Progress' WHERE order_id = %s AND status != 'In Progress'", (milestone["order_id"],))
        
        conn.commit()
        return {"status": "success", "message": "Milestone marked as completed, awaiting customer approval"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.put("/customer/milestones/{milestone_id}/approve")
def approve_milestone(milestone_id: int, data: MilestoneNote, user = Depends(check_customer)):
    """Approve a milestone by the customer (releases payment)."""
    customer_id = user['user_id']
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        
        # Verify milestone exists and order belongs to this customer
        cursor.execute("""
            SELECT sm.milestone_id, sm.status, o.order_id, o.customer_id
            FROM ServiceMilestones sm
            JOIN Orders o ON sm.order_id = o.order_id
            WHERE sm.milestone_id = %s AND o.customer_id = %s
        """, (milestone_id, customer_id))
        milestone = cursor.fetchone()
        
        if not milestone:
            raise HTTPException(status_code=404, detail="Milestone not found or access denied")
        if milestone["status"] != "Done":
            raise HTTPException(status_code=400, detail="Only completed milestones can be approved")
            
        # Update milestone status to 'Approved'
        cursor.execute("""
            UPDATE ServiceMilestones 
            SET status = 'Approved', customer_note = %s, approved_at = CURRENT_TIMESTAMP
            WHERE milestone_id = %s
        """, (data.note, milestone_id))
        
        # Check if all milestones for this order are approved
        order_id = milestone["order_id"]
        cursor.execute("SELECT COUNT(*) as c FROM ServiceMilestones WHERE order_id = %s AND status != 'Approved'", (order_id,))
        remaining = cursor.fetchone()
        
        if remaining and remaining["c"] == 0:
            # All milestones approved -> Mark order and payment as Completed!
            cursor.execute("UPDATE Orders SET status = 'Completed' WHERE order_id = %s", (order_id,))
            cursor.execute("UPDATE Payments SET status = 'Completed' WHERE order_id = %s", (order_id,))
            
            # Trigger referral milestone check
            try:
                from routers.referrals import trigger_referral_check_for_order
                trigger_referral_check_for_order(order_id, conn)
            except Exception as e:
                print(f"[REFERRAL] Error triggering check on milestone complete: {e}")
            
        conn.commit()
        return {"status": "success", "message": "Milestone approved and payment released"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
