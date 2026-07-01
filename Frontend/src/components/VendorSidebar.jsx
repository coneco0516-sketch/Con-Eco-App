import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

function VendorSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <aside className="dashboard-sidebar glass-panel">
      <div className="sidebar-header" onClick={() => setIsOpen(!isOpen)}>
        <h3 style={{ color: 'var(--text-highlight)', borderBottom: '1px solid var(--surface-border)', paddingBottom: '0.5rem', margin: 0 }}>Vendor Console</h3>
        <span className="mobile-arrow">{isOpen ? '▲' : '▼'}</span>
      </div>
      <ul className={`sidebar-links ${isOpen ? 'show' : ''}`} style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
        <li>
          <Link to="/vendor" className={`nav-item ${isActive('/vendor')}`} style={{ display: 'block', padding: '0.6rem 1rem', textDecoration: 'none', transition: 'all 0.2s' }}>
            📊 Dashboard
          </Link>
        </li>
        <li>
          <Link to="/vendor/catalogue" className={`nav-item ${isActive('/vendor/catalogue')}`} style={{ display: 'block', padding: '0.6rem 1rem', textDecoration: 'none', transition: 'all 0.2s' }}>
            📋 My Catalogue
          </Link>
        </li>
        <li>
          <Link to="/vendor/rfq" className={`nav-item ${isActive('/vendor/rfq')}`} style={{ display: 'block', padding: '0.6rem 1rem', textDecoration: 'none', transition: 'all 0.2s' }}>
            🔔 RFQ Board
          </Link>
        </li>
        <li>
          <Link to="/vendor/orders" className={`nav-item ${isActive('/vendor/orders')}`} style={{ display: 'block', padding: '0.6rem 1rem', textDecoration: 'none', transition: 'all 0.2s' }}>
            📥 Incoming Orders
          </Link>
        </li>
        <li>
          <Link to="/vendor/earnings" className={`nav-item ${isActive('/vendor/earnings')}`} style={{ display: 'block', padding: '0.6rem 1rem', textDecoration: 'none', transition: 'all 0.2s' }}>
            💰 Earnings
          </Link>
        </li>
        <li>
          <Link to="/vendor/billing" className={`nav-item ${isActive('/vendor/billing')}`} style={{ display: 'block', padding: '0.6rem 1rem', textDecoration: 'none', transition: 'all 0.2s' }}>
            🧾 Commission Bills
          </Link>
        </li>
        <li>
          <Link to="/vendor/analytics" className={`nav-item ${isActive('/vendor/analytics')}`} style={{ display: 'block', padding: '0.6rem 1rem', textDecoration: 'none', transition: 'all 0.2s' }}>
            📈 Analytics
          </Link>
        </li>
        <li>
          <Link to="/vendor/profile" className={`nav-item ${isActive('/vendor/profile')}`} style={{ display: 'block', padding: '0.6rem 1rem', textDecoration: 'none', transition: 'all 0.2s' }}>
            👤 My Profile
          </Link>
        </li>
        <li>
          <Link to="/vendor/referral" className={`nav-item ${isActive('/vendor/referral')}`} style={{ display: 'block', padding: '0.6rem 1rem', textDecoration: 'none', transition: 'all 0.2s', background: isActive('/vendor/referral') ? '' : 'linear-gradient(90deg, rgba(46,160,67,0.05), transparent)' }}>
            🎯 Referral Program
          </Link>
        </li>
      </ul>
    </aside>
  );
}

export default VendorSidebar;
