import React from 'react';

function Privacy() {
  return (
    <div style={{ maxWidth: '800px', margin: '3rem auto', padding: '0 1rem' }}>
      <h2 style={{ fontSize: '2.5rem', color: 'var(--text-highlight)', marginBottom: '1rem', textAlign: 'center' }}>Privacy Policy</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '3rem', textAlign: 'center', fontSize: '1.2rem' }}>Last updated: March 2026</p>
      
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h3 style={{ color: 'var(--text-highlight)', marginBottom: '1rem' }}>1. Information We Collect</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
          We collect information that you manually enter into the ConEco website during the registration process, including user profile details and any uploaded verification documents. Your IP address and browser type may also be logged for security purposes.
        </p>
        
        <h3 style={{ color: 'var(--text-highlight)', marginBottom: '1rem' }}>2. Use of Information</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
          Your data is solely used to construct a safe and reliable marketplace where customers and vendors can transact effectively. Contact details may be shared strictly between parties engaged in a confirmed booking.
        </p>
        
        <h3 style={{ color: 'var(--text-highlight)', marginBottom: '1rem' }}>3. Data Security</h3>
        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          ConEco implements stringent authentication and authorization mechanisms (e.g. HttpOnly cookies) to keep your sessions secure against external access vectors. Passwords are cryptographically hashed and never stored in plain text.
        </p>
      </div>
    </div>
  );
}

export default Privacy;
