import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomerSidebar from '../components/CustomerSidebar';

const API = import.meta.env.VITE_API_URL || 'https://api.coneco.store';

function Services() {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [commissionRate, setCommissionRate] = useState(3.0);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetch(`${API}/api/customer/services`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.items) setServices(data.items);
        if (data.commission_rate !== undefined) setCommissionRate(data.commission_rate);
        setLoading(false);
      })
      .catch(err => setLoading(false));
  }, []);

  const bookService = async (itemId, itemType, quantity) => {
    try {
      const resp = await fetch(`${API}/api/customer/cart`, {
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

  const filteredServices = services.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (s.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = category === "" || s.category === category || 
                            (s.name + " " + (s.description || "")).toLowerCase().includes(category.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="dashboard-layout">
      <CustomerSidebar />
      <main style={{ flex: 1, padding: '2rem', minWidth: 0 }}>
        
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '2rem', color: 'var(--text-highlight)', marginTop: 0, fontWeight: '800' }}>Services Catalogue</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '0.3rem 0 0 0', fontSize: '0.95rem' }}>Find and book experienced local construction professionals and contractors.</p>
          <hr style={{ borderColor: 'var(--surface-border)', marginTop: '1.5rem', marginBottom: 0 }} />
        </div>
        
        {message.text && (
          <div style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', borderRadius: '8px', background: message.type === 'success' ? 'rgba(36, 134, 54, 0.15)' : 'rgba(248, 81, 73, 0.15)', color: message.type === 'success' ? '#3fb950' : '#f85149', border: message.type === 'success' ? '1px solid rgba(36, 134, 54, 0.3)' : '1px solid rgba(248, 81, 73, 0.3)', fontWeight: '600' }}>
            {message.type === 'success' ? '✨ ' : '⚠️ '} {message.text}
          </div>
        )}

        {/* --- Search & Filter Bar --- */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <input 
            type="text" 
            placeholder="Search services..." 
            className="input-field" 
            style={{ flex: 1, minWidth: '200px', background: 'var(--input-bg)', color: 'var(--text-highlight)', border: '1px solid var(--surface-border)', padding: '0.8rem 1rem', borderRadius: '8px', outline: 'none' }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <select 
            className="input-field" 
            style={{ width: '200px', background: 'var(--input-bg)', color: 'var(--text-highlight)', border: '1px solid var(--surface-border)', padding: '0.8rem 1rem', borderRadius: '8px', outline: 'none', cursor: 'pointer' }} 
            value={category} 
            onChange={e => setCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="Labor">General Labor</option>
            <option value="Plumbing">Plumbing Services</option>
            <option value="Electrical">Electrical Work</option>
            <option value="Architecture">Architecture & Design</option>
            <option value="General">Other Services</option>
          </select>
        </div>
        
        {/* Services Cards Grid */}
        {loading ? (
          <div className="responsive-grid">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="glass-panel skeleton-pulse skeleton-card"></div>
            ))}
          </div>
        ) : filteredServices.length > 0 ? (
          <div className="responsive-grid">
            {filteredServices.map(s => (
              <div 
                key={s.item_id} 
                className="glass-panel interactive-card" 
                style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', cursor: 'pointer', borderRadius: '16px' }}
                onClick={() => navigate(`/customer/item/service/${s.item_id}`)}
              >
                {s.image_url ? (
                  <img 
                    src={s.image_url} 
                    alt={s.name} 
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://placehold.co/600x400?text=" + encodeURIComponent(s.name);
                    }}
                    style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '12px', marginBottom: '1rem', border: '1px solid var(--surface-border)' }} 
                  />
                ) : (
                  <div style={{ width: '100%', height: '180px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--surface-border)', borderRadius: '12px', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    No Image Available
                  </div>
                )}
                
                <h3 style={{ color: 'var(--text-highlight)', margin: '0 0 0.5rem 0', fontSize: '1.15rem', fontWeight: '700' }}>{s.name}</h3>
                
                <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>Base Price: ₹{s.price}</p>
                  <p style={{ color: '#ffd700', fontSize: '0.85rem', margin: 0, fontWeight: '500' }}>Commission ({commissionRate}%): ₹{(s.price * (parseFloat(commissionRate) / 100)).toFixed(2)}</p>
                  <p style={{ color: 'var(--primary-color)', fontWeight: '700', margin: '0.25rem 0 0 0', fontSize: '1.05rem' }}>Total: ₹{(parseFloat(s.price) + parseFloat(s.price) * (parseFloat(commissionRate) / 100)).toFixed(2)}</p>
                </div>
                
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', marginTop: 'auto' }}>
                  🏢 Provider: <strong style={{ color: 'var(--text-primary)' }}>{s.vendor_name}</strong>
                </p>
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    bookService(s.item_id, 'Service', 1);
                  }}
                  className="btn"
                  style={{ width: '100%', padding: '0.8rem', fontSize: '0.95rem', fontWeight: '700', transition: 'all 0.2s' }}
                >
                  🛠️ Book Service
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center', borderRadius: '16px' }}>
            <span style={{ fontSize: '3.5rem', display: 'block', marginBottom: '1rem' }}>🔍</span>
            <h3 style={{ color: 'var(--text-highlight)', fontSize: '1.4rem', margin: '0 0 0.5rem 0', fontWeight: '700' }}>No Services Found</h3>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem' }}>Try adjusting your search criteria or checking another category.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default Services;
