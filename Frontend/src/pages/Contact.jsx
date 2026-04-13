import React, { useState } from 'react';

const API = process.env.REACT_APP_API_URL || '';

function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      setStatus({ type: 'error', message: 'Please fill in all fields.' });
      return;
    }

    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const response = await fetch(`${API}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus({ type: 'success', message: 'Your message has been sent successfully! We will get back to you soon.' });
        setFormData({ name: '', email: '', message: '' });
      } else {
        setStatus({ type: 'error', message: data.message || 'Failed to send message. Please try again later.' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'An error occurred. Please try again later.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '3rem auto', padding: '0 1rem', textAlign: 'center' }}>
      <h2 style={{ fontSize: '2.5rem', color: 'white', marginBottom: '1rem' }}>Contact Us</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1.2rem' }}>We're here to help. Reach out to the ConEco support team.</p>
      
      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'left' }}>
        {status.message && (
          <div style={{ 
            padding: '1rem', 
            borderRadius: '8px', 
            marginBottom: '1.5rem', 
            backgroundColor: status.type === 'success' ? 'rgba(46, 204, 113, 0.2)' : 'rgba(231, 76, 60, 0.2)',
            color: status.type === 'success' ? '#2ecc71' : '#e74c3c',
            border: `1px solid ${status.type === 'success' ? '#2ecc71' : '#e74c3c'}`
          }}>
            {status.message}
          </div>
        )}
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Full Name</label>
            <input 
              type="text" 
              name="name"
              className="input-field" 
              placeholder="John Doe" 
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Email Address</label>
            <input 
              type="email" 
              name="email"
              className="input-field" 
              placeholder="john@example.com" 
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Message</label>
            <textarea 
              name="message"
              className="input-field" 
              rows="5" 
              placeholder="How can we help you?"
              value={formData.message}
              onChange={handleChange}
              required
            ></textarea>
          </div>
          <button 
            type="submit" 
            className="btn" 
            style={{ fontSize: '1.1rem', padding: '0.8rem' }}
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Contact;
