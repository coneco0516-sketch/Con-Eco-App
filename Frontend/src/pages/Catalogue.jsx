import React, { useState, useEffect } from 'react';
import VendorSidebar from '../components/VendorSidebar';

function Catalogue() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/vendor/catalogue', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.catalogue) setItems(data.catalogue);
        setLoading(false);
      })
      .catch(err => setLoading(false));
  }, []);

  return (
    <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
      <VendorSidebar />
      <main style={{ flex: 1 }}>
        <h2 style={{ fontSize: '2rem', color: 'white', marginTop: 0 }}>My Catalogue</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>View the products and services you have listed.</p>
        <hr style={{ borderColor: 'var(--surface-border)', marginBottom: '1.5rem' }} />
        
        {loading ? (
          <p>Loading catalogue...</p>
        ) : items.length > 0 ? (
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            {items.map(i => (
              <div key={i.id} className="glass-panel" style={{ padding: '1.5rem', flex: '1 1 250px' }}>
                <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>{i.name}</h3>
                <p style={{ color: 'var(--primary-color)', fontWeight: 'bold', marginBottom: '1rem' }}>₹{i.price}</p>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Type: {i.type}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
            <h3 style={{ color: 'var(--text-secondary)' }}>You have no items in your catalogue.</h3>
          </div>
        )}
      </main>
    </div>
  );
}

export default Catalogue;
