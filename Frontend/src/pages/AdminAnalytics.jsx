import React from 'react';
import AdminSidebar from '../components/AdminSidebar';

function AdminAnalytics() {
  return (
    <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
      <AdminSidebar />
      <main style={{ flex: 1 }}>
        <h2 style={{ fontSize: '2rem', color: 'white', marginTop: 0 }}>Analytics</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>View detailed platform usage and trends.</p>
        <hr style={{ borderColor: 'var(--surface-border)', marginBottom: '1.5rem' }} />
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
          <h3>Analytics dashboard coming soon.</h3>
        </div>
      </main>
    </div>
  );
}

export default AdminAnalytics;
