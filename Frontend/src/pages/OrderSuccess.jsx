import React from 'react';
import CustomerSidebar from '../components/CustomerSidebar';
import { Link } from 'react-router-dom';

function OrderSuccess() {
  return (
    <div className="dashboard-layout">
      <CustomerSidebar />
      <main style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
        <div className="glass-panel" style={{ padding: '3.5rem 2rem', textAlign: 'center', maxWidth: '600px', width: '100%', borderRadius: '20px', border: '1px solid rgba(46, 160, 67, 0.3)' }}>
          <div style={{ 
            fontSize: '5rem', 
            color: '#3fb950', 
            marginBottom: '1.5rem',
            animation: 'scaleIn 0.5s ease-out',
            textShadow: '0 0 20px rgba(46, 160, 67, 0.4)' 
          }}>
            🎉
          </div>
          <h2 style={{ fontSize: '2.5rem', color: 'var(--text-highlight)', marginBottom: '0.8rem', fontWeight: '800' }}>Order Placed Successfully!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', fontSize: '1.1rem', lineHeight: '1.6' }}>
            Thank you for purchasing with ConEco. Your order has been registered in our B2B procurement network and the vendor has been notified for QC preparation.
          </p>

          {/* Next Steps Visual Guide */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--surface-border)', borderRadius: '12px', padding: '1.5rem', marginBottom: '2.5rem', textAlign: 'left' }}>
            <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-highlight)', fontSize: '1rem' }}>📦 What happens next?</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', gap: '0.8rem' }}>
                <span style={{ color: 'var(--primary-color)' }}>✓</span>
                <div>
                  <strong style={{ color: 'var(--text-highlight)' }}>Vendor QC Preparation:</strong> The seller reviews aggregate specifications and schedules dispatch.
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.8rem' }}>
                <span style={{ color: 'var(--primary-color)' }}>✓</span>
                <div>
                  <strong style={{ color: 'var(--text-highlight)' }}>Delivery Tracking:</strong> You can check dispatch status and download the digital invoice under My Orders.
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/customer/orders" className="btn" style={{ background: 'var(--primary-color)', padding: '0.8rem 2rem' }}>
              View Orders
            </Link>
            <Link to="/customer" className="btn" style={{ background: 'transparent', border: '1px solid var(--surface-border)', color: 'var(--text-highlight)', padding: '0.8rem 2rem' }}>
              Back to Dashboard
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default OrderSuccess;
