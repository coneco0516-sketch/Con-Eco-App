import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';

const API = import.meta.env.VITE_API_URL || 'https://api.coneco.store';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleTogglePassword = () => {
    setShowPassword(true);
    setTimeout(() => setShowPassword(false), 5000);
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch(`${API}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credential: credentialResponse.credential,
          role: 'Customer' // Default for new Google users
        }),
        credentials: 'include'
      });

      const data = await response.json();
      if (data.status === 'success') {
        localStorage.setItem('is_logged_in', 'true');
        localStorage.setItem('user_role', data.role);
        if (data.role === 'Admin') navigate('/admin');
        else if (data.role === 'Vendor') navigate('/vendor');
        else navigate('/customer');
      } else {
        setError(data.message || 'Google authentication failed.');
        setLoading(false);
      }
    } catch (err) {
      setError('Network error during Google login.');
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: password }),
        credentials: 'include'
      });

      const data = await response.json();

      if (data.status === 'success') {
        localStorage.setItem('is_logged_in', 'true');
        localStorage.setItem('user_role', data.role);

        if (data.role === 'Admin') navigate('/admin');
        else if (data.role === 'Vendor') navigate('/vendor');
        else navigate('/customer');
      } else if (data.pending_verification) {
        // Email verification required
        localStorage.setItem('pending_email', data.email);
        navigate('/verify-email-sent', { state: { email: data.email } });
      } else {
        setError(data.message || 'Login failed.');
        setLoading(false);
      }
    } catch (err) {
      setError('A network error occurred.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-container glass-panel" style={{ maxWidth: '440px', margin: '2rem auto', padding: '2.5rem' }}>
      <h2 className="auth-title" style={{ margin: '0 0 0.5rem 0', fontWeight: '800' }}>Welcome Back</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.8rem', fontSize: '0.95rem' }}>Sign in to continue to ConEco</p>

      {error && (
        <div style={{ padding: '0.8rem 1rem', marginBottom: '1.5rem', borderRadius: '8px', background: 'rgba(248,81,73,0.12)', color: '#f85149', border: '1px solid rgba(248,81,73,0.25)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', textAlign: 'left' }}>
        <div>
          <label className="input-label" style={{ fontWeight: '600' }}>Email Address</label>
          <input
            type="text"
            placeholder="Enter Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input-field"
            style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--surface-border)', color: 'var(--text-highlight)', boxSizing: 'border-box' }}
          />
        </div>
        
        <div style={{ position: 'relative' }}>
          <label className="input-label" style={{ fontWeight: '600' }}>Password</label>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="input-field"
            style={{ width: '100%', padding: '0.8rem 1rem', paddingRight: '2.5rem', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--surface-border)', color: 'var(--text-highlight)', boxSizing: 'border-box' }}
          />
          <button
            type="button"
            onClick={handleTogglePassword}
            style={{ position: 'absolute', right: '12px', top: '35px', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.7, fontSize: '1.2rem', padding: 0 }}
          >
            {showPassword ? '👁️' : '👁️‍🗨️'}
          </button>
          
          <div style={{ textAlign: 'right', marginTop: '0.5rem' }}>
            <Link to="/forgot-password" style={{ color: 'var(--primary-color)', fontSize: '0.85rem', textDecoration: 'none', fontWeight: '600' }}>Forgot Password?</Link>
          </div>
        </div>

        <button 
          type="submit" 
          className="btn" 
          disabled={loading} 
          style={{ marginTop: '0.5rem', padding: '0.9rem', fontSize: '1rem', fontWeight: '800', width: '100%' }}
        >
          {loading ? 'Authenticating...' : 'Sign In'}
        </button>
      </form>

      <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '10px' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--surface-border)' }}></div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600' }}>OR</div>
          <div style={{ flex: 1, height: '1px', background: 'var(--surface-border)' }}></div>
        </div>

        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => setError('Google Login Failed')}
          theme="filled_blue"
          shape="pill"
        />
      </div>

      <p style={{ marginTop: '2rem', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 0 }}>
        Don't have an account? <Link to="/register" style={{ color: 'var(--primary-color)', fontWeight: '600', textDecoration: 'none' }}>Register here</Link>
      </p>
    </div>
  );
}

export default Login;
