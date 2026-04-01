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
                <th style={{ padding: '15px', borderBottom: '1px solid var(--surface-border)' }}>Review</th>
                <th style={{ padding: '15px', borderBottom: '1px solid var(--surface-border)' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>No orders found.</td>
                </tr>
              ) : (
                orders.map((order, idx) => (
                  <tr key={order.order_id} style={{ borderBottom: idx !== orders.length -1 ? '1px solid var(--surface-border)' : 'none' }}>
                    <td style={{ padding: '15px' }}>#{order.order_id}</td>
                    <td style={{ padding: '15px' }}>
                      <div style={{ color: 'white' }}>{order.customer_name}</div>
                      <div style={{ 
                        fontSize: '0.7rem', 
                        color: order.customer_credit_score < 50 ? '#ef4444' : order.customer_credit_score < 80 ? '#f59e0b' : '#22c55e',
                        fontWeight: 'bold'
                      }}>
                        Score: {order.customer_credit_score}
                      </div>
                    </td>
                    <td style={{ padding: '15px', color: 'var(--primary-color)' }}>{order.vendor_name}</td>
                    <td style={{ padding: '15px' }}>{order.order_type}</td>
                    <td style={{ padding: '15px' }}>₹{order.amount}</td>
                    <td style={{ padding: '15px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ 
                              background: order.status.toLowerCase() === 'completed' ? '#238636' : (order.status.toLowerCase() === 'cancelled' ? 'transparent' : '#d4a20b'), 
                              color: order.status.toLowerCase() === 'cancelled' ? '#f85149' : 'white',
                              padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', textAlign: 'center'
                          }}>
                              {order.status}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: '#ffd700', fontWeight: 'bold' }}>
                            {order.payment_method}
                          </span>
                          <span style={{ 
                            fontSize: '0.7rem', 
                            background: order.payment_status === 'Completed' ? 'rgba(35, 134, 54, 0.2)' : 'rgba(210, 109, 14, 0.2)', 
                            color: order.payment_status === 'Completed' ? '#3fb950' : '#d26d0e',
                            padding: '1px 6px', 
                            borderRadius: '4px',
                            textAlign: 'center'
                          }}>
                            {order.payment_status}
                          </span>
                          {order.payment_method === 'Pay Later' && order.pay_later_stage && (order.status === 'Delivered' || order.status === 'Completed') && (
                            <span style={{ 
                              fontSize: '0.65rem', 
                              color: order.pay_later_stage === 'Stage3' ? '#ef4444' : '#3b82f6',
                              fontWeight: 'bold'
                            }}>
                              {order.pay_later_stage}
                            </span>
                          )}
                        </div>
                    </td>
                    <td style={{ padding: '15px' }}>
                      {order.review_message ? (
                        <div style={{ maxWidth: '200px' }}>
                          <div style={{ color: '#ffd700', fontSize: '0.8rem', fontWeight: 'bold' }}>
                            {'★'.repeat(order.review_rating)}{'☆'.repeat(5 - order.review_rating)}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic', wordBreak: 'break-word' }}>
                            "{order.review_message}"
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>No reviews yet</span>
                      )}
                    </td>
                    <td style={{ padding: '15px', fontSize: '0.8rem' }}>
                      <div>{order.date}</div>
                      {order.payment_method === 'Pay Later' && (order.status === 'Delivered' || order.status === 'Completed') && order.pay_later_due_date && (
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                           Due: {order.pay_later_due_date}
                        </div>
                      )}
                    </td>
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
