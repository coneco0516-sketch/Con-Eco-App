import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function CustomerSidebar() {
  const [credit, setCredit] = useState(null);

  useEffect(() => {
    fetch('/api/payment/credit_score', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') setCredit(data);
      })
      .catch(() => {});
  }, []);

  return (
    <aside className="glass-panel" style={{ width: '250px', padding: '1.5rem', height: 'fit-content' }}>
      <h3 style={{ color: 'white', borderBottom: '1px solid var(--surface-border)', paddingBottom: '0.5rem' }}>Customer Portal</h3>
      <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
        <li><Link to="/customer" className="nav-item">Dashboard</Link></li>
        <li><Link to="/customer/products" className="nav-item">Products</Link></li>
        <li><Link to="/customer/services" className="nav-item">Services</Link></li>
        <li><Link to="/customer/cart" className="nav-item">Cart</Link></li>
        <li><Link to="/customer/orders" className="nav-item">My Orders</Link></li>
        <li><Link to="/customer/booked-services" className="nav-item">My Booked Services</Link></li>
        <li><Link to="/customer/profile" className="nav-item">My Profile</Link></li>
      </ul>

      {credit && (
        <div style={{ 
          marginTop: '2rem', 
          padding: '1.2rem', 
          borderRadius: '12px', 
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--surface-border)',
          textAlign: 'center'
        }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Credit Score</p>
          <div style={{ 
            fontSize: '1.8rem', 
            fontWeight: 'bold', 
            color: credit.credit_score >= 80 ? '#3fb950' : credit.credit_score >= 50 ? '#f1c40f' : '#e74c3c',
            textShadow: '0 0 10px rgba(0,0,0,0.5)'
          }}>
            {credit.credit_score}
          </div>
          
          <div style={{ 
            width: '100%', 
            height: '6px', 
            background: 'rgba(255,255,255,0.1)', 
            borderRadius: '3px', 
            marginTop: '12px',
            overflow: 'hidden'
          }}>
            <div style={{ 
              width: `${credit.credit_score}%`, 
              height: '100%', 
              background: credit.credit_score >= 80 ? 'linear-gradient(90deg, #238636, #3fb950)' : credit.credit_score >= 50 ? 'linear-gradient(90deg, #d29922, #f1c40f)' : 'linear-gradient(90deg, #da3633, #e74c3c)',
              transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
            }} />
          </div>

          {credit.blocked ? (
            <div style={{ color: '#e74c3c', fontSize: '0.75rem', marginTop: '10px', fontWeight: 'bold' }}>
              🚫 Pay Later Suspended
            </div>
          ) : (
            <div style={{ color: '#3fb950', fontSize: '0.75rem', marginTop: '10px' }}>
              ✓ Eligible for Credit
            </div>
          )}
        </div>
      )}
    </aside>
  );
}

export default CustomerSidebar;
