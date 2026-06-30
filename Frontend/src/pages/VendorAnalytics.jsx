import React, { useState, useEffect } from 'react';
import VendorSidebar from '../components/VendorSidebar';

const API = import.meta.env.VITE_API_URL || 'https://api.coneco.store';

function VendorAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/vendor/dashboard`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          // Use dashboard metrics to generate visual analytical reports
          setAnalytics(data.stats);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="dashboard-layout">
      <VendorSidebar />
      <main style={{ flex: 1, padding: '2rem' }}>
        <h2 style={{ fontSize: '2rem', color: 'var(--text-highlight)', marginTop: 0 }}>📈 Sales Analytics</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Visualize product performance, service order statistics, and earnings metrics.</p>
        <hr style={{ borderColor: 'var(--surface-border)', marginBottom: '2rem' }} />

        {loading ? (
          <div className="glass-panel skeleton-pulse" style={{ height: '300px', borderRadius: '12px' }}></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Visual Overview grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
              
              {/* Distribution Card */}
              <div className="glass-panel" style={{ padding: '2rem' }}>
                <h3 style={{ color: 'var(--text-highlight)', margin: '0 0 1.5rem 0', fontSize: '1.2rem' }}>📊 Revenue Distribution</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                      <span>Net Earnings Fulfillments</span>
                      <span style={{ fontWeight: 'bold', color: '#3fb950' }}>₹{analytics?.total_earnings || 0}</span>
                    </div>
                    <div style={{ height: '8px', background: 'var(--surface-border)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: '80%', background: '#3fb950' }}></div>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                      <span>Outstanding Platform Commission</span>
                      <span style={{ fontWeight: 'bold', color: '#f85149' }}>₹{analytics?.outstanding_commission || 0}</span>
                    </div>
                    <div style={{ height: '8px', background: 'var(--surface-border)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: '20%', background: '#f85149' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Status Breakdown */}
              <div className="glass-panel" style={{ padding: '2rem' }}>
                <h3 style={{ color: 'var(--text-highlight)', margin: '0 0 1.5rem 0', fontSize: '1.2rem' }}>📦 Order Status Ratios</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                      <span>Pending Orders Action Needed</span>
                      <span style={{ fontWeight: 'bold', color: '#ffd700' }}>{analytics?.pending_orders || 0}</span>
                    </div>
                    <div style={{ height: '8px', background: 'var(--surface-border)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(100, (analytics?.pending_orders || 0) * 10)}%`, background: '#ffd700' }}></div>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                      <span>Total Active Catalogue Items</span>
                      <span style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>{analytics?.catalogue_size || 0}</span>
                    </div>
                    <div style={{ height: '8px', background: 'var(--surface-border)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(100, (analytics?.catalogue_size || 0) * 5)}%`, background: 'var(--primary-color)' }}></div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Performance Insights */}
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <h3 style={{ color: 'var(--text-highlight)', margin: '0 0 1rem 0' }}>💡 Analytical Insights</h3>
              <ul style={{ paddingLeft: '1.2rem', color: 'var(--text-secondary)', lineHeight: '1.8', margin: 0 }}>
                <li>Platform verification status: <strong style={{ color: analytics?.verification_status === 'Verified' ? 'var(--primary-color)' : '#ffd700' }}>{analytics?.verification_status || 'Pending'}</strong>.</li>
                <li>Verify your item parameters weekly to improve search query conversion ratios on the B2B aggregate boards.</li>
                <li>Make sure to submit competitive bidding parameters on open Customer RFQs to capture active regional procurement bids.</li>
              </ul>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default VendorAnalytics;
