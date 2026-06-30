import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import CustomerSidebar from '../components/CustomerSidebar';

const API = import.meta.env.VITE_API_URL || 'https://api.coneco.store';

function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  const loadCart = (isInitial = false) => {
    if (isInitial) setLoading(true);
    fetch(`${API}/api/customer/cart`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.items) setCartItems(data.items);
        setLoading(false);
      })
      .catch(err => setLoading(false));
  };

  useEffect(() => {
    loadCart(true);
  }, []);

  const removeFromCart = async (cartId) => {
    // Optimistic UI: Remove from local state immediately
    const previousItems = [...cartItems];
    setCartItems(cartItems.filter(item => item.cart_id !== cartId));

    try {
      const resp = await fetch(`${API}/api/customer/cart`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart_id: cartId }),
        credentials: 'include'
      });
      const data = await resp.json();
      if (data.status === 'success') {
        setMessage({ type: 'success', text: 'Item removed from cart' });
        setTimeout(() => setMessage({ type: '', text: '' }), 2000);
      } else {
        setCartItems(previousItems); // Revert on failure
        setMessage({ type: 'error', text: 'Failed to remove item' });
      }
    } catch (err) {
      setCartItems(previousItems);
      setMessage({ type: 'error', text: 'Network error' });
    }
  };

  const updateQuantity = async (cartId, newQuantity) => {
    if (newQuantity < 0) return;
    
    // Optimistic UI: Update quantity in local state immediately
    const previousItems = [...cartItems];
    setCartItems(prev => prev.map(item => 
      item.cart_id === cartId ? { ...item, quantity: newQuantity } : item
    ));

    try {
      const resp = await fetch(`${API}/api/customer/cart`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart_id: cartId, quantity: newQuantity }),
        credentials: 'include'
      });
      const data = await resp.json();
      if (data.status !== 'success') {
        setCartItems(previousItems); // Revert on failure
      }
    } catch (err) {
      setCartItems(previousItems);
      console.error('Update quantity error:', err);
    }
  };

  // Compute grand total of the entire cart
  const calculateCartTotal = () => {
    return cartItems.reduce((acc, item) => {
      const baseSubtotal = item.price * item.quantity;
      const gstSubtotal = baseSubtotal * 0.18;
      const rate = item.commission_rate !== undefined ? item.commission_rate : 3.0;
      const commissionSubtotal = baseSubtotal * (parseFloat(rate) / 100);
      return acc + baseSubtotal + gstSubtotal + commissionSubtotal;
    }, 0);
  };

  return (
    <div className="dashboard-layout">
      <CustomerSidebar />
      <main style={{ flex: 1, padding: '2rem', minWidth: 0 }}>
        
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '2rem', color: 'var(--text-highlight)', marginTop: 0, fontWeight: '800' }}>My Cart</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '0.3rem 0 0 0', fontSize: '0.95rem' }}>Review procurement items and verify costs before placing an order.</p>
          <hr style={{ borderColor: 'var(--surface-border)', marginTop: '1.5rem', marginBottom: 0 }} />
        </div>
        
        {message.text && (
          <div style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', borderRadius: '8px', background: message.type === 'success' ? 'rgba(36, 134, 54, 0.15)' : 'rgba(248, 81, 73, 0.15)', color: message.type === 'success' ? '#3fb950' : '#f85149', border: message.type === 'success' ? '1px solid rgba(36, 134, 54, 0.3)' : '1px solid rgba(248, 81, 73, 0.3)', fontWeight: '600' }}>
            {message.type === 'success' ? '✨ ' : '⚠️ '} {message.text}
          </div>
        )}
        
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="glass-panel skeleton-pulse skeleton-row" style={{ height: '140px' }}></div>
            ))}
          </div>
        ) : cartItems.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Cart Items List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {cartItems.map((item) => {
                const baseSubtotal = item.price * item.quantity;
                const gstSubtotal = baseSubtotal * 0.18;
                const rate = item.commission_rate !== undefined ? item.commission_rate : 3.0;
                const commissionSubtotal = baseSubtotal * (parseFloat(rate) / 100);
                const totalSubtotal = baseSubtotal + gstSubtotal + commissionSubtotal;
                
                return (
                  <div 
                    key={item.cart_id} 
                    className="glass-panel" 
                    style={{ 
                      padding: '1.5rem', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      gap: '1.5rem', 
                      flexWrap: 'wrap',
                      borderRadius: '16px'
                    }}
                  >
                    {/* Item Description */}
                    <div style={{ flex: '1 1 300px', minWidth: 0 }}>
                      <p style={{ margin: 0, color: 'var(--text-highlight)', fontWeight: '700', fontSize: '1.15rem' }}>{item.name}</p>
                      <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        🏷️ Category: <strong style={{ color: 'var(--text-primary)' }}>{item.item_type}</strong> • 🏢 Vendor: <strong>{item.vendor_name}</strong>
                      </p>
                      
                      {/* Price Breakdown Details */}
                      <div style={{ marginTop: '0.8rem', padding: '0.8rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--surface-border)', borderRadius: '8px', display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.8rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Base: ₹{baseSubtotal.toFixed(2)}</span>
                        <span style={{ color: '#3498db' }}>GST (18%): ₹{gstSubtotal.toFixed(2)}</span>
                        <span style={{ color: '#ffd700' }}>Platform ({rate}%): ₹{commissionSubtotal.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    {/* Actions and Quantity Selector */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'space-between', flex: '1 1 auto' }}>
                      {/* Quantity Selector */}
                      <div className="quantity-selector" style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--surface-border)', borderRadius: '8px', overflow: 'hidden' }}>
                        <button 
                          className="quantity-btn"
                          style={{ background: 'none', border: 'none', color: 'var(--text-highlight)', padding: '0.6rem 0.8rem', cursor: 'pointer', fontSize: '1.1rem' }}
                          onClick={() => updateQuantity(item.cart_id, item.quantity - 1)}
                        >
                          −
                        </button>
                        <input 
                          className="quantity-input"
                          type="number" 
                          min="0" 
                          value={item.quantity} 
                          style={{ width: '45px', border: 'none', background: 'none', color: 'var(--text-highlight)', textAlign: 'center', fontSize: '0.95rem', fontWeight: '700' }}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '') {
                              setCartItems(prev => prev.map(i => 
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
                          style={{ background: 'none', border: 'none', color: 'var(--text-highlight)', padding: '0.6rem 0.8rem', cursor: 'pointer', fontSize: '1.1rem' }}
                          onClick={() => updateQuantity(item.cart_id, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>

                      {/* Subtotal */}
                      <div style={{ minWidth: '120px', textAlign: 'right' }}>
                        <span style={{ color: 'var(--primary-color)', fontWeight: '800', fontSize: '1.25rem' }}>₹{totalSubtotal.toFixed(2)}</span>
                      </div>

                      {/* Remove Button */}
                      <button 
                        onClick={() => removeFromCart(item.cart_id)}
                        className="btn danger"
                        style={{ padding: '0.6rem 0.8rem', fontSize: '0.9rem', background: 'transparent', color: '#f85149', border: '1px solid rgba(248, 81, 73, 0.3)', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
                        onMouseOver={(e) => { e.target.style.background = 'rgba(248, 81, 73, 0.1)' }}
                        onMouseOut={(e) => { e.target.style.background = 'transparent' }}
                      >
                        🗑️ Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Cart Footer / Checkout Card */}
            <div className="glass-panel" style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', borderRadius: '16px', border: '1px solid rgba(46, 160, 67, 0.3)' }}>
              <div>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '500' }}>Estimated Order Total (incl. GST & Commission)</p>
                <p style={{ margin: '0.3rem 0 0 0', fontSize: '2rem', fontWeight: '800', color: 'var(--primary-color)' }}>₹{calculateCartTotal().toFixed(2)}</p>
              </div>
              <a 
                href="/customer/checkout" 
                className="btn" 
                style={{ 
                  background: '#238636', 
                  padding: '1rem 2.2rem', 
                  fontSize: '1.05rem', 
                  fontWeight: '700',
                  textAlign: 'center',
                  borderRadius: '8px'
                }}
              >
                Proceed to Checkout 💳
              </a>
            </div>

          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '5rem 2rem', textAlign: 'center', borderRadius: '16px' }}>
            <span style={{ fontSize: '4rem', display: 'block', marginBottom: '1.5rem' }}>🛒</span>
            <h3 style={{ color: 'var(--text-highlight)', fontSize: '1.4rem', margin: '0 0 0.5rem 0', fontWeight: '700' }}>Your Cart is Empty</h3>
            <p style={{ color: 'var(--text-secondary)', margin: '0 0 2rem 0', fontSize: '0.95rem' }}>You have no items added. Explore materials or book professional services.</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/customer/products" className="btn" style={{ background: 'var(--primary-color)', padding: '0.8rem 1.8rem', fontSize: '0.95rem', fontWeight: '600' }}>
                Browse Products
              </Link>
              <Link to="/customer/services" className="btn" style={{ background: 'transparent', border: '1px solid var(--surface-border)', color: 'var(--text-highlight)', padding: '0.8rem 1.8rem', fontSize: '0.95rem', fontWeight: '600' }}>
                Explore Services
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Cart;
