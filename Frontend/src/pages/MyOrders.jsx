import React, { useState, useEffect } from 'react';
import CustomerSidebar from '../components/CustomerSidebar';

function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/customer/my_orders', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.orders) setOrders(data.orders);
        setLoading(false);
      })
      .catch(err => setLoading(false));
  }, []);

  return (
    <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
      <CustomerSidebar />
      <main style={{ flex: 1 }}>
        <h2 style={{ fontSize: '2rem', color: 'white', marginTop: 0 }}>My Orders</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>View your placed orders for products.</p>
        <hr style={{ borderColor: 'var(--surface-border)', marginBottom: '1.5rem' }} />
        
        {loading ? (
          <p>Loading your orders...</p>
        ) : orders.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {orders.map(o => (
              <div key={o.order_id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ color: 'white', margin: '0 0 0.5rem 0' }}>{o.item_name} (Order #{o.order_id})</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 0.25rem 0' }}>Vendor: {o.vendor_name}</p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 0.5rem 0' }}>Ordered on: {o.date}</p>
                  <div style={{ background: 'rgba(0,0,0,0.1)', padding: '0.5rem 0.75rem', borderRadius: '4px', borderLeft: '3px solid var(--primary-color)' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}><strong>Deliver to:</strong> {o.delivery_address || 'Not specified'}</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ color: 'var(--primary-color)', fontWeight: 'bold', fontSize: '1.1rem', margin: '0 0 0.5rem 0' }}>₹{o.amount}</p>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    fontSize: '0.8rem', 
                    fontWeight: 'bold',
                    background: o.status === 'Pending' ? 'rgba(210, 109, 14, 0.2)' : o.status === 'Paid' ? 'rgba(35, 134, 54, 0.2)' : 'rgba(35, 134, 54, 0.5)', 
                    color: o.status === 'Pending' ? '#d26d0e' : '#238636',
                    border: `1px solid ${o.status === 'Pending' ? '#d26d0e' : '#238636'}`
                  }}>
                    {o.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
             <h3 style={{ color: 'var(--text-secondary)' }}>No orders found.</h3>
          </div>
        )}
      </main>
    </div>
  );
}

export default MyOrders;
