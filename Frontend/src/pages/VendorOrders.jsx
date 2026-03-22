import React, { useState, useEffect } from 'react';
import VendorSidebar from '../components/VendorSidebar';

function VendorOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = () => {
    setLoading(true);
    fetch('/api/vendor/orders', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.orders) setOrders(data.orders);
        setLoading(false);
      })
      .catch(err => setLoading(false));
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const resp = await fetch('/api/vendor/orders/update_status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, status: newStatus }),
        credentials: 'include'
      });
      
      const contentType = resp.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await resp.json();
        if (data.status === 'success') {
          alert("Order status updated to " + (newStatus === 'Processing' ? 'Accepted' : newStatus));
          fetchOrders();
        } else {
          alert("Error: " + data.message);
        }
      } else {
        const text = await resp.text();
        console.error("Server returned non-JSON response:", text);
        alert(`Server error (${resp.status}). See console for details.`);
      }
    } catch (err) {
      console.error("Status update failed:", err);
      alert("Network error updating status.");
    }
  };

  return (
    <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
      <VendorSidebar />
      <main style={{ flex: 1 }}>
        <h2 style={{ fontSize: '2rem', color: 'white', marginTop: 0 }}>Incoming Orders</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Track requests, update shipping statuses, and process deliveries.</p>
        <hr style={{ borderColor: 'var(--surface-border)', marginBottom: '1.5rem' }} />
        
        {loading ? (
          <p>Loading orders...</p>
        ) : orders.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {orders.map(o => (
              <div key={o.order_id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ color: 'white', margin: '0 0 0.5rem 0' }}>Order #{o.order_id} - {o.customer_name}</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 0.5rem 0' }}>Ordered on: {o.date}</p>
                  <div style={{ background: 'rgba(0,0,0,0.1)', padding: '0.75rem', borderRadius: '4px', borderLeft: '3px solid var(--primary-color)', marginBottom: '0.5rem' }}>
                    <p style={{ color: 'white', fontSize: '0.85rem', fontWeight: 'bold', margin: '0 0 0.25rem 0' }}>Delivery Address:</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>{o.delivery_address || 'No address provided'}</p>
                  </div>
                  <p style={{ color: 'white', fontSize: '0.9rem', marginBottom: 0 }}>
                    Payment: <span style={{ color: '#ffd700', fontWeight: 'bold' }}>{o.payment_method}</span>
                  </p>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '180px' }}>
                  <p style={{ color: 'var(--primary-color)', fontWeight: 'bold', margin:0, fontSize: '1.2rem' }}>₹{o.amount}</p>
                  
                  {o.payment_method === 'Pay Later' && o.status === 'Pending' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <p style={{ color: '#ffd700', fontSize: '0.8rem', margin: 0, fontWeight: 'bold' }}>CREDIT REQUEST</p>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => handleStatusChange(o.order_id, 'Processing')}
                          style={{ background: 'var(--primary-color)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', flex: 1 }}
                        >
                          Approve Credit
                        </button>
                        <button 
                          onClick={() => handleStatusChange(o.order_id, 'Cancelled')}
                          style={{ background: 'var(--danger-color)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', flex: 1 }}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ) : (
                    <select 
                      defaultValue={o.status}
                      onChange={(e) => handleStatusChange(o.order_id, e.target.value)}
                      style={{ 
                        background: 'rgba(0,0,0,0.3)', 
                        color: 'white', 
                        border: '1px solid var(--surface-border)', 
                        padding: '8px',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Processing">Processing / Accepted</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Out for Delivery">Out for Delivery</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
             <h3 style={{ color: 'var(--text-secondary)' }}>No incoming orders at the moment.</h3>
          </div>
        )}
      </main>
    </div>
  );
}

export default VendorOrders;
