import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

function CustomerSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <aside className="dashboard-sidebar glass-panel">
      <div className="sidebar-header" onClick={() => setIsOpen(!isOpen)}>
        <h3 style={{ color: 'var(--text-highlight)', borderBottom: '1px solid var(--surface-border)', paddingBottom: '0.5rem', margin: 0 }}>Customer Portal</h3>
        <span className="mobile-arrow">{isOpen ? '▲' : '▼'}</span>
      </div>
      <ul className={`sidebar-links ${isOpen ? 'show' : ''}`} style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
        <li>
          <Link to="/customer" className={`nav-item ${isActive('/customer')}`} style={{ display: 'block', padding: '0.6rem 1rem', textDecoration: 'none', transition: 'all 0.2s' }}>
            📊 Dashboard
          </Link>
        </li>
        <li>
          <Link to="/customer/products" className={`nav-item ${isActive('/customer/products')}`} style={{ display: 'block', padding: '0.6rem 1rem', textDecoration: 'none', transition: 'all 0.2s' }}>
            🧱 Products
          </Link>
        </li>
        <li>
          <Link to="/customer/services" className={`nav-item ${isActive('/customer/services')}`} style={{ display: 'block', padding: '0.6rem 1rem', textDecoration: 'none', transition: 'all 0.2s' }}>
            🛠️ Services
          </Link>
        </li>
        <li>
          <Link to="/customer/cart" className={`nav-item ${isActive('/customer/cart')}`} style={{ display: 'block', padding: '0.6rem 1rem', textDecoration: 'none', transition: 'all 0.2s' }}>
            🛒 Cart
          </Link>
        </li>
        <li>
          <Link to="/customer/orders" className={`nav-item ${isActive('/customer/orders')}`} style={{ display: 'block', padding: '0.6rem 1rem', textDecoration: 'none', transition: 'all 0.2s' }}>
            📦 My Orders
          </Link>
        </li>
        <li>
          <Link to="/customer/booked-services" className={`nav-item ${isActive('/customer/booked-services')}`} style={{ display: 'block', padding: '0.6rem 1rem', textDecoration: 'none', transition: 'all 0.2s' }}>
            📅 Booked Services
          </Link>
        </li>
        <li>
          <Link to="/customer/projects" className={`nav-item ${isActive('/customer/projects')}`} style={{ display: 'block', padding: '0.6rem 1rem', textDecoration: 'none', transition: 'all 0.2s' }}>
            🏗️ My Projects
          </Link>
        </li>
        <li>
          <Link to="/customer/rfq" className={`nav-item ${isActive('/customer/rfq')}`} style={{ display: 'block', padding: '0.6rem 1rem', textDecoration: 'none', transition: 'all 0.2s' }}>
            🔄 Reverse Auction
          </Link>
        </li>
        <li>
          <Link to="/customer/profile" className={`nav-item ${isActive('/customer/profile')}`} style={{ display: 'block', padding: '0.6rem 1rem', textDecoration: 'none', transition: 'all 0.2s' }}>
            👤 My Profile
          </Link>
        </li>
      </ul>
    </aside>
  );
}

export default CustomerSidebar;
