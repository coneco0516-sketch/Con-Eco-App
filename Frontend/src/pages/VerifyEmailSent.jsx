import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './VerifyEmailSent.css';

const API = import.meta.env.VITE_API_URL || '';

export default function VerifyEmailSent() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const email = location.state?.email || localStorage.getItem('pending_email') || '';

  const handleResendEmail = async () => {
    if (!email) {
      setMessage('Email not found. Please register again.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API}/api/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      if (data.status === 'success') {
        setMessage('✓ Verification email sent! Check your inbox.');
      } else {
        setMessage('Failed to resend email. Please try again.');
      }
    } catch (err) {
      setMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGotoLogin = () => {
    navigate('/login');
  };

  return (
    <div className="verify-email-sent-container">
      <div className="verify-email-sent-card">
        <div className="verify-email-sent-icon">📧</div>
        
        <h2 className="verify-email-sent-title">Verify Your Email</h2>
        
        <p className="verify-email-sent-subtitle">
          We've sent a verification link to
        </p>
        
        <p className="verify-email-sent-email">{email || 'your email'}</p>
        
        <div className="verify-email-sent-instructions">
          <h4>What to do next:</h4>
          <ol>
            <li>Check your email inbox for the verification link from ConEco</li>
            <li>Click the verification link to confirm your email</li>
            <li>You'll be able to login after verification</li>
          </ol>
        </div>

        <div className="verify-email-sent-info">
          <p>⏱️ The verification link expires in 24 hours</p>
          <p>📧 Didn't receive the email? Check your spam folder</p>
        </div>

        {message && (
          <div className={`verify-email-sent-message ${message.includes('✓') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <div className="verify-email-sent-actions">
          <button 
            className="btn primary" 
            onClick={handleResendEmail}
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Resend Verification Email'}
          </button>
        </div>

        <hr className="verify-email-sent-divider" />

        <div className="verify-email-sent-footer">
          <p>Already verified your email?</p>
          <button 
            className="btn secondary" 
            onClick={handleGotoLogin}
          >
            Go to Login
          </button>
        </div>

        <div className="verify-email-sent-help">
          <p>Need help? <a href="/contact">Contact Support</a></p>
        </div>
      </div>
    </div>
  );
}
