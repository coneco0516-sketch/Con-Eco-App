import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';

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

    fetch('/api/admin/dashboard_stats', { credentials: 'include' })
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
        <h2 style={{ fontSize: '2rem', color: 'white', marginTop: 0 }}>Admin Dashboard</h2>
        <hr style={{ borderColor: 'var(--surface-border)', marginBottom: '1.5rem' }} />

        {error && <p style={{ color: 'var(--danger-color)' }}>{error}</p>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Row 1 */}
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <div className="stat-card glass-panel" style={{ flex: 1 }}>
              <h3 style={{ color: 'white', marginBottom: '10px' }}>Vendor Verification</h3>
              <p style={{ fontSize: '1.2rem', marginBottom: '15px' }}>Pending: <span style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>{stats.pending_vendors}</span></p>
              <Link to="/admin/vendors" className="btn" style={{ background: '#238636' }}>Verify Vendor</Link>
            </div>

            <div className="stat-card glass-panel" style={{ flex: 1 }}>
              <h3 style={{ color: 'white', marginBottom: '10px' }}>Customer Verification</h3>
              <p style={{ fontSize: '1.2rem', marginBottom: '15px' }}>Pending: <span style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>{stats.pending_customers}</span></p>
              <Link to="/admin/customers" className="btn" style={{ background: '#1a7f37' }}>Verify Customers</Link>
            </div>
          </div>

          {/* Row 2 */}
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <div className="stat-card glass-panel" style={{ flex: 1 }}>
              <h4 style={{ color: 'white', marginBottom: '10px' }}>Orders Details</h4>
              <p style={{ fontSize: '1.1rem', marginBottom: '15px' }}>Total: <span style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>{stats.total_orders}</span></p>
              <Link to="/admin/orders" className="btn" style={{ background: '#d26d0e' }}>Manage Orders</Link>
            </div>

            <div className="stat-card glass-panel" style={{ flex: 1 }}>
              <h4 style={{ color: 'white', marginBottom: '10px' }}>Payments</h4>
              <p style={{ fontSize: '1.1rem', marginBottom: '15px' }}>₹ <span style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>{stats.total_revenue}</span></p>
              <Link to="/admin/payments" className="btn" style={{ background: '#d4a20b' }}>View Payments</Link>
            </div>

            <div className="stat-card glass-panel" style={{ flex: 1 }}>
              <h4 style={{ color: 'white', marginBottom: '10px' }}>Analytics</h4>
              <p style={{ height: '1.1rem', marginBottom: '15px' }}></p>
              <Link to="/admin/analytics" className="btn" style={{ background: '#c1396a' }}>View Analytics</Link>
            </div>
          </div>
        </div>
      </main>

    </div>
  );
}

export default AdminDashboard;
