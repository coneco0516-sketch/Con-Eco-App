import React, { useState, useEffect } from 'react';
import CustomerSidebar from '../components/CustomerSidebar';

function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  const loadCart = () => {
    setLoading(true);
    fetch('/api/customer/cart', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.items) setCartItems(data.items);
        setLoading(false);
      })
      .catch(err => setLoading(false));
  };

  useEffect(() => {
    loadCart();
  }, []);

  const removeFromCart = async (cartId) => {
    try {
      const resp = await fetch('/api/customer/cart', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart_id: cartId }),
        credentials: 'include'
      });
      const data = await resp.json();
      if (data.status === 'success') {
        setMessage({ type: 'success', text: 'Item removed from cart' });
        loadCart();
        setTimeout(() => setMessage({ type: '', text: '' }), 2000);
      } else {
        setMessage({ type: 'error', text: 'Failed to remove item' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error' });
    }
  };

  return (
    <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
      <CustomerSidebar />
      <main style={{ flex: 1 }}>
        <h2 style={{ fontSize: '2rem', color: 'white', marginTop: 0 }}>My Cart</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Review your items before checkout.</p>
        <hr style={{ borderColor: 'var(--surface-border)', marginBottom: '1.5rem' }} />
        
        {message.text && (
          <div style={{ padding: '1rem', marginBottom: '1rem', borderRadius: '4px', background: message.type === 'success' ? 'rgba(36, 134, 54, 0.3)' : 'rgba(248, 81, 73, 0.3)', color: message.type === 'success' ? '#238636' : '#f85149' }}>
            {message.text}
          </div>
        )}
        
        {loading ? (
          <p>Loading cart...</p>
        ) : cartItems.length > 0 ? (
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {cartItems.map((item) => (
                <li key={item.cart_id} style={{ padding: '1rem 0', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ margin: 0, color: 'white' }}>{item.name} (x{item.quantity})</p>
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Type: {item.item_type}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ color: 'var(--primary-color)', fontWeight: 'bold', minWidth: '80px', textAlign: 'right' }}>₹{item.price * item.quantity}</span>
                    <button 
                      onClick={() => removeFromCart(item.cart_id)}
                      className="btn danger"
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                    >
                      Remove
                    </button>
                  </div>
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
