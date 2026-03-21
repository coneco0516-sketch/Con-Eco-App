import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import CustomerSidebar from '../components/CustomerSidebar';

function CustomerDashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('is_logged_in');
    const role = localStorage.getItem('user_role');
    
    if (!isLoggedIn || role !== 'Customer') {
      navigate('/login');
    }
  }, [navigate]);

  return (
    <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
      
      {/* LEFT PANEL: Sidebar */}
      <CustomerSidebar />

      {/* RIGHT CONTENT: Dashboard Cards */}
      <main style={{ flex: 1 }}>
        <h2 style={{ fontSize: '2rem', color: 'white', marginTop: 0 }}>Customer Dashboard</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Welcome! This is your dashboard where you can manage orders, services, and your profile.</p>
        <hr style={{ borderColor: 'var(--surface-border)', marginBottom: '1.5rem' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Row 1 */}
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <div className="stat-card glass-panel" style={{ flex: 1 }}>
              <h3 style={{ color: 'white', marginBottom: '10px' }}>Top Products</h3>
              <p style={{ fontSize: '1.1rem', marginBottom: '15px' }}>Explore the top construction materials.</p>
              <Link to="/customer/products" className="btn" style={{ background: '#238636' }}>View Products</Link>
            </div>

            <div className="stat-card glass-panel" style={{ flex: 1 }}>
              <h3 style={{ color: 'white', marginBottom: '10px' }}>Top Services</h3>
              <p style={{ fontSize: '1.1rem', marginBottom: '15px' }}>Need help? Check out our services.</p>
              <Link to="/customer/services" className="btn" style={{ background: '#1a7f37' }}>View Services</Link>
            </div>
          </div>

          {/* Row 2 */}
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <div className="stat-card glass-panel" style={{ flex: 1 }}>
              <h4 style={{ color: 'white', marginBottom: '10px' }}>My Orders</h4>
              <p style={{ fontSize: '1rem', marginBottom: '15px' }}>Track your requested materials.</p>
              <Link to="/customer/orders" className="btn" style={{ background: '#d26d0e' }}>View Orders</Link>
            </div>

            <div className="stat-card glass-panel" style={{ flex: 1 }}>
              <h4 style={{ color: 'white', marginBottom: '10px' }}>Booked Services</h4>
              <p style={{ fontSize: '1rem', marginBottom: '15px' }}>Manage ongoing service requests.</p>
              <Link to="/customer/booked-services" className="btn" style={{ background: '#d4a20b' }}>View Services</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default CustomerDashboard;
