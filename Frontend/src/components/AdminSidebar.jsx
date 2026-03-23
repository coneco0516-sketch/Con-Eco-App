import React from 'react';
import { Link } from 'react-router-dom';

function AdminSidebar() {
  return (
    <aside className="glass-panel" style={{ width: '250px', padding: '1.5rem', height: 'fit-content' }}>
      <h3 style={{ color: 'white', borderBottom: '1px solid var(--surface-border)', paddingBottom: '0.5rem' }}>Platform Control Center</h3>
      <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
        <li><Link to="/admin/vendors" className="nav-item">Vendor Verification</Link></li>
        <li><Link to="/admin/customers" className="nav-item">Customer Verification</Link></li>
        <li><Link to="/admin/orders" className="nav-item">Orders Details</Link></li>
        <li><Link to="/admin/payments" className="nav-item">Payments</Link></li>
        <li><Link to="/admin/profile" className="nav-item">My Account</Link></li>
        <li><Link to="/admin/contact-messages" className="nav-item">Contact Messages</Link></li>
        <li><Link to="/admin/settings" className="nav-item">Platform Settings</Link></li>
      </ul>
    </aside>
  );
}

export default AdminSidebar;
