import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CustomerSidebar from '../components/CustomerSidebar';

function CustomerItemDetail() {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [quantity, setQuantity] = useState(1);

  const isProduct = type.toLowerCase() === 'product';
  const endpoint = isProduct ? '/api/customer/products' : '/api/customer/services';

  useEffect(() => {
    fetch(endpoint, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.items) {
          const foundItem = data.items.find(i => String(i.item_id) === String(id));
          setItem(foundItem);
        }
        setLoading(false);
      })
      .catch(err => setLoading(false));
  }, [endpoint, id]);

  const handleAction = async () => {
    try {
      const resp = await fetch('/api/customer/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          item_type: isProduct ? 'Product' : 'Service', 
          item_id: item.item_id, 
          quantity: quantity 
        }),
        credentials: 'include'
      });
      const data = await resp.json();
      if (data.status === 'success') {
        setMessage({ type: 'success', text: isProduct ? 'Added to cart!' : 'Service added to cart! Proceed to checkout.' });
        setTimeout(() => setMessage({ type: '', text: '' }), 2000);
      } else {
        setMessage({ type: 'error', text: 'Failed to process request' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error' });
    }
  };

  return (
    <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
      <CustomerSidebar />
      <main style={{ flex: 1 }}>
        <button 
          onClick={() => navigate(-1)} 
          className="btn" 
          style={{ background: 'transparent', border: '1px solid var(--surface-border)', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}
        >
          &larr; Back
        </button>

        {message.text && (
          <div style={{ padding: '1rem', marginBottom: '1rem', borderRadius: '4px', background: message.type === 'success' ? 'rgba(36, 134, 54, 0.3)' : 'rgba(248, 81, 73, 0.3)', color: message.type === 'success' ? '#238636' : '#f85149' }}>
            {message.text}
          </div>
        )}

        {loading ? (
          <p>Loading details...</p>
        ) : item ? (
          <div className="glass-panel" style={{ padding: '2rem', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            {/* Image Section */}
            <div style={{ flex: '1 1 400px' }}>
              {item.image_url ? (
                <img 
                  src={item.image_url} 
                  alt={item.name} 
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://placehold.co/800x600?text=" + encodeURIComponent(item.name);
                  }}
                  style={{ width: '100%', borderRadius: '8px', objectFit: 'cover' }} 
                />
              ) : (
                <div style={{ width: '100%', height: '300px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                  No Image Available
                </div>
              )}
            </div>

            {/* Details Section */}
            <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column' }}>
              <h1 style={{ color: 'white', marginTop: 0, marginBottom: '0.5rem', fontSize: '2.5rem' }}>{item.name}</h1>
              <p style={{ color: 'var(--primary-color)', fontSize: '1.2rem', marginBottom: '1.5rem' }}>
                Provider: <span style={{ color: 'white' }}>{item.vendor_name}</span>
              </p>
              
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                <h3 style={{ color: 'var(--text-secondary)', marginTop: 0 }}>Pricing Details</h3>
                <p style={{ fontSize: '1.2rem', margin: '0.5rem 0' }}>Base: ₹{item.price} {item.unit ? `/ ${item.unit}` : ''}</p>
                <p style={{ color: '#ffd700', margin: '0.5rem 0' }}>Commission (5%): ₹{(item.price * 0.05).toFixed(2)}</p>
                <p style={{ color: 'var(--primary-color)', fontWeight: 'bold', fontSize: '1.5rem', margin: '1rem 0 0 0', borderTop: '1px solid var(--surface-border)', paddingTop: '1rem' }}>
                  Total: ₹{(parseFloat(item.price) + parseFloat(item.price) * 0.05).toFixed(2)}
                </p>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>Description</h3>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                  {item.description || 'No description provided.'}
                </p>
                
                {item.specifications && (
                  <div style={{ marginTop: '1.5rem' }}>
                    <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>Specifications / Features</h3>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                      {item.specifications}
                    </p>
                  </div>
                )}
                
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
                  {item.category && (
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                      <strong>Category:</strong> <span style={{ background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px', marginLeft: '0.5rem' }}>{item.category}</span>
                    </p>
                  )}
                  {item.brand && (
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                      <strong>Brand:</strong> <span style={{ background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px', marginLeft: '0.5rem' }}>{item.brand}</span>
                    </p>
                  )}
                  {item.delivery_time && (
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                      <strong>Delivery / Availability:</strong> <span style={{ background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px', marginLeft: '0.5rem' }}>{item.delivery_time}</span>
                    </p>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: 'auto', alignItems: 'flex-end' }}>
                {isProduct && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ color: 'var(--text-secondary)' }}>Quantity</label>
                    <input 
                      type="number" 
                      min="1" 
                      value={quantity} 
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="input-field"
                      style={{ width: '80px', textAlign: 'center' }}
                    />
                  </div>
                )}
                <button 
                  onClick={handleAction}
                  className="btn"
                  style={{ background: '#238636', flex: 1, padding: '1rem', fontSize: '1.1rem' }}
                >
                  {isProduct ? 'Add to Cart' : 'Book Service'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
            <h3 style={{ color: 'var(--text-secondary)' }}>Item not found.</h3>
          </div>
        )}
      </main>
    </div>
  );
}

export default CustomerItemDetail;
