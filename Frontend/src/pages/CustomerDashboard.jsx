import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import CustomerSidebar from '../components/CustomerSidebar';

const API = import.meta.env.VITE_API_URL || 'https://api.coneco.store';

function CustomerDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const userName = localStorage.getItem('user_name') || 'Customer';

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('is_logged_in');
    const role = localStorage.getItem('user_role');

    if (!isLoggedIn || role !== 'Customer') {
      navigate('/login');
      return;
    }

    // Show announcement if not seen in this session
    const hasSeen = sessionStorage.getItem('announcement_seen');
    if (!hasSeen) {
      setShowAnnouncement(true);
    }

    // Fetch dashboard stats
    fetch(`${API}/api/customer/dashboard`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setStats(data.stats);
          setRecentOrders(data.recent_orders || []);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Dashboard fetch error:", err);
        setLoading(false);
      });

  }, [navigate]);

  const closeAnnouncement = () => {
    setShowAnnouncement(false);
    sessionStorage.setItem('announcement_seen', 'true');
  };

  return (
    <div className="dashboard-layout">

      {/* Test Version Announcement Popup */}
      {showAnnouncement && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          animation: 'fadeIn 0.4s ease-out'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '500px',
            padding: '2.5rem',
            textAlign: 'center',
            border: '1px solid rgba(255, 215, 0, 0.3)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.8)',
            position: 'relative'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <h3 style={{ color: '#ffd700', fontSize: '1.5rem', marginBottom: '1rem' }}>Test Version Active</h3>
            <p style={{
              color: 'var(--text-highlight)',
              fontSize: '1.1rem',
              lineHeight: '1.6',
              marginBottom: '2rem'
            }}>
              As this is a <strong>test version</strong> of the app, if you want to place an order, kindly select the payment option as <strong>only COD (Cash on Delivery)</strong>.
            </p>
            <button
              onClick={closeAnnouncement}
              className="btn"
              style={{
                background: 'var(--primary-color)',
                padding: '0.8rem 2rem',
                fontSize: '1rem',
                fontWeight: 'bold'
              }}
            >
              I Understand
            </button>
          </div>
        </div>
      )}

      {/* LEFT PANEL: Sidebar */}
      <CustomerSidebar />

      {/* RIGHT CONTENT: Dashboard Cards */}
      <main style={{ flex: 1, padding: '2rem' }}>
        {/* Welcome Header */}
        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '2.2rem', color: 'var(--text-highlight)', margin: 0 }}>Welcome back, {userName}! 👋</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', marginBottom: 0 }}>Empower your projects with ConEco bulk procurement and verified site services.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link to="/customer/rfq" className="btn" style={{ background: 'var(--primary-color)' }}>⚡ Create RFQ</Link>
            <Link to="/customer/products" className="btn" style={{ background: 'var(--surface-border)', color: 'var(--text-highlight)' }}>Browse Products</Link>
          </div>
        </div>

        {/* Live Stat KPI Tiles */}
        <div className="dashboard-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="stat-card glass-panel interactive-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <span style={{ fontSize: '2.5rem' }}>📦</span>
            <h3>Total Orders</h3>
            <p className="stat-value">{loading ? '...' : (stats ? stats.orders_count : 0)}</p>
            <Link to="/customer/orders" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '600', marginTop: '10px', display: 'inline-block' }}>View Orders →</Link>
          </div>
          <div className="stat-card glass-panel interactive-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <span style={{ fontSize: '2.5rem' }}>🛠️</span>
            <h3>Booked Services</h3>
            <p className="stat-value">{loading ? '...' : (stats ? stats.services_count : 0)}</p>
            <Link to="/customer/booked-services" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '600', marginTop: '10px', display: 'inline-block' }}>Manage Bookings →</Link>
          </div>
          <div className="stat-card glass-panel interactive-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <span style={{ fontSize: '2.5rem' }}>🏗️</span>
            <h3>Active Sites</h3>
            <p className="stat-value">{loading ? '...' : (stats ? stats.sites_count : 0)}</p>
            <Link to="/customer/projects" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '600', marginTop: '10px', display: 'inline-block' }}>Manage Projects →</Link>
          </div>
          <div className="stat-card glass-panel interactive-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <span style={{ fontSize: '2.5rem' }}>🔄</span>
            <h3>Open RFQs</h3>
            <p className="stat-value">{loading ? '...' : (stats ? stats.rfq_count : 0)}</p>
            <Link to="/customer/rfq" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '600', marginTop: '10px', display: 'inline-block' }}>RFQ Board →</Link>
          </div>
        </div>

        {/* Row 2: Recent Activity & Quick Navigation */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          {/* Quick Actions Panel */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ color: 'var(--text-highlight)', margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              ⚡ Quick Procurement Actions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Link to="/customer/products" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--surface-border)', borderRadius: '10px', textDecoration: 'none', color: 'inherit', transition: 'all 0.2s' }} className="quick-action-link interactive-card">
                <span style={{ fontSize: '2rem', padding: '8px', background: 'rgba(46, 160, 67, 0.1)', borderRadius: '8px' }}>🧱</span>
                <div>
                  <h4 style={{ margin: 0, color: 'var(--text-highlight)' }}>Request Raw Materials</h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Purchase cement, bricks, aggregates, and steel directly from verified sellers.</p>
                </div>
              </Link>

              <Link to="/customer/services" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--surface-border)', borderRadius: '10px', textDecoration: 'none', color: 'inherit', transition: 'all 0.2s' }} className="quick-action-link interactive-card">
                <span style={{ fontSize: '2rem', padding: '8px', background: 'rgba(56, 112, 224, 0.1)', borderRadius: '8px' }}>👷</span>
                <div>
                  <h4 style={{ margin: 0, color: 'var(--text-highlight)' }}>Book Construction Experts</h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Hire contractors, earthmoving machinery, soil testing, or structural designers.</p>
                </div>
              </Link>

              <Link to="/customer/projects" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--surface-border)', borderRadius: '10px', textDecoration: 'none', color: 'inherit', transition: 'all 0.2s' }} className="quick-action-link interactive-card">
                <span style={{ fontSize: '2rem', padding: '8px', background: 'rgba(241, 196, 15, 0.1)', borderRadius: '8px' }}>📍</span>
                <div>
                  <h4 style={{ margin: 0, color: 'var(--text-highlight)' }}>Add/Track Project Site</h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Set structural budgets and tag purchases to track automated spending.</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Recent Orders Panel */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ color: 'var(--text-highlight)', margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              ⏱️ Recent Orders
            </h3>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <div className="glass-panel skeleton-pulse skeleton-row" style={{ height: '70px' }}></div>
                <div className="glass-panel skeleton-pulse skeleton-row" style={{ height: '70px' }}></div>
              </div>
            ) : recentOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-secondary)' }}>
                <span style={{ fontSize: '2rem' }}>📭</span>
                <p style={{ margin: '10px 0 0 0' }}>No orders placed yet.</p>
                <Link to="/customer/products" style={{ color: 'var(--primary-color)', fontSize: '0.9rem', display: 'inline-block', marginTop: '10px' }}>Start Shopping</Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {recentOrders.map(order => (
                  <div key={order.order_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--surface-border)', borderRadius: '8px' }}>
                    <div>
                      <h4 style={{ margin: 0, color: 'var(--text-highlight)', fontSize: '0.95rem' }}>{order.item_name || `Order #${order.order_id}`}</h4>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{order.date} • ID: #{order.order_id}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, fontWeight: 'bold', color: 'var(--primary-color)' }}>₹{order.amount}</p>
                      <span style={{ fontSize: '0.75rem', padding: '2px 6px', borderRadius: '4px', background: order.status === 'Pending' ? 'rgba(210, 109, 14, 0.2)' : 'rgba(46, 160, 67, 0.2)', color: order.status === 'Pending' ? '#d26d0e' : 'var(--primary-color)', fontWeight: 'bold', border: `1px solid ${order.status === 'Pending' ? '#d26d0e' : 'var(--primary-color)'}` }}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
                <Link to="/customer/orders" style={{ textAlign: 'center', color: 'var(--primary-color)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 'bold', marginTop: '10px' }}>View All Orders →</Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default CustomerDashboard;
