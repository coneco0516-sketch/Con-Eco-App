import React, { useEffect, useState } from 'react';
import CustomerSidebar from '../components/CustomerSidebar';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || '';

// Dynamically load the Razorpay checkout script
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (document.getElementById('razorpay-script')) return resolve(true);
    const script = document.createElement('script');
    script.id = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function Checkout() {
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [baseTotal, setBaseTotal] = useState(0);
  const [gstTotal, setGstTotal] = useState(0);
  const [commissionTotal, setCommissionTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const [address, setAddress] = useState('');
  const [ackDelivery, setAckDelivery] = useState(false);
  const [creditInfo, setCreditInfo] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API}/api/customer/cart`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.items) setCart(data.items);
        if (data.total) setTotal(data.total);
        if (data.base_total !== undefined) setBaseTotal(data.base_total);
        if (data.gst_total !== undefined) setGstTotal(data.gst_total);
        if (data.commission_total !== undefined) setCommissionTotal(data.commission_total);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Fetch credit info
    fetch(`${API}/api/customer/credit_summary`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') setCreditInfo(data.summary);
      })
      .catch(err => console.error('Error fetching credit info:', err));

  }, []);

  const [paymentMethod, setPaymentMethod] = useState('COD');

  const handlePayment = async () => {
    if (cart.length === 0) return;
    if (!address.trim()) {
      setError('Please enter a delivery address.');
      return;
    }

    if (!ackDelivery) {
      setError('Please acknowledge the delivery charges notice before proceeding.');
      return;
    }



    setPaying(true);
    setError('');

    if (paymentMethod === 'COD') {
        try {
            const res = await fetch(`${API}/api/payment/place_order_offline`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            delivery_address: address,
            payment_method: paymentMethod
          })
        });
        const data = await res.json();
        if (data.status === 'success') {
          navigate('/customer/order-success');
        } else {
          setError(data.detail || 'Failed to place order.');
          setPaying(false);
        }
      } catch (err) {
        setError('Connection error. Please try again.');
        setPaying(false);
      }
      return;
    }

    if (paymentMethod === 'PayLater') {
      try {
        const res = await fetch(`${API}/api/payment/place_order_pay_later`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ delivery_address: address })
        });
        const data = await res.json();
        if (data.status === 'success') {
          navigate('/customer/order-success');
        } else {
          setError(data.detail || 'Failed to place credit order.');
          setPaying(false);
        }
      } catch (err) {
        setError('Connection error. Please try again.');
        setPaying(false);
      }
      return;
    }

    // Razorpay Flow for Card and UPI
    // 1. Ensure Razorpay JS SDK is loaded
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      setError('Failed to load payment gateway. Check your internet connection.');
      setPaying(false);
      return;
    }

    // 2. Ask our backend to create a Razorpay order
    const amountPaise = Math.round(total * 100); // Convert ₹ to paise
    const res = await fetch(`${API}/api/payment/create_order`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount_paise: amountPaise })
    });
    const orderData = await res.json();

    if (orderData.status !== 'success') {
      setError(orderData.detail || 'Could not create payment order.');
      setPaying(false);
      return;
    }

    // 3. Open Razorpay checkout popup
    const options = {
      key: orderData.key_id,
      amount: amountPaise,
      currency: 'INR',
      name: 'ConEco Marketplace',
      description: 'Construction Materials & Services',
      order_id: orderData.order_id,
      handler: async function (response) {
        // 4. Verify payment signature with our backend → place orders in DB
        const verifyRes = await fetch(`${API}/api/payment/verify`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            delivery_address: address,
            payment_method: paymentMethod
          })
        });
        const verifyData = await verifyRes.json();
        if (verifyData.status === 'success') {
          navigate('/customer/order-success');
        } else {
          setError('Payment verification failed. Please contact support.');
        }
      },
      prefill: { name: '', email: '', contact: '' },
      theme: { color: '#2ea043' },
      modal: {
        ondismiss: () => setPaying(false)
      }
    };

    // If we want to hint Razorpay to prefer a certain method:
    if (paymentMethod === 'UPI') {
      options.config = { display: { blocks: { utp: { name: 'Pay via UPI', methods: ['upi'] } }, sequence: ['block.utp'], preferences: { show_default_blocks: true } } };
    } else if (paymentMethod === 'Card') {
      options.config = { display: { blocks: { cards: { name: 'Pay via Card', methods: ['card'] } }, sequence: ['block.cards'], preferences: { show_default_blocks: true } } };
    }

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', (response) => {
      setError(`Payment failed: ${response.error.description}`);
      setPaying(false);
    });
    rzp.open();
  };

  const updateQuantity = async (cartId, newQuantity) => {
    if (newQuantity < 0) return;
    
    // Optimistic UI: Update local state immediately
    const prevCart = [...cart];
    const prevTotal = total;
    
    setCart(prev => {
      const next = prev.map(item => 
        item.cart_id === cartId ? { ...item, quantity: newQuantity } : item
      );
      // Let the backend update handle precise totals. For optimistic UI we can estimate lightly.
      return next;
    });

    try {
      const resp = await fetch(`${API}/api/customer/cart`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart_id: cartId, quantity: newQuantity }),
        credentials: 'include'
      });
      const data = await resp.json();
      if (data.status !== 'success') {
        // Revert on failure
        setCart(prevCart);
        setTotal(prevTotal);
      } else {
        // Fetch accurate fresh totals from cart endpoint
        fetch(`${API}/api/customer/cart`, { credentials: 'include' })
          .then(res => res.json())
          .then(data => {
            if (data.total) setTotal(data.total);
            if (data.base_total !== undefined) setBaseTotal(data.base_total);
            if (data.gst_total !== undefined) setGstTotal(data.gst_total);
            if (data.commission_total !== undefined) setCommissionTotal(data.commission_total);
          });
      }
    } catch (err) {
      setCart(prevCart);
      setTotal(prevTotal);
      console.error('Update quantity error:', err);
    }
  };



  const paymentOptions = [
    { id: 'COD', label: 'Cash on Delivery', icon: '💵' },
  ];

  if (creditInfo && parseFloat(creditInfo.credit_limit) > 0) {
    const available = parseFloat(creditInfo.credit_available);
    const isSuspended = creditInfo.credit_status === 'Suspended';
    const insufficient = available < total;
    
    paymentOptions.push({
      id: 'PayLater',
      label: 'Pay Later (Credit)',
      icon: '⏳',
      disabled: isSuspended || insufficient,
      subtitle: isSuspended ? `Suspended until ${creditInfo.suspended_until}` : 
                insufficient ? `Insufficient Limit (₹${available.toFixed(0)})` :
                `Available: ₹${available.toFixed(0)}`
    });
  }

  return (
    <div className="dashboard-layout">
      <CustomerSidebar />
      <main style={{ flex: 1 }}>
        <h2 style={{ fontSize: '2rem', color: 'var(--text-highlight)', marginTop: 0 }}>Checkout</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Review your order and select a payment method.</p>
        <hr style={{ borderColor: 'var(--surface-border)', marginBottom: '1.5rem' }} />

        {loading ? (
          <p>Loading cart...</p>
        ) : cart.length === 0 ? (
          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
            <h3>Your cart is empty. Add items before checking out.</h3>
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '2rem', maxWidth: '600px' }}>
            <h3 style={{ color: 'var(--text-highlight)', marginBottom: '1rem' }}>Order Summary</h3>
            <ul style={{ listStyle: 'none', padding: 0, marginBottom: '1.5rem' }}>
              {cart.map((item, idx) => (
                <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', borderBottom: '1px solid var(--surface-border)', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ color: 'var(--text-highlight)', display: 'block' }}>{item.name}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>₹{item.price} each</span>
                  </div>
                  
                  <div className="quantity-selector">
                    <button 
                      className="quantity-btn"
                      onClick={() => updateQuantity(item.cart_id, item.quantity - 1)}
                    >
                      −
                    </button>
                    <input 
                      className="quantity-input"
                      type="number" 
                      min="0" 
                      value={item.quantity} 
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          setCart(prev => prev.map(i => 
                            i.cart_id === item.cart_id ? { ...i, quantity: '' } : i
                          ));
                        } else {
                          const parsed = parseInt(val);
                          if (!isNaN(parsed)) updateQuantity(item.cart_id, parsed);
                        }
                      }}
                      onBlur={(e) => {
                        const val = parseInt(e.target.value);
                        if (isNaN(val) || val < 1) updateQuantity(item.cart_id, 1);
                      }}
                    />
                    <button 
                      className="quantity-btn"
                      onClick={() => updateQuantity(item.cart_id, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>

                  <span style={{ color: 'var(--primary-color)', fontWeight: 'bold', minWidth: '80px', textAlign: 'right' }}>₹{(item.price * item.quantity).toFixed(2)}</span>
                </li>
              ))}
            </ul>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '1.2rem', fontWeight: 'bold' }}>
              <span style={{ color: 'var(--text-highlight)' }}>Subtotal (Base Prices)</span>
              <span style={{ color: 'var(--text-secondary)' }}>₹{baseTotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '1rem' }}>
              <span style={{ color: '#3498db' }}>GST (18%)</span>
              <span style={{ color: '#3498db' }}>₹{gstTotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '1rem' }}>
              <span style={{ color: '#ffd700' }}>Platform Commission</span>
              <span style={{ color: '#ffd700' }}>₹{commissionTotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '1.3rem', fontWeight: 'bold', paddingTop: '1rem', borderTop: '1px solid var(--surface-border)' }}>
              <span style={{ color: 'var(--text-highlight)' }}>Total Amount</span>
              <span style={{ color: 'var(--primary-color)' }}>₹{total.toFixed(2)}</span>
            </div>

            <div style={{ marginBottom: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--surface-border)' }}>
              <label style={{ color: 'var(--text-highlight)', display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Delivery Address (Site Location) <span style={{ color: 'var(--danger-color)' }}>*</span></label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter complete delivery address, pin code, and contact person..."
                rows="3"
                style={{
                  width: '95%',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  border: '1px solid var(--surface-border)',
                  background: 'rgba(0, 0, 0, 0.2)',
                  color: 'var(--text-highlight)',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  marginBottom: '1rem'
                }}
              ></textarea>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginTop: '0.5rem', background: 'rgba(255,215,0,0.1)', padding: '1rem', borderRadius: '6px', border: '1px solid rgba(255,215,0,0.3)' }}>
                <input
                  type="checkbox"
                  id="ackDelivery"
                  checked={ackDelivery}
                  onChange={(e) => setAckDelivery(e.target.checked)}
                  style={{ marginTop: '0.2rem', cursor: 'pointer', width: '18px', height: '18px', accentColor: '#ffd700' }}
                />
                <label htmlFor="ackDelivery" style={{ color: '#ffd700', fontSize: '0.9rem', lineHeight: '1.4', cursor: 'pointer' }}>
                  <strong>Note:</strong> Delivery charges are not included in the order. Please confirm delivery cost with the vendor after placing the order. ConEco is not responsible for delivery charges.
                </label>
              </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{ color: 'var(--text-highlight)', display: 'block', marginBottom: '1rem', fontWeight: 'bold' }}>Select Payment Method</label>



              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {paymentOptions.map((opt) => (
                  <div
                    key={opt.id}
                    onClick={() => !opt.disabled && setPaymentMethod(opt.id)}
                    style={{
                      padding: '1rem',
                      borderRadius: '8px',
                      border: `2px solid ${opt.disabled ? 'rgba(231,76,60,0.3)' : paymentMethod === opt.id ? 'var(--primary-color)' : 'var(--surface-border)'}`,
                      background: opt.disabled ? 'rgba(231,76,60,0.05)' : paymentMethod === opt.id ? 'rgba(46, 160, 67, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                      cursor: opt.disabled ? 'not-allowed' : 'pointer',
                      opacity: opt.disabled ? 0.5 : 1,
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.5rem',
                      textAlign: 'center',
                      position: 'relative'
                    }}
                  >
                    <span style={{ fontSize: '1.5rem' }}>{opt.icon}</span>
                    <span style={{ color: opt.disabled ? '#e74c3c' : paymentMethod === opt.id ? 'white' : 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 'bold' }}>{opt.label}</span>
                    {opt.subtitle && (
                      <span style={{ fontSize: '0.7rem', color: opt.disabled ? '#e74c3c' : 'var(--primary-color)', opacity: 0.8 }}>
                        {opt.subtitle}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {error && <p style={{ color: 'var(--danger-color)', marginBottom: '1rem' }}>{error}</p>}

            <button
              onClick={handlePayment}
              disabled={paying}
              className="btn"
              style={{ width: '100%', fontSize: '1.1rem', padding: '0.9rem' }}
            >
              {paying ? 'Processing...' : (
                paymentMethod === 'COD' ? 'Place Order (COD)' :
                paymentMethod === 'PayLater' ? 'Place Order (Pay Later)' :
                  `Pay ₹${total.toFixed(2)} via Razorpay`
              )}
            </button>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '1rem', textAlign: 'center' }}>
              {paymentMethod === 'COD' ? '💵 You will pay when the items are delivered.' :
               paymentMethod === 'PayLater' ? '📅 Pay within 7 days for limit doubling reward!' :
                  '🔒 Secured by Razorpay. Supports UPI, Cards, Net Banking & Wallets.'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default Checkout;
