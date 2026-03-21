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
      const data = await resp.json();
      if (data.status === 'success') {
        alert("Order status updated to " + newStatus);
        fetchOrders();
      } else {
        alert("Error: " + data.message);
      }
    } catch (err) {
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
              <div key={o.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ color: 'white' }}>Order #{o.id} - {o.customer_name}</h4>
                  <p style={{ color: 'var(--text-secondary)' }}>{new Date(o.created_at).toLocaleDateString()}</p>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <p style={{ color: 'var(--primary-color)', fontWeight: 'bold', margin:0 }}>₹{o.total_amount}</p>
                  <select 
                    defaultValue={o.status}
                    onChange={(e) => handleStatusChange(o.id, e.target.value)}
                    style={{ background: 'var(--surface-bg)', color: 'white', border: '1px solid var(--surface-border)', padding: '4px' }}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Out for Delivery">Out for Delivery</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
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
