import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'https://api.coneco.store';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const resp = await fetch(`${API}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: password })
      });
      const data = await resp.json();

      if (data.status === 'success') {
        setMessage(data.message || 'Password reset successfully!');
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setError(data.message || 'Error resetting password. The link may have expired.');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    }
    setLoading(false);
  };

  if (!token) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '75vh', padding: '1rem' }}>
        <div className="auth-container glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '2.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h2 style={{ color: '#f85149', margin: '0 0 0.5rem 0', fontWeight: '800' }}>Invalid Link</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.8rem', fontSize: '0.95rem' }}>This password reset link is invalid, expired, or missing a secure token.</p>
          <button onClick={() => navigate('/login')} className="btn" style={{ width: '100%', padding: '0.8rem', fontWeight: '700' }}>Back to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '75vh', padding: '1rem' }}>
      <div className="auth-container glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '2.5rem', textAlign: 'left' }}>
        <h2 className="auth-title" style={{ margin: '0 0 0.5rem 0', fontWeight: '800', textAlign: 'center' }}>Reset Password</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.8rem', fontSize: '0.95rem', textAlign: 'center' }}>Enter your new secure account password below.</p>

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
            <label className="input-label" style={{ fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>New Password</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="Minimum 6 characters" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--surface-border)', color: 'var(--text-highlight)', boxSizing: 'border-box' }}
            />
          </div>
          
          <div>
            <label className="input-label" style={{ fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>Confirm Password</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="Confirm your new password" 
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            {loading ? 'Resetting Password...' : 'Reset Password'}
          </button>
        </form>
        
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <Link to="/login" style={{ color: 'var(--primary-color)', fontSize: '0.9rem', textDecoration: 'none', fontWeight: '600' }}>← Back to Login</Link>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
