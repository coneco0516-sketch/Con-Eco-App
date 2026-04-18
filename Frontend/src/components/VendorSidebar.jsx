import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function VendorSidebar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <aside className="dashboard-sidebar glass-panel">
      <div className="sidebar-header" onClick={() => setIsOpen(!isOpen)}>
        <h3 style={{ color: 'var(--text-highlight)', borderBottom: '1px solid var(--surface-border)', paddingBottom: '0.5rem' }}>Vendor Console</h3>
        <span className="mobile-arrow">{isOpen ? '▲' : '▼'}</span>
      </div>
      <ul className={`sidebar-links ${isOpen ? 'show' : ''}`} style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
        <li><Link to="/vendor" className="nav-item">Dashboard</Link></li>
        <li><Link to="/vendor/catalogue" className="nav-item">My Catalogue</Link></li>
        <li><Link to="/vendor/orders" className="nav-item">Incoming Orders</Link></li>
        <li><Link to="/vendor/earnings" className="nav-item">Earnings</Link></li>
        <li><Link to="/vendor/billing" className="nav-item">Commission Bills</Link></li>
        <li><Link to="/vendor/analytics" className="nav-item">Analytics</Link></li>
        <li><Link to="/vendor/profile" className="nav-item">My Profile</Link></li>
      </ul>
    </aside>
  );
}

export default VendorSidebar;
