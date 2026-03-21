import React, { useState, useEffect } from 'react';
import CustomerSidebar from '../components/CustomerSidebar';

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/customer/products', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.products) setProducts(data.products);
        setLoading(false);
      })
      .catch(err => setLoading(false));
  }, []);

  return (
    <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
      <CustomerSidebar />
      <main style={{ flex: 1 }}>
        <h2 style={{ fontSize: '2rem', color: 'white', marginTop: 0 }}>Products</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Browse construction materials from vendors.</p>
        <hr style={{ borderColor: 'var(--surface-border)', marginBottom: '1.5rem' }} />
        
        {loading ? (
          <p>Loading products...</p>
        ) : products.length > 0 ? (
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            {products.map(p => (
              <div key={p.id} className="glass-panel" style={{ padding: '1.5rem', flex: '1 1 250px' }}>
                <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>{p.product_name}</h3>
                <p style={{ color: 'var(--primary-color)', fontWeight: 'bold', marginBottom: '1rem' }}>₹{p.price}</p>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Vendor: {p.vendor_name}</p>
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
