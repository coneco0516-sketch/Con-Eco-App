import React from 'react';

function FAQ() {
  return (
    <div style={{ maxWidth: '800px', margin: '3rem auto', padding: '0 1rem' }}>
      <h2 style={{ fontSize: '2.5rem', color: 'var(--text-highlight)', marginBottom: '1rem', textAlign: 'center' }}>Frequently Asked Questions</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '3rem', textAlign: 'center', fontSize: '1.2rem' }}>Find answers to common questions about ConEco.</p>
      
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
        <h3 style={{ color: 'var(--text-highlight)', marginBottom: '0.5rem' }}>What is ConEco?</h3>
        <p style={{ color: 'var(--text-secondary)' }}>ConEco is a marketplace platform connecting customers with construction material vendors and service providers effortlessly.</p>
      </div>
      
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
        <h3 style={{ color: 'var(--text-highlight)', marginBottom: '0.5rem' }}>How do I become a vendor?</h3>
        <p style={{ color: 'var(--text-secondary)' }}>You can sign up as a Vendor on our registration page. Your profile will be verified by our administrative team before you can list products.</p>
      </div>
      
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
        <h3 style={{ color: 'var(--text-highlight)', marginBottom: '0.5rem' }}>Are the materials verified?</h3>
        <p style={{ color: 'var(--text-secondary)' }}>All registered vendors and service providers undergo a stringent manual verification process by our platform administrators.</p>
      </div>
    </div>
  );
}

export default FAQ;
