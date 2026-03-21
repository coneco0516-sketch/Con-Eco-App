import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import VendorSidebar from '../components/VendorSidebar';

function VendorDashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('is_logged_in');
    const role = localStorage.getItem('user_role');
    
    // Allow 'Vendor' or 'Provider' based on how you differentiate if needed
    if (!isLoggedIn || role !== 'Vendor') {
      navigate('/login');
    }
  }, [navigate]);

  return (
    <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
      <VendorSidebar />

      <main style={{ flex: 1 }}>
        <h2 style={{ fontSize: '2rem', color: 'white', marginTop: 0 }}>Vendor Dashboard</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Manage your materials, orders, and sales performance.</p>
        <hr style={{ borderColor: 'var(--surface-border)', marginBottom: '1.5rem' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Row 1 */}
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <div className="stat-card glass-panel" style={{ flex: 1 }}>
              <h3 style={{ color: 'white', marginBottom: '10px' }}>Catalogue Management</h3>
              <p style={{ fontSize: '1.1rem', marginBottom: '15px' }}>Add or edit your product listings and services.</p>
              <Link to="/vendor/catalogue" className="btn" style={{ background: '#238636' }}>Manage Catalogue</Link>
            </div>

            <div className="stat-card glass-panel" style={{ flex: 1 }}>
              <h3 style={{ color: 'white', marginBottom: '10px' }}>Incoming Orders</h3>
              <p style={{ fontSize: '1.1rem', marginBottom: '15px' }}>Check requested materials and services.</p>
              <Link to="/vendor/orders" className="btn" style={{ background: '#1a7f37' }}>View Orders</Link>
            </div>
          </div>

          {/* Row 2 */}
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <div className="stat-card glass-panel" style={{ flex: 1 }}>
              <h4 style={{ color: 'white', marginBottom: '10px' }}>Total Earnings</h4>
              <p style={{ fontSize: '1rem', marginBottom: '15px' }}>Track your revenue flow and payout statuses.</p>
              <Link to="/vendor/earnings" className="btn" style={{ background: '#d26d0e' }}>View Earnings</Link>
            </div>

            <div className="stat-card glass-panel" style={{ flex: 1 }}>
              <h4 style={{ color: 'white', marginBottom: '10px' }}>Sales Analytics</h4>
              <p style={{ fontSize: '1rem', marginBottom: '15px' }}>Analyze your sales data to maximize profits.</p>
              <Link to="/vendor/analytics" className="btn" style={{ background: '#c1396a' }}>View Analytics</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default VendorDashboard;
