import React, { useEffect, useState } from 'react';
import CustomerSidebar from '../components/CustomerSidebar';
import { useNavigate } from 'react-router-dom';

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
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/customer/cart', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.items) setCart(data.items);
        if (data.total) setTotal(data.total);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handlePayment = async () => {
    if (cart.length === 0) return;
    setPaying(true);
    setError('');

    // 1. Ensure Razorpay JS SDK is loaded
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      setError('Failed to load payment gateway. Check your internet connection.');
      setPaying(false);
      return;
    }

    // 2. Ask our backend to create a Razorpay order
    const amountPaise = Math.round(total * 100); // Convert ₹ to paise
    const res = await fetch('/api/payment/create_order', {
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
        const verifyRes = await fetch('/api/payment/verify', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpay_order_id:   response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature:  response.razorpay_signature,
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

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', (response) => {
      setError(`Payment failed: ${response.error.description}`);
      setPaying(false);
    });
    rzp.open();
  };

  return (
    <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
      <CustomerSidebar />
      <main style={{ flex: 1 }}>
        <h2 style={{ fontSize: '2rem', color: 'white', marginTop: 0 }}>Checkout</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Review your order and pay securely via Razorpay.</p>
        <hr style={{ borderColor: 'var(--surface-border)', marginBottom: '1.5rem' }} />

        {loading ? (
          <p>Loading cart...</p>
        ) : cart.length === 0 ? (
          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
            <h3>Your cart is empty. Add items before checking out.</h3>
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '2rem', maxWidth: '600px' }}>
            <h3 style={{ color: 'white', marginBottom: '1rem' }}>Order Summary</h3>
            <ul style={{ listStyle: 'none', padding: 0, marginBottom: '1.5rem' }}>
              {cart.map((item, idx) => (
                <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--surface-border)' }}>
                  <span>{item.name} × {item.quantity}</span>
                  <span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>₹{(item.price * item.quantity).toFixed(2)}</span>
                </li>
              ))}
            </ul>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '1.2rem', fontWeight: 'bold' }}>
              <span style={{ color: 'white' }}>Total</span>
              <span style={{ color: 'var(--primary-color)' }}>₹{total.toFixed(2)}</span>
            </div>
            {error && <p style={{ color: 'var(--danger-color)', marginBottom: '1rem' }}>{error}</p>}
            <button onClick={handlePayment} disabled={paying} className="btn" style={{ width: '100%', fontSize: '1.1rem', padding: '0.9rem' }}>
              {paying ? 'Opening Payment Gateway...' : `Pay ₹${total.toFixed(2)} via Razorpay`}
            </button>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '1rem', textAlign: 'center' }}>
              🔒 Secured by Razorpay. Supports UPI, Cards, Net Banking & Wallets.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default Checkout;
