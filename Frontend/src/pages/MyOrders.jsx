import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import CustomerSidebar from '../components/CustomerSidebar';

const API = import.meta.env.VITE_API_URL || 'https://api.coneco.store';

function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = () => {
    setLoading(true);
    fetch(`${API}/api/customer/my_orders`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.orders) setOrders(data.orders);
        setLoading(false);
      })
      .catch(err => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handlePayNow = async (order) => {
    try {
      // 1. Create Razorpay order
      const resp = await fetch(`${API}/api/payment/create_order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount_paise: Math.round(order.amount * 100) }),
        credentials: 'include'
      });
      const orderData = await resp.json();
      
      if (!window.Razorpay) {
        alert("Razorpay SDK failed to load. Are you online?");
        return;
      }

      // 2. Open Razorpay Widget
      const options = {
        key: orderData.key_id,
        amount: orderData.amount_paise,
        currency: "INR",
        name: "ConEco Settlement",
        description: `Stettle Payment for Order #${order.order_id}`,
        order_id: orderData.order_id,
        handler: async (response) => {
          // 3. Verify on backend
          const verifyResp = await fetch(`${API}/api/payment/verify_settlement`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              order_id: order.order_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            }),
            credentials: 'include'
          });
          const verifyData = await verifyResp.json();
          if (verifyData.status === 'success') {
            alert("Payment successful! Order settled.");
            fetchOrders();
          } else {
            alert("Payment verification failed. Please contact support.");
          }
        },
        theme: { color: "#3fb950" }
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      alert("Error initiating payment.");
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order? For online payments, a 100% refund will be initiated.")) return;

    try {
      const resp = await fetch(`${API}/api/customer/orders/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId }),
        credentials: 'include'
      });
      const data = await resp.json();
      if (data.status === 'success') {
        alert(data.message);
        fetchOrders();
      } else {
        alert("Cannot cancel: " + (data.message || data.detail || 'Server error'));
      }
    } catch (err) {
      alert("Error cancelling order.");
    }
  };

  const handleDownloadSummary = async (orderId) => {
    try {
      const response = await fetch(`${API}/api/invoice/download/${orderId}`, { credentials: 'include' });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Server Error' }));
        throw new Error(errorData.detail || 'Download failed');
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/pdf')) {
        throw new Error("Server hit a temporary error. Please contact ConEco support.");
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

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Completed':
      case 'Delivered':
        return { 
          borderLeft: '4px solid #3fb950', 
          badgeBg: 'rgba(46, 160, 67, 0.15)', 
          badgeColor: '#3fb950', 
          badgeBorder: '1px solid rgba(46, 160, 67, 0.3)' 
        };
      case 'Cancelled':
        return { 
          borderLeft: '4px solid #f85149', 
          badgeBg: 'rgba(248, 81, 73, 0.15)', 
          badgeColor: '#f85149', 
          badgeBorder: '1px solid rgba(248, 81, 73, 0.3)' 
        };
      case 'Shipped':
      case 'Out for Delivery':
      case 'Processing':
      case 'Confirmed':
      case 'Scheduled':
      case 'In Progress':
        return { 
          borderLeft: '4px solid #3870e0', 
          badgeBg: 'rgba(56, 112, 224, 0.15)', 
          badgeColor: '#3870e0', 
          badgeBorder: '1px solid rgba(56, 112, 224, 0.3)' 
        };
      case 'Pending':
      default:
        return { 
          borderLeft: '4px solid #d26d0e', 
          badgeBg: 'rgba(210, 109, 14, 0.15)', 
          badgeColor: '#d26d0e', 
          badgeBorder: '1px solid rgba(210, 109, 14, 0.3)' 
        };
    }
  };

  return (
    <div className="dashboard-layout">
      <CustomerSidebar />
      <main style={{ flex: 1, padding: '2rem', minWidth: 0 }}>
        
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '2rem', color: 'var(--text-highlight)', marginTop: 0, fontWeight: '800' }}>My Orders</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '0.3rem 0 0 0', fontSize: '0.95rem' }}>Track B2B raw materials dispatch status, settlements, and download invoices.</p>
          <hr style={{ borderColor: 'var(--surface-border)', marginTop: '1.5rem', marginBottom: 0 }} />
        </div>
        
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="glass-panel skeleton-pulse skeleton-row" style={{ height: '180px' }}></div>
            ))}
          </div>
        ) : orders.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            {orders.map(o => {
              const statusCfg = getStatusStyle(o.status);
              return (
                <div 
                  key={o.order_id} 
                  className="glass-panel" 
                  style={{ 
                    padding: '1.5rem', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    flexWrap: 'wrap', 
                    gap: '1.5rem',
                    borderLeft: statusCfg.borderLeft,
                    borderRadius: '16px'
                  }}
                >
                  {/* Left Column: Order metadata */}
                  <div style={{ flex: '1 1 320px', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
                      <h4 style={{ color: 'var(--text-highlight)', margin: 0, fontSize: '1.15rem', fontWeight: '700' }}>
                        {o.item_name}
                      </h4>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--surface-border)', fontWeight: '600' }}>
                        #{o.order_id}
                      </span>
                    </div>

                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '0 0 0.5rem 0' }}>
                      🏢 Vendor: <strong style={{ color: 'var(--text-primary)' }}>{o.vendor_name}</strong>
                    </p>
                    
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 20px', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.8rem' }}>
                      <span>📧 {o.vendor_email}</span>
                      <span>📞 {o.vendor_phone}</span>
                      <span>📅 Date: {o.date}</span>
                    </div>
                    
                    {o.is_bulk_request ? (
                      <div style={{ marginBottom: '0.8rem', marginTop: '0.8rem' }}>
                        <span style={{ background: 'rgba(52, 152, 219, 0.15)', color: '#3498db', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700', border: '1px solid rgba(52, 152, 219, 0.3)', display: 'inline-block' }}>
                          📋 BULK REQ
                        </span>
                        {o.customer_message && (
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '6px 0 0 0', borderLeft: '2px solid var(--surface-border)', paddingLeft: '8px', fontStyle: 'italic' }}>
                            "You: {o.customer_message}"
                          </p>
                        )}
                        {o.vendor_message && (
                          <div style={{ background: 'rgba(35, 134, 54, 0.08)', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid rgba(35, 134, 54, 0.2)', marginTop: '0.5rem' }}>
                            <p style={{ color: '#3fb950', fontSize: '0.8rem', fontWeight: '700', margin: '0 0 4px 0' }}>Vendor Reply:</p>
                            <p style={{ color: 'var(--text-highlight)', fontSize: '0.8rem', margin: 0 }}>{o.vendor_message}</p>
                            {o.negotiated_price && <p style={{ color: '#ffd700', fontSize: '0.85rem', fontWeight: '700', marginTop: '4px', margin: 0 }}>New Bulk Price: ₹{o.negotiated_price} / unit</p>}
                          </div>
                        )}
                      </div>
                    ) : null}

                    {/* Badge Badges Row */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginTop: '0.8rem' }}>
                      <span style={{ fontSize: '0.78rem', color: '#ffd700', background: 'rgba(255, 215, 0, 0.1)', border: '1px solid rgba(255, 215, 0, 0.25)', padding: '3px 8px', borderRadius: '4px', fontWeight: '600' }}>
                        💳 {o.payment_method === 'PayLater' ? 'Credit Account' : o.payment_method}
                      </span>
                      <span style={{ 
                        fontSize: '0.78rem', 
                        background: o.payment_status === 'Completed' ? 'rgba(35, 134, 54, 0.12)' : 'rgba(210, 109, 14, 0.12)', 
                        color: o.payment_status === 'Completed' ? '#3fb950' : '#d26d0e',
                        border: `1px solid ${o.payment_status === 'Completed' ? 'rgba(35, 134, 54, 0.25)' : 'rgba(210, 109, 14, 0.25)'}`,
                        padding: '3px 8px', 
                        borderRadius: '4px',
                        fontWeight: '600'
                      }}>
                        Payment: {o.payment_status}
                      </span>
                      {o.payment_method === 'PayLater' && o.payment_status !== 'Completed' && (
                        <span style={{ 
                          fontSize: '0.78rem', 
                          background: 'rgba(52, 152, 219, 0.12)', 
                          color: '#3498db',
                          border: '1px solid rgba(52, 152, 219, 0.25)',
                          padding: '3px 8px', 
                          borderRadius: '4px',
                          fontWeight: '600'
                        }}>
                          📅 Due: {new Date(o.credit_stage1_due).toLocaleDateString()}
                        </span>
                      )}
                      {o.credit_tier && (
                        <span style={{ 
                          fontSize: '0.78rem', 
                          background: o.credit_tier === 'Stage1' ? 'rgba(35, 134, 54, 0.12)' : 'rgba(231, 76, 60, 0.12)', 
                          color: o.credit_tier === 'Stage1' ? '#3fb950' : '#e74c3c',
                          border: `1px solid ${o.credit_tier === 'Stage1' ? 'rgba(35, 134, 54, 0.25)' : 'rgba(231, 76, 60, 0.25)'}`,
                          padding: '3px 8px', 
                          borderRadius: '4px',
                          fontWeight: '700'
                        }}>
                          Tier: {o.credit_tier} {o.credit_tier === 'Stage1' && '🚀'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Pricing & Controls */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.8rem', textAlign: 'right', flex: '1 1 200px', minWidth: 0 }}>
                    <p style={{ color: 'var(--primary-color)', fontWeight: '800', fontSize: '1.5rem', margin: 0 }}>₹{o.amount}</p>
                    
                    <span style={{ 
                      padding: '4px 12px', 
                      borderRadius: '20px', 
                      fontSize: '0.8rem', 
                      fontWeight: '700',
                      background: statusCfg.badgeBg, 
                      color: statusCfg.badgeColor,
                      border: statusCfg.badgeBorder,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}>
                      ● {o.status}
                    </span>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', maxWidth: '240px', marginTop: '0.5rem' }}>
                      {(o.status === 'Delivered' || o.status === 'Completed') && (
                        <button 
                          onClick={() => handleDownloadSummary(o.order_id)}
                          className="btn"
                          style={{ 
                            width: '100%',
                            padding: '0.55rem 1rem', 
                            fontSize: '0.85rem', 
                            background: 'rgba(35, 134, 54, 0.15)', 
                            color: '#3fb950', 
                            border: '1px solid rgba(35, 134, 54, 0.3)',
                            cursor: 'pointer',
                            borderRadius: '6px',
                            fontWeight: '600'
                          }}
                        >
                          📋 Order Summary PDF
                        </button>
                      )}

                      {o.bill_file_url && (
                        <a 
                          href={`${API}${o.bill_file_url}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="btn"
                          style={{ 
                            width: '100%',
                            padding: '0.55rem 1rem', 
                            fontSize: '0.85rem', 
                            background: 'var(--primary-color)',
                            color: 'white',
                            textDecoration: 'none',
                            textAlign: 'center',
                            borderRadius: '6px',
                            fontWeight: '600',
                            boxSizing: 'border-box'
                          }}
                        >
                          📥 Download {o.bill_type} Bill
                        </a>
                      )}

                      {o.status === 'Pending' ? (
                        <button 
                          onClick={() => handleCancelOrder(o.order_id)}
                          className="btn"
                          style={{ width: '100%', padding: '0.55rem 1rem', fontSize: '0.85rem', background: '#e74c3c', borderRadius: '6px', fontWeight: '600' }}
                        >
                          Cancel Order
                        </button>
                      ) : o.status !== 'Cancelled' && o.status !== 'Delivered' && o.status !== 'Completed' ? (
                        <button 
                          className="btn"
                          disabled
                          title="Please contact the vendor to change the status to Pending before cancelling."
                          style={{ width: '100%', padding: '0.55rem 1rem', fontSize: '0.82rem', background: 'rgba(231, 76, 60, 0.1)', border: '1px solid rgba(231, 76, 60, 0.2)', color: '#f85149', cursor: 'not-allowed', borderRadius: '6px' }}
                        >
                          🔒 Contact Seller to Cancel
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '5rem 2rem', textAlign: 'center', borderRadius: '16px' }}>
            <span style={{ fontSize: '4rem', display: 'block', marginBottom: '1.5rem' }}>📦</span>
            <h3 style={{ color: 'var(--text-highlight)', fontSize: '1.4rem', margin: '0 0 0.5rem 0', fontWeight: '700' }}>No Orders Found</h3>
            <p style={{ color: 'var(--text-secondary)', margin: '0 0 2rem 0', fontSize: '0.95rem' }}>You have not placed any orders yet. Explore materials in the catalogue to place your first B2B purchase order.</p>
            <Link to="/customer/products" className="btn" style={{ background: 'var(--primary-color)', padding: '0.8rem 2rem', fontSize: '0.95rem', fontWeight: '600' }}>
              Explore Products
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

export default MyOrders;
