import React, { useState, useEffect } from 'react';
import CustomerSidebar from '../components/CustomerSidebar';

function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = () => {
    setLoading(true);
    fetch('/api/customer/my_orders', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.orders) setOrders(data.orders);
        setLoading(false);
      })
      .catch(err => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
    
    // Load Razorpay script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const handlePayNow = async (order) => {
    try {
      // 1. Create Razorpay order
      const resp = await fetch('/api/payment/create_order', {
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
          const verifyResp = await fetch('/api/payment/verify_settlement', {
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
    if (!window.confirm("Are you sure you want to cancel this order? For pending online payments, a 100% refund will be initiated.")) return;

    try {
      const resp = await fetch('/api/customer/orders/cancel', {
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
        alert("Cannot cancel: " + data.message);
      }
    } catch (err) {
      alert("Error cancelling order.");
    }
  };

  const getStageBadge = (order) => {
    if (order.payment_method !== 'Pay Later' || order.payment_status === 'Completed' || (order.status !== 'Delivered' && order.status !== 'Completed')) return null;
    
    const stage = order.pay_later_stage;
    const due = order.pay_later_due || order.pay_later_stage2_due || order.pay_later_stage3_due;
    
    let color = '#3fb950';
    let bg = 'rgba(63, 185, 80, 0.1)';
    let label = 'Stage 1: 30 Days';

    if (stage === 'Stage2') {
      color = '#f1c40f';
      bg = 'rgba(241, 196, 15, 0.1)';
      label = 'Stage 2: 10 Days Grace';
    } else if (stage === 'Stage3') {
      color = '#e74c3c';
      bg = 'rgba(231, 76, 60, 0.1)';
      label = 'Stage 3: FINAL DAY';
    } else if (stage === 'Defaulted') {
      color = '#e74c3c';
      bg = 'rgba(231, 76, 60, 0.2)';
      label = 'Payment Defaulted';
    }

    return (
      <div style={{ 
        marginTop: '10px', padding: '8px 12px', borderRadius: '6px', 
        background: bg, border: `1px solid ${color}`, display: 'inline-flex',
        flexDirection: 'column', gap: '4px'
      }}>
        <span style={{ color: color, fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' }}>
          {label}
        </span>
        {due && stage !== 'Defaulted' && (
          <span style={{ color: 'white', fontSize: '0.85rem' }}>
            Due by: <strong style={{color}}>{due}</strong>
          </span>
        )}
      </div>
    );
  }

  const handleDownloadInvoice = async (orderId) => {
    try {
      const response = await fetch(`/api/invoice/download/${orderId}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Invoice not available');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice_ConEco_${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert("Failed to download invoice. Please try again later.");
    }
  };

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
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '0 0 0.5rem 0' }}>
                    <span style={{ marginRight: '15px' }}>📧 {o.vendor_email}</span>
                    <span>📞 {o.vendor_phone}</span>
                  </p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 0.5rem 0' }}>Ordered on: {o.date}</p>
                  
                  {o.is_bulk_request ? (
                    <div style={{ marginBottom: '1rem' }}>
                      <span style={{ background: 'rgba(52, 152, 219, 0.2)', color: '#3498db', padding: '2px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', border: '1px solid #3498db', marginBottom: '0.5rem', display: 'inline-block' }}>
                        BULK REQUEST
                      </span>
                      {o.customer_message && (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '4px 0', borderLeft: '2px solid var(--surface-border)', paddingLeft: '8px', fontStyle: 'italic' }}>
                          "You: {o.customer_message}"
                        </p>
                      )}
                      {o.vendor_message && (
                        <div style={{ background: 'rgba(35, 134, 54, 0.1)', padding: '0.5rem', borderRadius: '4px', marginTop: '0.5rem' }}>
                           <p style={{ color: '#3fb950', fontSize: '0.8rem', fontWeight: 'bold', margin: '0 0 4px 0' }}>Vendor Reply:</p>
                           <p style={{ color: 'white', fontSize: '0.8rem', margin: 0 }}>{o.vendor_message}</p>
                           {o.negotiated_price && <p style={{ color: '#ffd700', fontSize: '0.85rem', fontWeight: 'bold', marginTop: '4px' }}>New Bulk Price: ₹{o.negotiated_price} / unit</p>}
                        </div>
                      )}
                    </div>
                  ) : null}

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: '#ffd700', border: '1px solid #ffd700', padding: '2px 6px', borderRadius: '4px' }}>
                      {o.payment_method}
                    </span>
                    <span style={{ 
                      fontSize: '0.8rem', 
                      background: o.payment_status === 'Completed' ? 'rgba(35, 134, 54, 0.2)' : 'rgba(210, 109, 14, 0.2)', 
                      color: o.payment_status === 'Completed' ? '#3fb950' : '#d26d0e',
                      padding: '2px 6px', 
                      borderRadius: '4px'
                    }}>
                      Payment: {o.payment_status}
                    </span>
                  </div>
                  {getStageBadge(o)}
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                  <p style={{ color: 'var(--primary-color)', fontWeight: 'bold', fontSize: '1.2rem', margin: 0 }}>₹{o.amount}</p>
                  <span style={{ 
                    padding: '4px 12px', 
                    borderRadius: '4px', 
                    fontSize: '0.85rem', 
                    fontWeight: 'bold',
                    background: o.status === 'Pending' ? 'rgba(210, 109, 14, 0.2)' : 'rgba(35, 134, 54, 0.4)', 
                    color: o.status === 'Pending' ? '#d26d0e' : '#white',
                    border: `1px solid ${o.status === 'Pending' ? '#d26d0e' : 'var(--primary-color)'}`
                  }}>
                    {o.status}
                  </span>
                  
                  {o.payment_method === 'Pay Later' && o.payment_status !== 'Completed' && o.status === 'Delivered' && (
                    <button 
                      onClick={() => handlePayNow(o)}
                      className="primary-button"
                      style={{ padding: '6px 15px', fontSize: '0.85rem' }}
                    >
                      Pay Now (Card/UPI)
                    </button>
                  )}

                  {(o.status === 'Delivered' || o.status === 'Completed') && (
                    <button 
                      onClick={() => handleDownloadInvoice(o.order_id)}
                      className="btn"
                      style={{ 
                        padding: '6px 15px', 
                        fontSize: '0.85rem', 
                        background: 'rgba(35, 134, 54, 0.2)', 
                        color: '#3fb950', 
                        border: '1px solid #3fb950',
                        cursor: 'pointer'
                      }}
                    >
                      📄 Download Invoice
                    </button>
                  )}

                  {o.status === 'Pending' ? (
                    <button 
                      onClick={() => handleCancelOrder(o.order_id)}
                      className="btn"
                      style={{ padding: '6px 15px', fontSize: '0.85rem', background: '#e74c3c' }}
                    >
                      Cancel Order
                    </button>
                  ) : o.status !== 'Cancelled' && o.status !== 'Delivered' ? (
                    <button 
                      className="btn"
                      disabled
                      title="Please contact the vendor to change the status to Pending before cancelling."
                      style={{ padding: '6px 15px', fontSize: '0.85rem', background: 'rgba(231, 76, 60, 0.4)', cursor: 'not-allowed' }}
                    >
                      Contact Vendor to Cancel
                    </button>
                  ) : null}
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
