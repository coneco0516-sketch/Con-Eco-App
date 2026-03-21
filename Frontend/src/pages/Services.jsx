import React, { useState, useEffect } from 'react';
import CustomerSidebar from '../components/CustomerSidebar';

function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetch('/api/customer/services', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.items) setServices(data.items);
        setLoading(false);
      })
      .catch(err => setLoading(false));
  }, []);

  const bookService = async (itemId, itemType, quantity) => {
    try {
      const resp = await fetch('/api/customer/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_type: itemType, item_id: itemId, quantity: quantity }),
        credentials: 'include'
      });
      const data = await resp.json();
      if (data.status === 'success') {
        setMessage({ type: 'success', text: 'Service added to cart! Proceed to checkout.' });
        setTimeout(() => setMessage({ type: '', text: '' }), 2000);
      } else {
        setMessage({ type: 'error', text: 'Failed to book service' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error' });
    }
  };

  return (
    <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
      <CustomerSidebar />
      <main style={{ flex: 1 }}>
        <h2 style={{ fontSize: '2rem', color: 'white', marginTop: 0 }}>Services</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Browse available services from providers.</p>
        <hr style={{ borderColor: 'var(--surface-border)', marginBottom: '1.5rem' }} />
        
        {message.text && (
          <div style={{ padding: '1rem', marginBottom: '1rem', borderRadius: '4px', background: message.type === 'success' ? 'rgba(36, 134, 54, 0.3)' : 'rgba(248, 81, 73, 0.3)', color: message.type === 'success' ? '#238636' : '#f85149' }}>
            {message.text}
          </div>
        )}
        
        {loading ? (
          <p>Loading services...</p>
        ) : services.length > 0 ? (
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            {services.map(s => (
              <div key={s.item_id} className="glass-panel" style={{ padding: '1.5rem', flex: '1 1 250px', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>{s.name}</h3>
                <p style={{ color: 'var(--primary-color)', fontWeight: 'bold', marginBottom: '1rem' }}>₹{s.price}</p>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 'auto' }}>Provider: {s.vendor_name}</p>
                <button 
                  onClick={() => bookService(s.item_id, 'Service', 1)}
                  className="btn"
                  style={{ background: '#238636', marginTop: '1rem', width: '100%', padding: '0.5rem' }}
                >
                  Book Service
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
            <h3 style={{ color: 'var(--text-secondary)' }}>No services listed right now.</h3>
          </div>
        )}
      </main>
    </div>
  );
}

export default Services;
