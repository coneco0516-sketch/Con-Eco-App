import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const API = process.env.REACT_APP_API_URL || '';

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
        setMessage(data.message);
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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="auth-card glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem', textAlign: 'center' }}>
          <h2 style={{ color: 'var(--danger-color)' }}>Invalid Link</h2>
          <p style={{ color: 'var(--text-secondary)' }}>This password reset link is invalid or missing a token.</p>
          <button onClick={() => navigate('/login')} className="btn" style={{ marginTop: '1.5rem' }}>Back to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div className="auth-card glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem' }}>
        <h2 style={{ color: 'white', marginBottom: '1rem', textAlign: 'center' }}>Reset Password</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', textAlign: 'center' }}>Enter your new password below.</p>

        {message && <p style={{ color: 'var(--success-color)', marginBottom: '1.5rem', textAlign: 'center', background: 'rgba(46, 160, 67, 0.1)', padding: '0.8rem', borderRadius: '4px' }}>{message}</p>}
        {error && <p style={{ color: 'var(--danger-color)', marginBottom: '1.5rem', textAlign: 'center', background: 'rgba(248, 81, 73, 0.1)', padding: '0.8rem', borderRadius: '4px' }}>{error}</p>}

        <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>New Password</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="Minimum 6 characters" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Confirm Password</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="Confirm your new password" 
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
            />
          </div>
          <button 
            type="submit" 
            className="btn" 
            style={{ fontSize: '1.1rem', padding: '0.8rem', opacity: loading ? 0.7 : 1 }}
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ResetPassword;
