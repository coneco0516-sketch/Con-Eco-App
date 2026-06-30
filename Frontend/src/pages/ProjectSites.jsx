import React, { useEffect, useState } from 'react';
import CustomerSidebar from '../components/CustomerSidebar';
import { useNavigate } from 'react-router-dom';
import '../index.css';

const API = import.meta.env.VITE_API_URL || 'https://api.coneco.store';

function ProjectSites() {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    site_name: '',
    site_address: '',
    city: '',
    state: '',
    budget: ''
  });

  const navigate = useNavigate();

  const fetchSites = () => {
    setLoading(true);
    fetch(`${API}/api/customer/sites`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setSites(data.sites);
        } else {
          setError(data.message || 'Failed to load sites');
        }
        setLoading(false);
      })
      .catch(err => {
        setError('Connection error');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSites();
  }, []);

  const handleCreateSite = async (e) => {
    e.preventDefault();
    if (!formData.site_name) {
      alert("Site name is required");
      return;
    }
    
    try {
      const res = await fetch(`${API}/api/customer/sites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          budget: formData.budget ? parseFloat(formData.budget) : null
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setShowModal(false);
        setFormData({ site_name: '', site_address: '', city: '', state: '', budget: '' });
        fetchSites();
      } else {
        alert(data.message || "Failed to create site");
      }
    } catch (err) {
      alert("Connection error");
    }
  };

  const calculateProgress = (spent, budget) => {
    if (!budget || budget <= 0) return 0;
    const pct = (spent / budget) * 100;
    return pct > 100 ? 100 : pct;
  };

  const getProgressColor = (spent, budget) => {
    if (!budget || budget <= 0) return 'var(--primary-color)';
    const pct = (spent / budget) * 100;
    if (pct >= 100) return 'var(--danger-color)';
    if (pct >= 80) return 'orange';
    return 'var(--primary-color)';
  };

  return (
    <div className="dashboard-layout">
      <CustomerSidebar />
      <main style={{ flex: 1, padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h2 style={{ fontSize: '2rem', color: 'var(--text-highlight)', margin: 0 }}>My Projects</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Manage your construction sites and track budgets.</p>
          </div>
          <button className="btn" onClick={() => setShowModal(true)}>+ Create New Site</button>
        </div>
        
        <hr style={{ borderColor: 'var(--surface-border)', marginBottom: '2rem' }} />

        {error && <p style={{ color: 'var(--danger-color)' }}>{error}</p>}
        {loading ? (
          <p>Loading projects...</p>
        ) : sites.length === 0 ? (
          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)' }}>No project sites found. Create one to start grouping your orders!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {sites.map(site => {
              const progress = calculateProgress(site.total_spent, site.budget);
              const color = getProgressColor(site.total_spent, site.budget);
              return (
                <div 
                  key={site.site_id} 
                  className="glass-panel" 
                  style={{ padding: '1.5rem', cursor: 'pointer', transition: 'transform 0.2s', position: 'relative' }}
                  onClick={() => navigate(`/customer/projects/${site.site_id}`)}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <h3 style={{ color: 'var(--text-highlight)', margin: '0 0 0.5rem 0' }}>{site.site_name}</h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '0 0 1rem 0' }}>
                    📍 {site.city || 'No city'}, {site.state || ''}
                  </p>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Total Orders:</span>
                    <span style={{ color: 'var(--text-highlight)', fontWeight: 'bold' }}>{site.total_orders}</span>
                  </div>
                  
                  <div style={{ marginTop: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Spent: ₹{site.total_spent.toFixed(2)}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>Budget: {site.budget ? `₹${site.budget.toFixed(2)}` : 'Not set'}</span>
                    </div>
                    {site.budget > 0 && (
                      <div style={{ height: '8px', background: 'var(--surface-border)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${progress}%`, background: color, transition: 'width 0.3s ease' }}></div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create Modal */}
        {showModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)', 
            backdropFilter: 'blur(5px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <div className="glass-panel" style={{ 
              padding: '2.5rem', width: '90%', maxWidth: '550px', 
              position: 'relative',
              animation: 'slideUp 0.3s ease-out',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}>
              <button 
                onClick={() => setShowModal(false)}
                style={{
                  position: 'absolute', top: '1.5rem', right: '1.5rem',
                  background: 'transparent', border: 'none', color: 'var(--text-secondary)',
                  fontSize: '1.5rem', cursor: 'pointer', transition: 'color 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-highlight)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
              >
                ✕
              </button>
              
              <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>🏗️</span>
                <h3 style={{ color: 'var(--text-highlight)', margin: '0 0 0.5rem 0', fontSize: '1.8rem' }}>Create Project Site</h3>
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Organize your orders by defining a new construction site.</p>
              </div>

              <form onSubmit={handleCreateSite}>
                <div style={{ marginBottom: '1.2rem' }}>
                  <label style={{ display: 'block', color: 'var(--text-highlight)', marginBottom: '0.5rem', fontWeight: 'bold' }}>Site Name <span style={{ color: 'var(--danger-color)' }}>*</span></label>
                  <input 
                    type="text" 
                    className="input-field" 
                    style={{ width: '100%', padding: '0.8rem' }} 
                    placeholder="e.g., Villa Construction - Plot 12"
                    value={formData.site_name} 
                    onChange={e => setFormData({...formData, site_name: e.target.value})} 
                    required 
                  />
                </div>

                <div style={{ marginBottom: '1.2rem' }}>
                  <label style={{ display: 'block', color: 'var(--text-highlight)', marginBottom: '0.5rem', fontWeight: 'bold' }}>Site Address</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    style={{ width: '100%', padding: '0.8rem' }} 
                    placeholder="Street address or plot number"
                    value={formData.site_address} 
                    onChange={e => setFormData({...formData, site_address: e.target.value})} 
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.2rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', color: 'var(--text-highlight)', marginBottom: '0.5rem', fontWeight: 'bold' }}>City</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      style={{ width: '100%', padding: '0.8rem' }} 
                      placeholder="City"
                      value={formData.city} 
                      onChange={e => setFormData({...formData, city: e.target.value})} 
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', color: 'var(--text-highlight)', marginBottom: '0.5rem', fontWeight: 'bold' }}>State</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      style={{ width: '100%', padding: '0.8rem' }} 
                      placeholder="State"
                      value={formData.state} 
                      onChange={e => setFormData({...formData, state: e.target.value})} 
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                  <label style={{ display: 'block', color: 'var(--text-highlight)', marginBottom: '0.5rem', fontWeight: 'bold' }}>Budget (₹) <span style={{ color: 'var(--text-secondary)', fontWeight: 'normal', fontSize: '0.85rem' }}>(Optional)</span></label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="input-field" 
                    style={{ width: '100%', padding: '0.8rem', fontSize: '1.1rem' }} 
                    placeholder="0.00"
                    value={formData.budget} 
                    onChange={e => setFormData({...formData, budget: e.target.value})} 
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="button" className="btn btn-danger" style={{ flex: 1, padding: '0.8rem', background: 'transparent', border: '1px solid var(--danger-color)', color: 'var(--danger-color)' }} onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn" style={{ flex: 2, padding: '0.8rem', fontSize: '1.1rem' }}>Create Site</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default ProjectSites;
