import React, { useState } from 'react';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const resp = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await resp.json();
      
      if (data.status === 'success') {
        setMessage(data.message || 'If the email is verified, you will receive a password reset link shortly.');
      } else {
        setError(data.message || 'Email not found or error occurred.');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div className="auth-card glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem' }}>
        <h2 style={{ color: 'white', marginBottom: '1rem', textAlign: 'center' }}>Forgot Password</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', textAlign: 'center' }}>Enter your email address to receive a password reset link.</p>
        
        {message && <p style={{ color: 'var(--success-color)', marginBottom: '1.5rem', textAlign: 'center', background: 'rgba(46, 160, 67, 0.1)', padding: '0.8rem', borderRadius: '4px' }}>{message}</p>}
        {error && <p style={{ color: 'var(--danger-color)', marginBottom: '1.5rem', textAlign: 'center', background: 'rgba(248, 81, 73, 0.1)', padding: '0.8rem', borderRadius: '4px' }}>{error}</p>}

        <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Email Address</label>
            <input 
              type="email" 
              className="input-field" 
              placeholder="Enter your email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
          <button 
            type="submit" 
            className="btn" 
            style={{ fontSize: '1.1rem', padding: '0.8rem', opacity: loading ? 0.7 : 1 }}
            disabled={loading}
          >
            {loading ? 'Sending link...' : 'Send Reset Link'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ForgotPassword;
