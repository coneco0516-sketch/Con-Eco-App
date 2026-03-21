import React from 'react';
import CustomerSidebar from '../components/CustomerSidebar';
import { Link } from 'react-router-dom';

function OrderSuccess() {
  return (
    <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
      <CustomerSidebar />
      <main style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', maxWidth: '600px', width: '100%' }}>
          <div style={{ fontSize: '4rem', color: 'var(--success-color)', marginBottom: '1rem' }}>✓</div>
          <h2 style={{ fontSize: '2.5rem', color: 'white', marginBottom: '1rem' }}>Order Successful!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', fontSize: '1.2rem', lineHeight: '1.6' }}>
            Thank you for your purchase. Your payment has been securely processed and your vendor is preparing the shipment.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link to="/customer/orders" className="btn" style={{ background: 'var(--primary-color)' }}>View Orders</Link>
            <Link to="/customer" className="btn" style={{ background: '#238636' }}>Back to Dashboard</Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default OrderSuccess;
