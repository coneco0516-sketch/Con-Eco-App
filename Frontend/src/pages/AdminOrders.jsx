import React, { useEffect, useState } from 'react';
import AdminSidebar from '../components/AdminSidebar';

const API = process.env.REACT_APP_API_URL || '';

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleDownloadSummary = async (orderId) => {
    try {
      const response = await fetch(`${API}/api/invoice/download/${orderId}`, { credentials: 'include' });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Server Error' }));
        throw new Error(errorData.detail || 'Download failed');
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/pdf')) {
        throw new Error("Server did not return a valid PDF. Please try again.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `OrderSummary_ConEco_${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  useEffect(() => {
    fetch(`${API}/api/admin/orders`, { credentials: 'include' })
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
        <h2 style={{ fontSize: '2rem', color: 'var(--text-highlight)', marginTop: 0 }}>All Orders Overview</h2>
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
                <th style={{ padding: '15px', borderBottom: '1px solid var(--surface-border)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>No orders found.</td>
                </tr>
              ) : (
                orders.map((order, idx) => (
                  <tr key={order.order_id} style={{ borderBottom: idx !== orders.length -1 ? '1px solid var(--surface-border)' : 'none' }}>
                    <td style={{ padding: '15px' }}>#{order.order_id}</td>
                    <td style={{ padding: '15px' }}>
                      <div style={{ color: 'var(--text-highlight)' }}>{order.customer_name}</div>
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
                    </td>
                    <td style={{ padding: '15px' }}>
                      {(order.status === 'Delivered' || order.status === 'Completed') && (
                        <button 
                          onClick={() => handleDownloadSummary(order.order_id)}
                          title="Download Order Summary"
                          style={{ 
                            color: 'var(--primary-color)', 
                            cursor: 'pointer', 
                            background: 'rgba(57, 185, 80, 0.1)', 
                            padding: '5px 10px', 
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            border: '1px solid var(--primary-color)'
                          }}
                        >
                          📋 Summary
                        </button>
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
