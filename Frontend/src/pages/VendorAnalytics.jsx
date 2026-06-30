import React from 'react';
import VendorSidebar from '../components/VendorSidebar';

function VendorAnalytics() {
  return (
    <div className="dashboard-layout">
      <VendorSidebar />
      <main style={{ flex: 1, padding: '2rem' }}>
        <h2 style={{ fontSize: '2rem', color: 'var(--text-highlight)', marginTop: 0 }}>📈 Sales Analytics</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Visualize product performance, service order statistics, and earnings metrics.</p>
        <hr style={{ borderColor: 'var(--surface-border)', marginBottom: '2rem' }} />
        
        <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center', borderRadius: '12px' }}>
          <span style={{ fontSize: '3.5rem', display: 'block', marginBottom: '1rem' }}>📊</span>
          <h3 style={{ color: 'var(--text-highlight)', fontSize: '1.5rem', marginBottom: '0.5rem' }}>Sales Charts & Analytics</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto' }}>
            We are building advanced performance insights to help you track catalog conversion rates, dispatch times, and seasonal demand. Check back soon!
          </p>
        </div>
      </main>
    </div>
  );
}

export default VendorAnalytics;
