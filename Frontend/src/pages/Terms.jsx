import React from 'react';

function Terms() {
  return (
    <div style={{ maxWidth: '800px', margin: '3rem auto', padding: '0 1rem' }}>
      <h2 style={{ fontSize: '2.5rem', color: 'white', marginBottom: '1rem', textAlign: 'center' }}>Terms of Service</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '3rem', textAlign: 'center', fontSize: '1.2rem' }}>Please read our terms carefully before using ConEco.</p>
      
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h3 style={{ color: 'white', marginBottom: '1rem' }}>Acceptance of Terms</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
          By accessing or using the ConEco platform, you confirm your acceptance of these Terms of Service. If you disagree with any part of these terms, you may not access the service.
        </p>
        
        <h3 style={{ color: 'white', marginBottom: '1rem' }}>Vendor Responsibilities</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
          Vendors must provide completely accurate and legal descriptions of the materials and services they are listing. Any deliberate misinformation entails immediate account verification revocation.
        </p>
        
        <h3 style={{ color: 'white', marginBottom: '1rem' }}>Limitation of Liability</h3>
        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          ConEco functions strictly as an intermediary facilitator platform and disclaims liability for any discrepancy regarding service quality or disputes between vendors and customers. We do however moderate conflicts appropriately.
        </p>
      </div>
    </div>
  );
}

export default Terms;
