import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import VendorSidebar from '../components/VendorSidebar';

const API = import.meta.env.VITE_API_URL || 'https://api.coneco.store';

function VendorDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const companyName = localStorage.getItem('user_name') || 'Vendor';

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
      fetch(`${API}/api/vendor/dashboard`, { credentials: 'include' })
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
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <h3 style={{ color: '#ffd700', fontSize: '1.5rem', marginBottom: '1rem' }}>Test Version Active</h3>
            <p style={{
              color: 'var(--text-highlight)',
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

      <main style={{ flex: 1, padding: '2rem' }}>
        {/* Welcome Banner */}
        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '2.2rem', color: 'var(--text-highlight)', margin: 0 }}>Welcome, {companyName}! 🏭</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', marginBottom: 0 }}>Manage your B2B products, services, incoming orders, and commission settlements.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link to="/vendor/catalogue" className="btn" style={{ background: 'var(--primary-color)' }}>➕ Add Catalog Item</Link>
            <Link to="/vendor/rfq" className="btn" style={{ background: 'var(--surface-border)', color: 'var(--text-highlight)' }}>Browse RFQ Board</Link>
          </div>
        </div>

        {/* Verification Status Banner */}
        {stats && stats.verification_status !== 'Verified' && (
          <div style={{
            padding: '1.5rem',
            marginBottom: '2rem',
            background: stats.verification_status === 'Pending'
              ? 'rgba(212, 162, 11, 0.1)'
              : 'rgba(248, 81, 73, 0.1)',
            border: `1px solid ${stats.verification_status === 'Pending' ? '#d4a20b' : '#f85149'}`,
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <h3 style={{
                color: stats.verification_status === 'Pending' ? '#d4a20b' : '#f85149',
                margin: '0 0 0.5rem 0'
              }}>
                {stats.verification_status === 'Pending'
                  ? '⏳ Pending QC Verification'
                  : '✗ Verification Rejected'
                }
              </h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                {stats.verification_status === 'Pending'
                  ? 'Your business details are under review. Your items will be visible to buyers as soon as the admin verifies your profile.'
                  : 'Your verification failed QC standards. Please review your company profile details or upload valid documents.'
                }
              </p>
            </div>
            <Link to="/vendor/profile" className="btn" style={{
              background: 'rgba(56, 112, 224, 0.2)',
              border: '1px solid #3870e0',
              color: '#3870e0',
              fontSize: '0.85rem'
            }}>
              Update Profile Details →
            </Link>
          </div>
        )}

        {/* Main Performance stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Row 1: Catalog & Orders */}
          <div className="dashboard-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
            <div className="stat-card glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <span style={{ fontSize: '2.5rem' }}>📋</span>
              <h3>Catalogue Size</h3>
              <p className="stat-value">{loading ? '...' : (stats ? stats.catalogue_size : 0)}</p>
              <Link to="/vendor/catalogue" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '600', marginTop: '10px', display: 'inline-block' }}>Manage Products →</Link>
            </div>

            <div className="stat-card glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <span style={{ fontSize: '2.5rem' }}>📥</span>
              <h3>Pending Orders</h3>
              <p className="stat-value" style={{ color: stats && stats.pending_orders > 0 ? '#f85149' : 'var(--text-highlight)' }}>
                {loading ? '...' : (stats ? stats.pending_orders : 0)}
              </p>
              <Link to="/vendor/orders" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '600', marginTop: '10px', display: 'inline-block' }}>Process Orders →</Link>
            </div>

            <div className="stat-card glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <span style={{ fontSize: '2.5rem' }}>💰</span>
              <h3>Net Earnings</h3>
              <p className="stat-value" style={{ color: '#3fb950' }}>₹{loading ? '...' : (stats ? stats.total_earnings : '0')}</p>
              <Link to="/vendor/earnings" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '600', marginTop: '10px', display: 'inline-block' }}>Breakdown →</Link>
            </div>

            <div className="stat-card glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <span style={{ fontSize: '2.5rem' }}>🧾</span>
              <h3>Outstanding Commission</h3>
              <p className="stat-value" style={{ color: stats && stats.outstanding_commission > 0 ? '#f85149' : 'var(--primary-color)' }}>
                ₹{loading ? '...' : (stats ? stats.outstanding_commission : '0')}
              </p>
              <Link to="/vendor/billing" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '600', marginTop: '10px', display: 'inline-block' }}>Pay Invoice →</Link>
            </div>
          </div>

          {/* Row 2: Guide Card & Action Hub */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <h3 style={{ color: 'var(--text-highlight)', margin: '0 0 1.5rem 0' }}>💡 Pro tips for B2B procurement success</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                <div>
                  <strong style={{ color: 'var(--text-highlight)' }}>⚡ Respond quickly to RFQ requests:</strong>
                  <p style={{ margin: '4px 0 0 0' }}>Buyers posting to the Reverse Auction Board are looking for bulk orders and value quick replies. Submit bids early to stand out.</p>
                </div>
                <div>
                  <strong style={{ color: 'var(--text-highlight)' }}>📦 Keep your stock updated:</strong>
                  <p style={{ margin: '4px 0 0 0' }}>Ensure unit prices, brand names, and bulk sizes in your catalog are accurate to prevent cancellation rates.</p>
                </div>
                <div>
                  <strong style={{ color: 'var(--text-highlight)' }}>🧾 Pay commissions weekly:</strong>
                  <p style={{ margin: '4px 0 0 0' }}>Paying your outstanding invoices on time maintains your high search rank and catalog visibility on the buyer's feeds.</p>
                </div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '2rem' }}>
              <h3 style={{ color: 'var(--text-highlight)', margin: '0 0 1.5rem 0' }}>🛠️ Quick Actions</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Link to="/vendor/catalogue" style={{ padding: '1.5rem 1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--surface-border)', borderRadius: '8px', textDecoration: 'none', color: 'inherit', textAlign: 'center', transition: 'transform 0.2s' }} className="stat-card">
                  <span style={{ fontSize: '2rem' }}>🏗️</span>
                  <h4 style={{ margin: '10px 0 0 0', fontSize: '0.95rem', color: 'var(--text-highlight)' }}>Catalog</h4>
                </Link>
                <Link to="/vendor/rfq" style={{ padding: '1.5rem 1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--surface-border)', borderRadius: '8px', textDecoration: 'none', color: 'inherit', textAlign: 'center', transition: 'transform 0.2s' }} className="stat-card">
                  <span style={{ fontSize: '2rem' }}>🔄</span>
                  <h4 style={{ margin: '10px 0 0 0', fontSize: '0.95rem', color: 'var(--text-highlight)' }}>RFQ Bids</h4>
                </Link>
                <Link to="/vendor/orders" style={{ padding: '1.5rem 1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--surface-border)', borderRadius: '8px', textDecoration: 'none', color: 'inherit', textAlign: 'center', transition: 'transform 0.2s' }} className="stat-card">
                  <span style={{ fontSize: '2rem' }}>🚚</span>
                  <h4 style={{ margin: '10px 0 0 0', fontSize: '0.95rem', color: 'var(--text-highlight)' }}>Orders</h4>
                </Link>
                <Link to="/vendor/analytics" style={{ padding: '1.5rem 1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--surface-border)', borderRadius: '8px', textDecoration: 'none', color: 'inherit', textAlign: 'center', transition: 'transform 0.2s' }} className="stat-card">
                  <span style={{ fontSize: '2rem' }}>📈</span>
                  <h4 style={{ margin: '10px 0 0 0', fontSize: '0.95rem', color: 'var(--text-highlight)' }}>Analytics</h4>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default VendorDashboard;
