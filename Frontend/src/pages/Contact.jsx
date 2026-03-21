import React from 'react';

function Contact() {
  return (
    <div style={{ maxWidth: '800px', margin: '3rem auto', padding: '0 1rem', textAlign: 'center' }}>
      <h2 style={{ fontSize: '2.5rem', color: 'white', marginBottom: '1rem' }}>Contact Us</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1.2rem' }}>We're here to help. Reach out to the ConEco support team.</p>
      
      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'left' }}>
        <form style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Full Name</label>
            <input type="text" className="input-field" placeholder="John Doe" />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Email Address</label>
            <input type="email" className="input-field" placeholder="john@example.com" />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Message</label>
            <textarea className="input-field" rows="5" placeholder="How can we help you?"></textarea>
          </div>
          <button type="button" className="btn" style={{ fontSize: '1.1rem', padding: '0.8rem' }}>Send Message</button>
        </form>
      </div>
    </div>
  );
}

export default Contact;
