import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';

const API = process.env.REACT_APP_API_URL || '';

function AdminDashboard() {
  const [stats, setStats] = useState({
    pending_vendors: '...',
    pending_customers: '...',
    total_orders: '...',
    total_revenue: '...'
  });
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('is_logged_in');
    const role = localStorage.getItem('user_role');

    if (!isLoggedIn || role !== 'Admin') {
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
    <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>

      {/* LEFT PANEL: Sidebar */}
      <AdminSidebar />

      {/* RIGHT CONTENT: Dashboard Cards */}
      <main style={{ flex: 1 }}>
        <h2 style={{ fontSize: '2rem', color: 'var(--text-highlight)', marginTop: 0 }}>Admin Dashboard</h2>
        <hr style={{ borderColor: 'var(--surface-border)', marginBottom: '1.5rem' }} />

        {error && <p style={{ color: 'var(--danger-color)' }}>{error}</p>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Row 1 */}
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <div className="stat-card glass-panel" style={{ flex: 1 }}>
              <h3 style={{ color: 'var(--text-highlight)', marginBottom: '10px' }}>Vendor Verification</h3>
              <p style={{ fontSize: '1.2rem', marginBottom: '15px' }}>Pending: <span style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>{stats.pending_vendors}</span></p>
              <Link to="/admin/vendors" className="btn" style={{ background: '#238636' }}>Verify Vendor</Link>
            </div>

            <div className="stat-card glass-panel" style={{ flex: 1 }}>
              <h3 style={{ color: 'var(--text-highlight)', marginBottom: '10px' }}>Customer Verification</h3>
              <p style={{ fontSize: '1.2rem', marginBottom: '15px' }}>Pending: <span style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>{stats.pending_customers}</span></p>
              <Link to="/admin/customers" className="btn" style={{ background: '#1a7f37' }}>Verify Customers</Link>
            </div>
          </div>

          {/* Row 2 */}
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <div className="stat-card glass-panel" style={{ flex: 1 }}>
              <h4 style={{ color: 'var(--text-highlight)', marginBottom: '10px' }}>Total Sales (Offline)</h4>
              <p style={{ fontSize: '1.4rem', fontWeight: 'bold', margin: '0 0 10px 0', color: '#3fb950' }}>₹{stats.total_revenue}</p>
              <Link to="/admin/payments" className="btn" style={{ background: '#d26d0e' }}>Detailed Payments</Link>
            </div>

            <div className="stat-card glass-panel" style={{ flex: 1 }}>
              <h4 style={{ color: 'var(--text-highlight)', marginBottom: '10px' }}>Pending Commissions Settlement</h4>
              <p style={{ fontSize: '1.4rem', fontWeight: 'bold', margin: '0 0 10px 0', color: stats.pending_settlement > 0 ? '#f59e0b' : 'var(--text-secondary)' }}>₹{stats.pending_settlement || 0}</p>
              <Link to="/admin/commissions" className="btn" style={{ background: '#c1396a' }}>Check Commissions</Link>
            </div>

            <div className="stat-card glass-panel" style={{ flex: 1 }}>
              <h3 style={{ color: 'var(--text-highlight)', marginBottom: '10px' }}>Messages</h3>
              <p style={{ fontSize: '1.1rem', marginBottom: '15px' }}>Check contact inquiries.</p>
              <Link to="/admin/contact-messages" className="btn" style={{ background: '#3498db' }}>View Inbox</Link>
            </div>
          </div>
          {/* Row 3 - Maintenance */}
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <div style={{ flex: 1, minWidth: '300px' }}>
              <h3 style={{ color: '#ef4444', margin: '0 0 5px 0', fontSize: '1.1rem' }}>⚙️ System Maintenance</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>Manually trigger background tasks for billing and invoicing.</p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>

              <button
                className="btn"
                style={{ background: '#238636', fontSize: '0.85rem' }}
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
        </div>
      </main>

    </div>
  );
}

export default AdminDashboard;
