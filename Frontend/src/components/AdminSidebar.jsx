import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

function AdminSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const userRole = localStorage.getItem('user_role');
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <aside className="dashboard-sidebar glass-panel">
      <div className="sidebar-header" onClick={() => setIsOpen(!isOpen)}>
        <h3 style={{ color: 'var(--text-highlight)', borderBottom: '1px solid var(--surface-border)', paddingBottom: '0.5rem', margin: 0 }}>Control Center</h3>
        <span className="mobile-arrow">{isOpen ? '▲' : '▼'}</span>
      </div>
      <ul className={`sidebar-links ${isOpen ? 'show' : ''}`} style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
        <li>
          <Link to="/admin/dashboard" className={`nav-item ${isActive('/admin/dashboard')}`} style={{ display: 'block', padding: '0.6rem 1rem', textDecoration: 'none', transition: 'all 0.2s' }}>
            📊 Dashboard
          </Link>
        </li>
        
        {userRole === 'Super Admin' && (
          <li>
            <Link to="/admin/staff" className={`nav-item ${isActive('/admin/staff')}`} style={{ display: 'block', padding: '0.6rem 1rem', textDecoration: 'none', transition: 'all 0.2s' }}>
              👥 Staff Management
            </Link>
          </li>
        )}
        
        {userRole !== 'Employee' && (
          <li>
            <Link to="/admin/vendors" className={`nav-item ${isActive('/admin/vendors')}`} style={{ display: 'block', padding: '0.6rem 1rem', textDecoration: 'none', transition: 'all 0.2s' }}>
              🏭 Vendor Verify
            </Link>
          </li>
        )}
        
        <li>
          <Link to="/admin/customers" className={`nav-item ${isActive('/admin/customers')}`} style={{ display: 'block', padding: '0.6rem 1rem', textDecoration: 'none', transition: 'all 0.2s' }}>
            🧑 Customer Verify
          </Link>
        </li>
        <li>
          <Link to="/admin/orders" className={`nav-item ${isActive('/admin/orders')}`} style={{ display: 'block', padding: '0.6rem 1rem', textDecoration: 'none', transition: 'all 0.2s' }}>
            📦 Orders Details
          </Link>
        </li>
        <li>
          <Link to="/admin/rfq" className={`nav-item ${isActive('/admin/rfq')}`} style={{ display: 'block', padding: '0.6rem 1rem', textDecoration: 'none', transition: 'all 0.2s' }}>
            🖥️ RFQ Monitor
          </Link>
        </li>
        
        {userRole === 'Super Admin' && (
          <li>
            <Link to="/admin/payments" className={`nav-item ${isActive('/admin/payments')}`} style={{ display: 'block', padding: '0.6rem 1rem', textDecoration: 'none', transition: 'all 0.2s' }}>
              💳 Payments
            </Link>
          </li>
        )}
        
        {userRole !== 'Employee' && (
          <li>
            <Link to="/admin/commissions" className={`nav-item ${isActive('/admin/commissions')}`} style={{ display: 'block', padding: '0.6rem 1rem', textDecoration: 'none', transition: 'all 0.2s' }}>
              💰 Commissions
            </Link>
          </li>
        )}

        {userRole !== 'Employee' && (
          <li>
            <Link to="/admin/analytics" className={`nav-item ${isActive('/admin/analytics')}`} style={{ display: 'block', padding: '0.6rem 1rem', textDecoration: 'none', transition: 'all 0.2s' }}>
              📈 Platform Analytics
            </Link>
          </li>
        )}

        {(userRole === 'Super Admin' || userRole === 'Employee') && (
          <li>
            <Link to="/admin/bulk-pricing" className={`nav-item ${isActive('/admin/bulk-pricing')}`} style={{ display: 'block', padding: '0.6rem 1rem', textDecoration: 'none', transition: 'all 0.2s' }}>
              ⚡ Bulk Pricing
            </Link>
          </li>
        )}
        
        <li>
          <Link to="/admin/profile" className={`nav-item ${isActive('/admin/profile')}`} style={{ display: 'block', padding: '0.6rem 1rem', textDecoration: 'none', transition: 'all 0.2s' }}>
            👤 My Account
          </Link>
        </li>
        <li>
          <Link to="/admin/contact-messages" className={`nav-item ${isActive('/admin/contact-messages')}`} style={{ display: 'block', padding: '0.6rem 1rem', textDecoration: 'none', transition: 'all 0.2s' }}>
            💬 Contact Messages
          </Link>
        </li>
        <li>
          <Link to="/admin/referrals" className={`nav-item ${isActive('/admin/referrals')}`} style={{ display: 'block', padding: '0.6rem 1rem', textDecoration: 'none', transition: 'all 0.2s' }}>
            🎯 Referral Monitor
          </Link>
        </li>
        
        {userRole === 'Super Admin' && (
          <li>
            <Link to="/admin/settings" className={`nav-item ${isActive('/admin/settings')}`} style={{ display: 'block', padding: '0.6rem 1rem', textDecoration: 'none', transition: 'all 0.2s' }}>
              ⚙️ Platform Settings
            </Link>
          </li>
        )}
      </ul>
    </aside>
  );
}

export default AdminSidebar;
