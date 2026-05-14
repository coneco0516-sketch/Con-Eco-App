import React from 'react';

function Privacy() {
  return (
    <div style={{ maxWidth: '800px', margin: '3rem auto', padding: '0 1rem' }}>
      <h2 style={{ fontSize: '2.5rem', color: 'var(--text-highlight)', marginBottom: '1rem', textAlign: 'center', fontWeight: '800' }}>Privacy Policy</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '3rem', textAlign: 'center', fontSize: '1.1rem', letterSpacing: '0.5px' }}>Last Updated: May 2026</p>
      
      <div className="glass-panel" style={{ padding: '3rem', border: '1px solid var(--surface-border)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
        <section style={{ marginBottom: '2.5rem' }}>
          <h3 style={{ color: 'var(--primary-color)', marginBottom: '1.2rem', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <span style={{ opacity: 0.5 }}>01.</span> Information We Collect
          </h3>
          <div style={{ color: 'var(--text-primary)', marginBottom: '1.5rem', lineHeight: '1.8', opacity: 0.9 }}>
            <p style={{ marginBottom: '1.2rem' }}>We collect minimal information necessary to provide our services, including:</p>
            <ul style={{ paddingLeft: '1.2rem', listStyleType: 'none' }}>
              <li style={{ marginBottom: '0.8rem', position: 'relative', paddingLeft: '1.5rem' }}>
                <span style={{ position: 'absolute', left: 0, color: 'var(--primary-color)' }}>•</span> <strong>For Users:</strong> Name, Phone Number, and Email when requesting a quote.
              </li>
              <li style={{ marginBottom: '0.8rem', position: 'relative', paddingLeft: '1.5rem' }}>
                <span style={{ position: 'absolute', left: 0, color: 'var(--primary-color)' }}>•</span> <strong>For Dealers:</strong> Business name, address, GST/Udyam details, and contact information.
              </li>
            </ul>
          </div>
        </section>
        
        <section style={{ marginBottom: '2.5rem' }}>
          <h3 style={{ color: 'var(--primary-color)', marginBottom: '1.2rem', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <span style={{ opacity: 0.5 }}>02.</span> Use of Information
          </h3>
          <div style={{ color: 'var(--text-primary)', marginBottom: '1.5rem', lineHeight: '1.8', opacity: 0.9 }}>
            <p style={{ marginBottom: '1.2rem' }}>Your data is used to:</p>
            <ul style={{ paddingLeft: '1.2rem', listStyleType: 'none' }}>
              <li style={{ marginBottom: '0.8rem', position: 'relative', paddingLeft: '1.5rem' }}>
                <span style={{ position: 'absolute', left: 0, color: 'var(--primary-color)' }}>•</span> Facilitate communication between buyers and dealers.
              </li>
              <li style={{ marginBottom: '0.8rem', position: 'relative', paddingLeft: '1.5rem' }}>
                <span style={{ position: 'absolute', left: 0, color: 'var(--primary-color)' }}>•</span> Send automated price updates or verification emails via professional services (e.g., Zoho, Brevo).
              </li>
              <li style={{ marginBottom: '0.8rem', position: 'relative', paddingLeft: '1.5rem' }}>
                <span style={{ position: 'absolute', left: 0, color: 'var(--primary-color)' }}>•</span> Improve platform performance and security.
              </li>
            </ul>
          </div>
        </section>
        
        <section style={{ marginBottom: '2.5rem' }}>
          <h3 style={{ color: 'var(--primary-color)', marginBottom: '1.2rem', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <span style={{ opacity: 0.5 }}>03.</span> Data Sharing
          </h3>
          <p style={{ color: 'var(--text-primary)', marginBottom: '1.5rem', lineHeight: '1.8', opacity: 0.9 }}>
            We do not sell your personal data to third parties. We share your contact details only with the specific dealer you have requested a quote from to enable the transaction.
          </p>
        </section>
        
        <section style={{ marginBottom: '2.5rem' }}>
          <h3 style={{ color: 'var(--primary-color)', marginBottom: '1.2rem', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <span style={{ opacity: 0.5 }}>04.</span> Cookies
          </h3>
          <p style={{ color: 'var(--text-primary)', marginBottom: '1.5rem', lineHeight: '1.8', opacity: 0.9 }}>
            Our Progressive Web App (PWA) may use cookies to remember your preferences and keep you logged in for a better user experience.
          </p>
        </section>
        
        <section>
          <h3 style={{ color: 'var(--primary-color)', marginBottom: '1.2rem', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <span style={{ opacity: 0.5 }}>05.</span> Your Rights
          </h3>
          <p style={{ color: 'var(--text-primary)', lineHeight: '1.8', opacity: 0.9 }}>
            You may request to view, edit, or delete your personal information at any time by contacting us at <a href="mailto:admin@coneco.store" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: '600' }}>admin@coneco.store</a>.
          </p>
        </section>
      </div>
    </div>
  );
}

export default Privacy;


