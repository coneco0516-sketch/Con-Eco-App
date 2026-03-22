import React, { useState, useEffect } from 'react';
import CustomerSidebar from '../components/CustomerSidebar';

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetch('/api/customer/products', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.items) setProducts(data.items);
        setLoading(false);
      })
      .catch(err => setLoading(false));
  }, []);

  const addToCart = async (itemId, itemType, quantity) => {
    try {
      const resp = await fetch('/api/customer/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_type: itemType, item_id: itemId, quantity: quantity }),
        credentials: 'include'
      });
      const data = await resp.json();
      if (data.status === 'success') {
        setMessage({ type: 'success', text: 'Added to cart!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 2000);
      } else {
        setMessage({ type: 'error', text: 'Failed to add to cart' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error' });
    }
  };

  return (
    <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
      <CustomerSidebar />
      <main style={{ flex: 1 }}>
        <h2 style={{ fontSize: '2rem', color: 'white', marginTop: 0 }}>Products</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Browse construction materials from vendors.</p>
        <hr style={{ borderColor: 'var(--surface-border)', marginBottom: '1.5rem' }} />
        
        {message.text && (
          <div style={{ padding: '1rem', marginBottom: '1rem', borderRadius: '4px', background: message.type === 'success' ? 'rgba(36, 134, 54, 0.3)' : 'rgba(248, 81, 73, 0.3)', color: message.type === 'success' ? '#238636' : '#f85149' }}>
            {message.text}
          </div>
        )}
        
        {loading ? (
          <p>Loading products...</p>
        ) : products.length > 0 ? (
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            {products.map(p => (
              <div key={p.item_id} className="glass-panel" style={{ padding: '1.5rem', flex: '1 1 250px', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>{p.name}</h3>
                <div style={{ marginBottom: '1rem' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.25rem 0' }}>Base: ₹{p.price}</p>
                  <p style={{ color: '#ffd700', fontSize: '0.85rem', margin: '0.25rem 0' }}>Commission (5%): ₹{(p.price * 0.05).toFixed(2)}</p>
                  <p style={{ color: 'var(--primary-color)', fontWeight: 'bold', margin: '0.5rem 0 0 0' }}>Total: ₹{(parseFloat(p.price) + parseFloat(p.price) * 0.05).toFixed(2)}</p>
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 'auto' }}>Vendor: {p.vendor_name}</p>
                <button 
                  onClick={() => addToCart(p.item_id, 'Product', 1)}
                  className="btn"
                  style={{ background: '#238636', marginTop: '1rem', width: '100%', padding: '0.5rem' }}
                >
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
            <h3 style={{ color: 'var(--text-secondary)' }}>No products listed right now.</h3>
          </div>
        )}
      </main>
    </div>
  );
}

export default Products;
