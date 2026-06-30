import React, { useState, useEffect } from 'react';
import AdminSidebar from '../components/AdminSidebar';

const API = import.meta.env.VITE_API_URL || 'https://api.coneco.store';

function AdminAnalytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API}/api/admin/dashboard_stats`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setStats(data.stats);
        } else {
          setError(data.message || "Failed to load admin stats");
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError("Network error loading dashboard statistics.");
        setLoading(false);
      });
  }, []);

  return (
    <div className="dashboard-layout">
      <AdminSidebar />
      <main style={{ flex: 1, padding: '2rem' }}>
        <h2 style={{ fontSize: '2rem', color: 'var(--text-highlight)', marginTop: 0 }}>📈 Platform Analytics</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>View global transactions, pending registration items, and platform-wide metrics.</p>
        <hr style={{ borderColor: 'var(--surface-border)', marginBottom: '2rem' }} />

        {error && (
          <p style={{ color: 'var(--danger-color)', marginBottom: '1.5rem' }}>{error}</p>
        )}

        {loading ? (
          <div className="glass-panel skeleton-pulse" style={{ height: '300px', borderRadius: '12px' }}></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* KPI Overview Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
              
              {/* Financial Metrics */}
              <div className="glass-panel" style={{ padding: '2rem' }}>
                <h3 style={{ color: 'var(--text-highlight)', margin: '0 0 1.5rem 0', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  💳 Financial Performance
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', justifySet: 'space-between', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                      <span>Total Offline Sales</span>
                      <span style={{ fontWeight: 'bold', color: '#3fb950' }}>₹{stats?.total_revenue || 0}</span>
                    </div>
                    <div style={{ height: '8px', background: 'var(--surface-border)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: '75%', background: '#3fb950' }}></div>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                      <span>Pending Commissions</span>
                      <span style={{ fontWeight: 'bold', color: '#ffd700' }}>₹{stats?.pending_settlement || 0}</span>
                    </div>
                    <div style={{ height: '8px', background: 'var(--surface-border)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: '25%', background: '#ffd700' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Registration Funnel */}
              <div className="glass-panel" style={{ padding: '2rem' }}>
                <h3 style={{ color: 'var(--text-highlight)', margin: '0 0 1.5rem 0', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  👥 Verification Backlog
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                      <span>Pending Vendors QC</span>
                      <span style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>{stats?.pending_vendors || 0}</span>
                    </div>
                    <div style={{ height: '8px', background: 'var(--surface-border)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(100, (parseInt(stats?.pending_vendors) || 0) * 10)}%`, background: 'var(--primary-color)' }}></div>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                      <span>Pending Customers</span>
                      <span style={{ fontWeight: 'bold', color: '#3870e0' }}>{stats?.pending_customers || 0}</span>
                    </div>
                    <div style={{ height: '8px', background: 'var(--surface-border)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(100, (parseInt(stats?.pending_customers) || 0) * 10)}%`, background: '#3870e0' }}></div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Platform Health Overview */}
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <h3 style={{ color: 'var(--text-highlight)', margin: '0 0 1rem 0' }}>⚙️ Platform Insights</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
                Platform conversion statistics indicate active demand for bulk sand and aggregate materials. Weekly invoice automated runs must be executed regularly to maintain healthy vendor settlement flows.
              </p>
            </div>
            
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminAnalytics;
