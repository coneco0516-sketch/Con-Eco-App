import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function CustomerSidebar() {


  return (
    <aside className="dashboard-sidebar glass-panel">
      <h3 style={{ color: 'var(--text-highlight)', borderBottom: '1px solid var(--surface-border)', paddingBottom: '0.5rem' }}>Customer Portal</h3>
      <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
        <li><Link to="/customer" className="nav-item">Dashboard</Link></li>
        <li><Link to="/customer/products" className="nav-item">Products</Link></li>
        <li><Link to="/customer/services" className="nav-item">Services</Link></li>
        <li><Link to="/customer/cart" className="nav-item">Cart</Link></li>
        <li><Link to="/customer/orders" className="nav-item">My Orders</Link></li>
        <li><Link to="/customer/booked-services" className="nav-item">My Booked Services</Link></li>
        <li><Link to="/customer/profile" className="nav-item">My Profile</Link></li>
      </ul>


    </aside>
  );
}

export default CustomerSidebar;
