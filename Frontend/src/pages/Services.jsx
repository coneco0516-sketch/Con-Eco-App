import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomerSidebar from '../components/CustomerSidebar';

const API = import.meta.env.VITE_API_URL || 'https://con-eco-app-w78g.onrender.com';

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

  return (
    <div className="dashboard-layout">
      <CustomerSidebar />
      <main style={{ flex: 1 }}>
        <h2 style={{ fontSize: '2rem', color: 'var(--text-highlight)', marginTop: 0 }}>Services</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Browse available services from providers.</p>
        <hr style={{ borderColor: 'var(--surface-border)', marginBottom: '1.5rem' }} />
        
        {message.text && (
          <div style={{ padding: '1rem', marginBottom: '1rem', borderRadius: '4px', background: message.type === 'success' ? 'rgba(36, 134, 54, 0.3)' : 'rgba(248, 81, 73, 0.3)', color: message.type === 'success' ? '#238636' : '#f85149' }}>
            {message.text}
          </div>
        )}

        {/* --- Search & Filter Bar --- */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <input 
            type="text" 
            placeholder="Search services..." 
            className="input-field" 
            style={{ flex: 1, minWidth: '200px' }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <select 
            className="input-field" 
            style={{ width: '200px' }} 
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
        
        {loading ? (
          <p>Loading services...</p>
        ) : services.length > 0 ? (
          <div className="dashboard-row wrap">
            {services
              .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.description?.toLowerCase().includes(searchTerm.toLowerCase()))
              .filter(s => {
                if (category === "") return true;
                // Match by explicit category OR by searching for the category text in name/description
                if (s.category === category) return true;
                
                const searchIn = (s.name + " " + (s.description || "")).toLowerCase();
                return searchIn.includes(category.toLowerCase());
              })
              .map(s => (
              <div 
                key={s.item_id} 
                className="glass-panel" 
                style={{ padding: '1.5rem', flex: '1 1 250px', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.02)' } }}
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
                    style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '4px', marginBottom: '1rem' }} 
                  />
                ) : (
                  <div style={{ width: '100%', height: '180px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>No Image</div>
                )}
                <h3 style={{ color: 'var(--text-highlight)', marginBottom: '0.5rem' }}>{s.name}</h3>
                <div style={{ marginBottom: '1rem' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.25rem 0' }}>Base: ₹{s.price}</p>
                  <p style={{ color: '#ffd700', fontSize: '0.85rem', margin: '0.25rem 0' }}>Commission ({commissionRate}%): ₹{(s.price * (parseFloat(commissionRate) / 100)).toFixed(2)}</p>
                  <p style={{ color: 'var(--primary-color)', fontWeight: 'bold', margin: '0.5rem 0 0 0' }}>Total: ₹{(parseFloat(s.price) + parseFloat(s.price) * (parseFloat(commissionRate) / 100)).toFixed(2)}</p>
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 'auto' }}>Provider: {s.vendor_name}</p>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    bookService(s.item_id, 'Service', 1);
                  }}
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
