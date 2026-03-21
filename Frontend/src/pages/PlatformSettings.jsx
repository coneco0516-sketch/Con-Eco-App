import React from 'react';
import AdminSidebar from '../components/AdminSidebar';

function PlatformSettings() {
  return (
    <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
      <AdminSidebar />
      <main style={{ flex: 1 }}>
        <h2 style={{ fontSize: '2rem', color: 'white', marginTop: 0 }}>Platform Settings</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Configure marketplace preferences and fees.</p>
        <hr style={{ borderColor: 'var(--surface-border)', marginBottom: '1.5rem' }} />
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3>Global Settings</h3>
          <p>Settings panel coming soon.</p>
        </div>
      </main>
    </div>
  );
}

export default PlatformSettings;
