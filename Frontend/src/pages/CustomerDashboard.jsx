import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import CustomerSidebar from '../components/CustomerSidebar';

function CustomerDashboard() {
  const navigate = useNavigate();
  const [credit, setCredit] = useState(null);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('is_logged_in');
    const role = localStorage.getItem('user_role');
    
    if (!isLoggedIn || role !== 'Customer') {
      navigate('/login');
    }

    // Fetch credit score
    fetch('/api/payment/credit_score', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') setCredit(data);
      })
      .catch(() => {});
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
          
          {/* Credit Overview Row */}
          {credit && (
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '2rem' }}>
              <div style={{ textAlign: 'center', minWidth: '120px' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '5px', textTransform: 'uppercase' }}>Credit Score</div>
                <div style={{ 
                  fontSize: '2.5rem', fontWeight: 'bold', 
                  color: credit.credit_score >= 80 ? '#3fb950' : credit.credit_score >= 50 ? '#f1c40f' : '#e74c3c' 
                }}>
                  {credit.credit_score}
                </div>
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: 'white', fontWeight: 'bold' }}>Account Standing</span>
                  <span style={{ color: credit.blocked ? '#e74c3c' : '#3fb950' }}>
                    {credit.blocked ? `Blocked until ${credit.blocked_until}` : 'Eligible for Pay Later'}
                  </span>
                </div>
                <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '5px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${credit.credit_score}%`, height: '100%', 
                    background: credit.credit_score >= 80 ? 'linear-gradient(90deg, #238636, #3fb950)' : credit.credit_score >= 50 ? 'linear-gradient(90deg, #d29922, #f1c40f)' : 'linear-gradient(90deg, #da3633, #e74c3c)',
                    transition: 'width 1s ease'
                  }} />
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '10px' }}>
                  Maintaining a high score allows you to request credit for materials and services. 
                  {credit.last_deduction > 0 && ` Last deduction: -${credit.last_deduction} points.`}
                </p>
              </div>
            </div>
          )}

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
