import React, { useEffect, useState } from 'react';
import AdminSidebar from '../components/AdminSidebar';

function AdminOrders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetch('/api/admin/orders', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setOrders(data.orders);
        }
      })
      .catch(err => console.error("Error loading orders:", err));
  }, []);

  return (
    <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
      <AdminSidebar />
      <main style={{ flex: 1 }}>
        <h2 style={{ fontSize: '2rem', color: 'white', marginTop: 0 }}>All Orders Overview</h2>
        <hr style={{ borderColor: 'var(--surface-border)', marginBottom: '1.5rem' }} />

        <section className="glass-panel" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: 'rgba(0,0,0,0.3)' }}>
              <tr>
                <th style={{ padding: '15px', borderBottom: '1px solid var(--surface-border)' }}>Order ID</th>
                <th style={{ padding: '15px', borderBottom: '1px solid var(--surface-border)' }}>Customer</th>
                <th style={{ padding: '15px', borderBottom: '1px solid var(--surface-border)' }}>Vendor</th>
                <th style={{ padding: '15px', borderBottom: '1px solid var(--surface-border)' }}>Type</th>
                <th style={{ padding: '15px', borderBottom: '1px solid var(--surface-border)' }}>Amount</th>
                <th style={{ padding: '15px', borderBottom: '1px solid var(--surface-border)' }}>Status</th>
                <th style={{ padding: '15px', borderBottom: '1px solid var(--surface-border)' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>No orders found.</td>
                </tr>
              ) : (
                orders.map((order, idx) => (
                  <tr key={order.order_id} style={{ borderBottom: idx !== orders.length -1 ? '1px solid var(--surface-border)' : 'none' }}>
                    <td style={{ padding: '15px' }}>#{order.order_id}</td>
                    <td style={{ padding: '15px', color: 'white' }}>{order.customer_name}</td>
                    <td style={{ padding: '15px', color: 'var(--primary-color)' }}>{order.vendor_name}</td>
                    <td style={{ padding: '15px' }}>{order.order_type}</td>
                    <td style={{ padding: '15px' }}>₹{order.amount}</td>
                    <td style={{ padding: '15px' }}>
                        <span style={{ 
                            background: order.status.toLowerCase() === 'completed' ? '#238636' : (order.status.toLowerCase() === 'cancelled' ? 'transparent' : '#d4a20b'), 
                            color: order.status.toLowerCase() === 'cancelled' ? '#f85149' : 'white',
                            padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold' 
                        }}>
                            {order.status}
                        </span>
                    </td>
                    <td style={{ padding: '15px', fontSize: '0.9rem' }}>{order.date}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}

export default AdminOrders;
