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

  const handlePaymentStatusChange = async (orderId, newStatus) => {
    try {
      const resp = await fetch('/api/vendor/orders/update_payment_status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, status: newStatus }),
        credentials: 'include'
      });
      const data = await resp.json();
      if (data.status === 'success') {
        alert("Payment status updated to " + newStatus);
        fetchOrders();
      } else {
        alert("Error: " + data.message);
      }
    } catch (err) {
      alert("Network error updating payment status.");
    }
  };

  const handleBulkAction = async (orderId, action, price = null, message = '') => {
    try {
      const resp = await fetch('/api/vendor/orders/bulk_action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, action, negotiated_price: price, vendor_message: message }),
        credentials: 'include'
      });
      const data = await resp.json();
      if (data.status === 'success') {
        alert("Bulk request " + (action === 'Accept' ? 'Accepted' : 'Rejected'));
        fetchOrders();
      } else {
        alert("Error: " + data.message);
      }
    } catch (err) {
      alert("Network error processing bulk action.");
    }
  };

  const [bulkNegotiation, setBulkNegotiation] = useState({ orderId: null, price: '', message: '' });

  return (
    <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
      <VendorSidebar />
      <main style={{ flex: 1 }}>
        <h2 style={{ fontSize: '2rem', color: 'white', marginTop: 0 }}>Incoming Orders</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Track requests, update shipping statuses, and process deliveries.</p>
        <hr style={{ borderColor: 'var(--surface-border)', marginBottom: '1.5rem' }} />

        <div style={{ padding: '1rem', background: 'rgba(255, 215, 0, 0.1)', borderLeft: '4px solid #ffd700', borderRadius: '4px', marginBottom: '1.5rem' }}>
          <p style={{ color: '#ffd700', margin: 0, fontSize: '1rem', fontWeight: 'bold' }}>
            Note: Delivery charges are separate. Confirm with customer and collect directly. ConEco is not responsible.
          </p>
        </div>

        {loading ? (
          <p>Loading orders...</p>
        ) : orders.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {orders.map(o => (
              <div key={o.order_id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1.5rem' }}>
                <div style={{ flex: '1 1 300px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
                    <h4 style={{ color: 'white', margin: 0 }}>Order #{o.order_id} - {o.customer_name}</h4>
                    {o.status === 'Bulk Requested' && (
                      <span style={{ background: 'rgba(52, 152, 219, 0.2)', color: '#3498db', padding: '2px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', border: '1px solid #3498db' }}>
                        BULK PRICE REQUESTED
                      </span>
                    )}
                  </div>
                  
                  {o.status !== 'Pending' && o.customer_phone && (
                    <p style={{ color: '#3fb950', fontSize: '0.9rem', margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>
                      📞 {o.customer_phone}
                    </p>
                  )}
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 0.5rem 0' }}>Ordered on: {o.date}</p>
                  
                  <div style={{ background: 'rgba(0,0,0,0.1)', padding: '0.75rem', borderRadius: '4px', borderLeft: '3px solid var(--primary-color)', marginBottom: '0.8rem' }}>
                    <p style={{ color: 'white', fontSize: '0.85rem', fontWeight: 'bold', margin: '0 0 0.25rem 0' }}>Delivery Address:</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>{o.delivery_address || 'No address provided'}</p>
                  </div>

                  {o.customer_message && (
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '0.8rem' }}>
                      <p style={{ color: 'var(--primary-color)', fontSize: '0.85rem', fontWeight: 'bold', margin: '0 0 0.25rem 0' }}>Customer Request:</p>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0, fontStyle: 'italic' }}>"{o.customer_message}"</p>
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
                    <p style={{ color: 'white', fontSize: '0.9rem', margin: 0 }}>
                      Payment: <span style={{ color: '#ffd700', fontWeight: 'bold' }}>{o.payment_method || 'N/A'}</span> 
                      <span style={{ marginLeft: '10px', fontSize: '0.8rem', padding: '2px 8px', borderRadius: '4px', background: o.payment_status === 'Completed' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(245, 158, 11, 0.2)', color: o.payment_status === 'Completed' ? '#22c55e' : '#f59e0b' }}>
                        {o.payment_status || 'Pending'}
                      </span>
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      padding: '3px 10px',
                      borderRadius: '20px',
                      background: o.customer_credit_score < 50 ? 'rgba(239, 68, 68, 0.1)' : o.customer_credit_score < 80 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                      color: o.customer_credit_score < 50 ? '#ef4444' : o.customer_credit_score < 80 ? '#f59e0b' : '#22c55e',
                      border: `1px solid ${o.customer_credit_score < 50 ? '#ef4444' : o.customer_credit_score < 80 ? '#f59e0b' : '#22c55e'}`,
                      fontWeight: 'bold'
                    }}>
                      Customer Credit: {o.customer_credit_score}
                    </span>
                    {o.quantity && <span style={{ color: 'white', fontSize: '0.8rem' }}>| Qty: <strong>{o.quantity}</strong></span>}
                  </div>
                </div>

                <div style={{ flex: '0 0 250px', textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ color: 'var(--primary-color)', fontWeight: 'bold', margin: '0 0 4px 0', fontSize: '1.4rem' }}>
                      ₹{['COD', 'Pay Later (Cash)', 'Negotiable'].includes(o.payment_method) ? o.amount.toFixed(2) : o.base_amount.toFixed(2)}
                    </p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', margin: 0 }}>
                      {['COD', 'Pay Later (Cash)', 'Negotiable'].includes(o.payment_method) ? 'Gross (Collect Cash)' : 'Net Payout'}
                    </p>
                    {!['COD', 'Pay Later (Cash)', 'Negotiable'].includes(o.payment_method) && (
                      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem', margin: '4px 0 0 0' }}>
                        Gross: ₹{o.amount.toFixed(2)}
                      </p>
                    )}
                  </div>

                  {o.status === 'Bulk Requested' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {bulkNegotiation.orderId === o.order_id ? (
                        <div style={{ textAlign: 'left', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px' }}>
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Bulk Price (Per Unit)</label>
                          <input 
                            type="number" 
                            className="input-field" 
                            style={{ margin: '5px 0 10px 0', padding: '6px' }}
                            placeholder="New Unit Price" 
                            value={bulkNegotiation.price}
                            onChange={e => setBulkNegotiation({...bulkNegotiation, price: e.target.value})}
                          />
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Note to Customer</label>
                          <textarea 
                             className="input-field" 
                             style={{ margin: '5px 0 10px 0', padding: '6px' }}
                             placeholder="Msg (Optional)" 
                             rows="2"
                             value={bulkNegotiation.message}
                             onChange={e => setBulkNegotiation({...bulkNegotiation, message: e.target.value})}
                          ></textarea>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                              onClick={() => handleBulkAction(o.order_id, 'Accept', bulkNegotiation.price, bulkNegotiation.message)}
                              className="btn" style={{ flex: 1, padding: '5px', fontSize: '0.8rem', background: '#238636' }}>Confirm</button>
                            <button 
                              onClick={() => setBulkNegotiation({ orderId: null, price: '', message: '' })}
                              className="btn danger" style={{ padding: '5px', fontSize: '0.8rem' }}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            onClick={() => setBulkNegotiation({ orderId: o.order_id, price: '', message: '' })}
                            className="btn" style={{ flex: 1, background: 'var(--primary-color)', fontSize: '0.85rem' }}>Accept & Price</button>
                          <button 
                            onClick={() => handleBulkAction(o.order_id, 'Reject')}
                            className="btn danger" style={{ flex: 1, fontSize: '0.85rem' }}>Reject</button>
                        </div>
                      )}
                    </div>
                  ) : o.payment_method === 'Pay Later' && o.status === 'Pending' ? (
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
                      value={o.status}
                      onChange={(e) => handleStatusChange(o.order_id, e.target.value)}
                      style={{
                        background: 'rgba(0,0,0,0.3)',
                        color: 'white',
                        border: '1px solid var(--surface-border)',
                        padding: '10px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
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
                  {['COD', 'Pay Later (Cash)', 'Negotiable'].includes(o.payment_method) && o.payment_status !== 'Completed' && (
                    <button 
                      onClick={() => handlePaymentStatusChange(o.order_id, 'Completed')}
                      className="btn"
                      style={{ background: 'transparent', border: '1px solid #22c55e', color: '#22c55e', fontSize: '0.8rem', padding: '8px' }}>
                      Mark as Paid
                    </button>
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
