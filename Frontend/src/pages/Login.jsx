import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
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
    <div className="auth-container glass-panel">
      <h2 className="auth-title">Welcome Back</h2>
      {error && <p style={{ color: 'var(--danger-color)', marginBottom: '1rem', background: 'rgba(248,81,73,0.1)', padding:'0.5rem', borderRadius:'4px' }}>{error}</p>}
      
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', textAlign: 'left' }}>
        <div>
          <label className="input-label">Email Address</label>
          <input 
            type="text" 
            placeholder="admin@coneco.com"
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            className="input-field" 
          />
        </div>
        <div>
          <label className="input-label">Password</label>
          <input 
            type="password" 
            placeholder="••••••••"
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            className="input-field" 
          />
          <div style={{ textAlign: 'right', marginTop: '0.3rem' }}>
            <Link to="/forgot-password" style={{ color: 'var(--primary-color)', fontSize: '0.9rem', textDecoration: 'none' }}>Forgot Password?</Link>
          </div>
        </div>
        <button type="submit" className="btn" disabled={loading} style={{ marginTop: '0.5rem' }}>
          {loading ? 'Authenticating...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}

export default Login;
