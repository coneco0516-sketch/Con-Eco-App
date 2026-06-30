import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'https://api.coneco.store';

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
      const resp = await fetch(`${API}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      if (!resp.ok) {
        const errorText = await resp.text();
        console.error('Server error:', errorText);
        setError(`Server error (${resp.status}). Please ensure backend is running.`);
        setLoading(false);
        return;
      }

      const data = await resp.json();
      
      if (data.status === 'success') {
        setMessage(data.message || 'If the account exists, a reset link has been sent.');
      } else {
        setError(data.message || 'Error processing request. Please check the email.');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Connection error! Please ensure the backend is running on port 8000.');
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '75vh', padding: '1rem' }}>
      <div className="auth-container glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '2.5rem', textAlign: 'left' }}>
        <h2 className="auth-title" style={{ margin: '0 0 0.5rem 0', fontWeight: '800', textAlign: 'center' }}>Forgot Password</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.8rem', fontSize: '0.95rem', textAlign: 'center' }}>Enter your email address to receive a password reset link.</p>
        
        {message && (
          <div style={{ padding: '0.8rem 1rem', marginBottom: '1.5rem', borderRadius: '8px', background: 'rgba(46,160,67,0.12)', color: '#3fb950', border: '1px solid rgba(46,160,67,0.25)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span>✨</span>
            <span>{message}</span>
          </div>
        )}
        
        {error && (
          <div style={{ padding: '0.8rem 1rem', marginBottom: '1.5rem', borderRadius: '8px', background: 'rgba(248,81,73,0.12)', color: '#f85149', border: '1px solid rgba(248,81,73,0.25)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div>
            <label className="input-label" style={{ fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>Email Address</label>
            <input 
              type="email" 
              className="input-field" 
              placeholder="Enter your email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--surface-border)', color: 'var(--text-highlight)', boxSizing: 'border-box' }}
            />
          </div>
          
          <button 
            type="submit" 
            className="btn" 
            style={{ fontSize: '1.05rem', padding: '0.8rem', opacity: loading ? 0.7 : 1, fontWeight: '700', borderRadius: '8px', cursor: 'pointer', width: '100%' }}
            disabled={loading}
          >
            {loading ? 'Sending link...' : 'Send Reset Link'}
          </button>
        </form>
        
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <Link to="/login" style={{ color: 'var(--primary-color)', fontSize: '0.9rem', textDecoration: 'none', fontWeight: '600' }}>← Back to Login</Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
