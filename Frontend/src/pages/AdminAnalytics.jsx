import React from 'react';
import AdminSidebar from '../components/AdminSidebar';

function AdminAnalytics() {
  return (
    <div className="dashboard-layout">
      <AdminSidebar />
      <main style={{ flex: 1, padding: '2rem' }}>
        <h2 style={{ fontSize: '2rem', color: 'var(--text-highlight)', marginTop: 0 }}>📈 Platform Analytics</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>View global transactions, pending registration items, and platform-wide metrics.</p>
        <hr style={{ borderColor: 'var(--surface-border)', marginBottom: '2rem' }} />
        
        <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center', borderRadius: '12px' }}>
          <span style={{ fontSize: '3.5rem', display: 'block', marginBottom: '1rem' }}>📊</span>
          <h3 style={{ color: 'var(--text-highlight)', fontSize: '1.5rem', marginBottom: '0.5rem' }}>Interactive Charts & Analytics</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto' }}>
            We are building advanced data visualizations to track platform revenue, vendor QC distributions, and seasonal order volumes. Check back soon!
          </p>
        </div>
      </main>
    </div>
  );
}

export default AdminAnalytics;
