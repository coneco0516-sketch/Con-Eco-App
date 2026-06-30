import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';

const API = import.meta.env.VITE_API_URL || 'https://api.coneco.store';

function AdminDashboard() {
  const [stats, setStats] = useState({
    pending_vendors: '...',
    pending_customers: '...',
    total_orders: '...',
    total_revenue: '...'
  });
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const userRole = localStorage.getItem('user_role');

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('is_logged_in');
    const role = localStorage.getItem('user_role');

    if (!isLoggedIn || !['Super Admin', 'Admin', 'Employee'].includes(role)) {
      navigate('/login');
      return;
    }

    fetch(`${API}/api/admin/dashboard_stats`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'not_logged_in') {
          localStorage.removeItem('is_logged_in');
          navigate('/login');
        } else if (data.stats) {
          setStats(data.stats);
        } else {
          setError(data.message || 'Failed to load stats');
        }
      })
      .catch(err => setError('Network or authorization error.'));
  }, [navigate]);

  return (
    <div className="dashboard-layout">

      {/* LEFT PANEL: Sidebar */}
      <AdminSidebar />

      {/* RIGHT CONTENT: Dashboard Cards */}
      <main style={{ flex: 1, padding: '2rem', minWidth: 0 }}>
        
        {/* Header & Greeting */}
        <div style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '2.2rem', color: 'var(--text-highlight)', margin: 0, fontWeight: '800' }}>Admin Dashboard</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '0.3rem 0 0 0', fontSize: '0.98rem' }}>
            Welcome back! You are logged in as <span style={{ color: 'var(--primary-color)', fontWeight: '700' }}>{userRole}</span>.
          </p>
          <hr style={{ borderColor: 'var(--surface-border)', marginTop: '1.5rem', marginBottom: 0 }} />
        </div>

        {error && (
          <div style={{ padding: '1rem', marginBottom: '1.5rem', borderRadius: '8px', background: 'rgba(248, 81, 73, 0.15)', color: '#f85149', border: '1px solid rgba(248, 81, 73, 0.3)' }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          
          {/* Section 1: Verifications */}
          <div>
            <h3 style={{ color: 'var(--text-highlight)', fontSize: '1.2rem', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🛡️</span> Pending Verifications
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {userRole !== 'Employee' && (
                <div className="stat-card glass-panel interactive-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ color: 'var(--text-highlight)', margin: 0, fontSize: '1.05rem', fontWeight: '700' }}>Vendor Approvals</h4>
                    <span style={{ fontSize: '1.5rem' }}>🏢</span>
                  </div>
                  <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', margin: 0 }}>
                    Pending Action: <span style={{ fontWeight: '800', color: 'var(--primary-color)', fontSize: '1.4rem' }}>{stats.pending_vendors}</span>
                  </p>
                  <Link to="/admin/vendors" className="btn" style={{ background: '#238636', width: '100%', textAlign: 'center', boxSizing: 'border-box', marginTop: 'auto', padding: '0.6rem' }}>Verify Vendors</Link>
                </div>
              )}

              <div className="stat-card glass-panel interactive-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ color: 'var(--text-highlight)', margin: 0, fontSize: '1.05rem', fontWeight: '700' }}>Customer Approvals</h4>
                  <span style={{ fontSize: '1.5rem' }}>👤</span>
                </div>
                <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Pending Action: <span style={{ fontWeight: '800', color: 'var(--primary-color)', fontSize: '1.4rem' }}>{stats.pending_customers}</span>
                </p>
                <Link to="/admin/customers" className="btn" style={{ background: '#1a7f37', width: '100%', textAlign: 'center', boxSizing: 'border-box', marginTop: 'auto', padding: '0.6rem' }}>Verify Customers</Link>
              </div>
            </div>
          </div>

          {/* Section 2: Platform metrics */}
          <div>
            <h3 style={{ color: 'var(--text-highlight)', fontSize: '1.2rem', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>📊</span> Financial & Volume Overview
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {userRole === 'Super Admin' && (
                <div className="stat-card glass-panel interactive-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ color: 'var(--text-highlight)', margin: 0, fontSize: '1.05rem', fontWeight: '700' }}>Total Revenue (COD)</h4>
                    <span style={{ fontSize: '1.5rem' }}>💰</span>
                  </div>
                  <p style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0, color: '#3fb950' }}>₹{parseFloat(stats.total_revenue || 0).toLocaleString('en-IN')}</p>
                  <Link to="/admin/payments" className="btn" style={{ background: '#d26d0e', width: '100%', textAlign: 'center', boxSizing: 'border-box', marginTop: 'auto', padding: '0.6rem' }}>Detailed Payments</Link>
                </div>
              )}

              {userRole !== 'Employee' && (
                <div className="stat-card glass-panel interactive-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ color: 'var(--text-highlight)', margin: 0, fontSize: '1.05rem', fontWeight: '700' }}>Pending Settlements</h4>
                    <span style={{ fontSize: '1.5rem' }}>💳</span>
                  </div>
                  <p style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0, color: stats.pending_settlement > 0 ? '#f59e0b' : 'var(--text-secondary)' }}>₹{parseFloat(stats.pending_settlement || 0).toLocaleString('en-IN')}</p>
                  <Link to="/admin/commissions" className="btn" style={{ background: '#c1396a', width: '100%', textAlign: 'center', boxSizing: 'border-box', marginTop: 'auto', padding: '0.6rem' }}>Check Commissions</Link>
                </div>
              )}

              <div className="stat-card glass-panel interactive-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ color: 'var(--text-highlight)', margin: 0, fontSize: '1.05rem', fontWeight: '700' }}>Total Orders Placed</h4>
                  <span style={{ fontSize: '1.5rem' }}>📦</span>
                </div>
                <p style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0, color: 'var(--primary-color)' }}>{stats.total_orders}</p>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 'auto', borderTop: '1px solid var(--surface-border)', paddingTop: '0.5rem' }}>
                  Cumulative count of platform checkouts.
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Messages & Operations */}
          <div>
            <h3 style={{ color: 'var(--text-highlight)', fontSize: '1.2rem', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>⚙️</span> Operations & Messages
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              <div className="glass-panel interactive-card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h4 style={{ color: 'var(--text-highlight)', margin: '0 0 0.3rem 0', fontSize: '1.1rem', fontWeight: '700' }}>📬 Inquiries & Messages</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>Check contacts and support requests from guests or users.</p>
                </div>
                <Link to="/admin/contact-messages" className="btn" style={{ background: '#3498db', padding: '0.6rem 1.5rem' }}>View Inbox</Link>
              </div>

              {/* Maintenance Tasks (Super Admin Only) */}
              {userRole === 'Super Admin' && (
                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '16px' }}>
                  <div style={{ flex: 1, minWidth: '300px' }}>
                    <h3 style={{ color: '#ef4444', margin: '0 0 5px 0', fontSize: '1.1rem', fontWeight: '700' }}>🛠️ Weekly Commission Settlements</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>Trigger weekly PDF commission invoices for cash-on-delivery orders.</p>
                  </div>
                  <div>
                    <button
                      className="btn"
                      style={{ background: '#238636', fontSize: '0.9rem', padding: '0.6rem 1.5rem' }}
                      onClick={async () => {
                        if (!window.confirm("Generate Weekly Invoices for COD commissions?")) return;
                        const res = await fetch(`${API}/api/admin/generate_weekly_invoices`, { method: 'POST', credentials: 'include' });
                        const data = await res.json();
                        alert(data.message);
                      }}
                    >
                      Generate Invoices
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </main>

    </div>
  );
}

export default AdminDashboard;
