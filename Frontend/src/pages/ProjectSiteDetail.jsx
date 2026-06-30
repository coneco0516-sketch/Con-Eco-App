import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CustomerSidebar from '../components/CustomerSidebar';
import '../index.css';

const API = import.meta.env.VITE_API_URL || 'https://api.coneco.store';

function ProjectSiteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [site, setSite] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API}/api/customer/sites/${id}/orders`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setSite(data.site);
          setOrders(data.orders);
        } else {
          setError(data.message || 'Failed to load site details');
        }
        setLoading(false);
      })
      .catch(err => {
        setError('Connection error');
        setLoading(false);
      });
  }, [id]);

  const calculateTotalSpent = () => {
    return orders.reduce((sum, order) => sum + parseFloat(order.amount || 0), 0);
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

  if (loading) {
    return (
      <div className="dashboard-layout">
        <CustomerSidebar />
        <main style={{ flex: 1, padding: '2rem' }}>Loading...</main>
      </div>
    );
  }

  if (error || !site) {
    return (
      <div className="dashboard-layout">
        <CustomerSidebar />
        <main style={{ flex: 1, padding: '2rem' }}>
          <h2 style={{ color: 'var(--danger-color)' }}>{error || 'Site not found'}</h2>
          <button className="btn" onClick={() => navigate('/customer/projects')}>Back to Projects</button>
        </main>
      </div>
    );
  }

  const totalSpent = calculateTotalSpent();
  const budget = site.budget ? parseFloat(site.budget) : 0;
  const progress = calculateProgress(totalSpent, budget);
  const progressColor = getProgressColor(totalSpent, budget);

  return (
    <div className="dashboard-layout">
      <CustomerSidebar />
      <main style={{ flex: 1, padding: '2rem' }}>
        <button className="btn" onClick={() => navigate('/customer/projects')} style={{ marginBottom: '1rem', background: 'var(--surface-border)', color: 'var(--text-highlight)' }}>
          ← Back to Projects
        </button>
        
        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ fontSize: '2rem', color: 'var(--text-highlight)', margin: 0 }}>{site.site_name}</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', margin: '0.5rem 0' }}>
                📍 {site.site_address}, {site.city}, {site.state}
              </p>
              <span className={`status-badge ${site.status.toLowerCase()}`}>{site.status}</span>
            </div>
            
            <div style={{ textAlign: 'right', minWidth: '300px' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-highlight)' }}>Budget Tracking</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Spent: ₹{totalSpent.toFixed(2)}</span>
                <span style={{ color: 'var(--text-secondary)' }}>Budget: {budget > 0 ? `₹${budget.toFixed(2)}` : 'No budget set'}</span>
              </div>
              {budget > 0 && (
                <div style={{ height: '12px', background: 'var(--surface-border)', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${progress}%`, background: progressColor, transition: 'width 0.3s ease' }}></div>
                </div>
              )}
            </div>
          </div>
        </div>

        <h3 style={{ color: 'var(--text-highlight)', marginBottom: '1rem' }}>Orders for this Site</h3>
        
        {orders.length === 0 ? (
          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)' }}>No orders found for this project site.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {orders.map(order => (
              <div key={order.order_id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-highlight)' }}>
                    {order.item_name} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>x{order.quantity}</span>
                  </h4>
                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Vendor: {order.vendor_name}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {order.date} • Type: {order.order_type}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary-color)', margin: '0 0 0.5rem 0' }}>
                    ₹{parseFloat(order.amount).toFixed(2)}
                  </p>
                  <span className={`status-badge ${order.status.toLowerCase().replace(' ', '-')}`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default ProjectSiteDetail;
