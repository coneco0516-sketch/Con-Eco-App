import React, { useState, useEffect } from 'react';
import CustomerSidebar from '../components/CustomerSidebar';

function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/customer/cart', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.cart) setCartItems(data.cart);
        setLoading(false);
      })
      .catch(err => setLoading(false));
  }, []);

  return (
    <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
      <CustomerSidebar />
      <main style={{ flex: 1 }}>
        <h2 style={{ fontSize: '2rem', color: 'white', marginTop: 0 }}>My Cart</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Review your items before checkout.</p>
        <hr style={{ borderColor: 'var(--surface-border)', marginBottom: '1.5rem' }} />
        
        {loading ? (
          <p>Loading cart...</p>
        ) : cartItems.length > 0 ? (
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {cartItems.map((item, idx) => (
                <li key={idx} style={{ padding: '1rem 0', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{item.name} (x{item.quantity})</span>
                  <span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>₹{item.price * item.quantity}</span>
                </li>
              ))}
            </ul>
             <a href="/customer/checkout" className="btn" style={{ background: '#238636', display: 'inline-block', marginTop: '1.5rem' }}>Proceed to Checkout</a>
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
            <h3 style={{ color: 'var(--text-secondary)' }}>Your cart is currently empty.</h3>
          </div>
        )}
      </main>
    </div>
  );
}

export default Cart;
