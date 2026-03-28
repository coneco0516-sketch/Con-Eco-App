import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import VendorSidebar from '../components/VendorSidebar';

function VendorDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAnnouncement, setShowAnnouncement] = useState(false);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('is_logged_in');
    const role = localStorage.getItem('user_role');
    
    if (!isLoggedIn || role !== 'Vendor') {
      navigate('/login');
    } else {
      // Show announcement if not seen in this session
      if (!sessionStorage.getItem('vendor_announcement_seen')) {
        setShowAnnouncement(true);
      }

      // Fetch vendor stats including verification status
      fetch('/api/vendor/dashboard', { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          if (data.status === 'success') {
            setStats(data.stats);
          }
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [navigate]);

  const closeAnnouncement = () => {
    setShowAnnouncement(false);
    sessionStorage.setItem('vendor_announcement_seen', 'true');
  };

  return (
    <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem', position: 'relative' }}>

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
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <h3 style={{ color: '#ffd700', fontSize: '1.5rem', marginBottom: '1rem' }}>Test Version Active</h3>
            <p style={{
              color: 'white',
              fontSize: '1.05rem',
              lineHeight: '1.7',
              marginBottom: '2rem'
            }}>
              As this is a <strong>test version</strong> of the app, all orders placed by customers will currently use <strong>COD (Cash on Delivery)</strong> only. Please process COD orders normally and check your <strong>Commission Bills</strong> page weekly.
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

      <VendorSidebar />

      <main style={{ flex: 1 }}>
        <h2 style={{ fontSize: '2rem', color: 'white', marginTop: 0 }}>Vendor Dashboard</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Manage your materials, orders, and sales performance.</p>
        <hr style={{ borderColor: 'var(--surface-border)', marginBottom: '1.5rem' }} />

        {/* Verification Status Banner */}
        {stats && stats.verification_status !== 'Verified' && (
          <div style={{
            padding: '1.5rem',
            marginBottom: '1.5rem',
            background: stats.verification_status === 'Pending' 
              ? 'rgba(212, 162, 11, 0.2)'
              : 'rgba(248, 81, 73, 0.2)',
            border: `2px solid ${stats.verification_status === 'Pending' ? '#d4a20b' : '#f85149'}`,
            borderRadius: '8px'
          }}>
            <h3 style={{
              color: stats.verification_status === 'Pending' ? '#d4a20b' : '#f85149',
              margin: '0 0 0.5rem 0'
            }}>
              {stats.verification_status === 'Pending' 
                ? '⏳ Pending QC Verification'
                : '✗ Verification Rejected'
              }
            </h3>
            <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-secondary)' }}>
              {stats.verification_status === 'Pending'
                ? 'Your business is under review. Your products and services will be visible to customers once verified by our admin team. Please visit your profile for more details.'
                : 'Your business verification was rejected. Please contact admin support for further information.'
              }
            </p>
            <Link to="/vendor/profile" style={{
              display: 'inline-block',
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              background: 'rgba(9, 105, 218, 0.3)',
              border: '1px solid #0969da',
              color: '#58a6ff',
              textDecoration: 'none',
              borderRadius: '4px'
            }}>
              View Profile Details →
            </Link>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Row 1 */}
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <div className="stat-card glass-panel" style={{ flex: 1 }}>
              <h3 style={{ color: 'white', marginBottom: '10px' }}>Catalogue {stats && stats.catalogue_size !== undefined ? <span style={{color: 'var(--primary-color)'}}>({stats.catalogue_size})</span> : ''}</h3>
              <p style={{ fontSize: '1.1rem', marginBottom: '15px' }}>Add or edit your product listings and services.</p>
              <Link to="/vendor/catalogue" className="btn" style={{ background: '#238636' }}>Manage Catalogue</Link>
            </div>

            <div className="stat-card glass-panel" style={{ flex: 1 }}>
              <h3 style={{ color: 'white', marginBottom: '10px' }}>Orders {stats && stats.pending_orders > 0 ? <span style={{color: '#f85149'}}>({stats.pending_orders} New)</span> : ''}</h3>
              <p style={{ fontSize: '1.1rem', marginBottom: '15px' }}>Check requested materials and services.</p>
              <Link to="/vendor/orders" className="btn" style={{ background: '#1a7f37' }}>View Orders</Link>
            </div>
          </div>

          {/* Row 2 */}
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <div className="stat-card glass-panel" style={{ flex: 1 }}>
              <h4 style={{ color: 'white', marginBottom: '10px' }}>Total Earnings</h4>
              <p style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: '0 0 10px 0', color: '#3fb950' }}>₹{stats ? stats.total_earnings : '...'}</p>
              <Link to="/vendor/earnings" className="btn" style={{ background: '#d26d0e' }}>View Detailed Breakdown</Link>
            </div>

            <div className="stat-card glass-panel" style={{ flex: 1 }}>
              <h4 style={{ color: 'white', marginBottom: '10px' }}>Commission Bills</h4>
              <p style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: '0 0 10px 0', color: stats && stats.outstanding_commission > 0 ? '#f85149' : 'var(--primary-color)' }}>
                ₹{stats ? stats.outstanding_commission : '0'}
              </p>
              <Link to="/vendor/verify-billing" className="btn" style={{ background: '#c1396a' }}>Pay Invoices</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default VendorDashboard;
