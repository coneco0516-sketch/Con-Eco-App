import React from 'react';
import VendorSidebar from '../components/VendorSidebar';

function VendorAnalytics() {
  return (
    <div className="dashboard-layout">
      <VendorSidebar />
      <main style={{ flex: 1 }}>
        <h2 style={{ fontSize: '2rem', color: 'var(--text-highlight)', marginTop: 0 }}>Sales Analytics</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Visualize product performance and trends.</p>
        <hr style={{ borderColor: 'var(--surface-border)', marginBottom: '1.5rem' }} />
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
          <h3>Analytics charts coming soon.</h3>
        </div>
      </main>
    </div>
  );
}

export default VendorAnalytics;
