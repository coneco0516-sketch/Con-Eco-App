import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import './VerifyEmail.css';

const API = import.meta.env.VITE_API_URL || 'https://con-eco-app-w78g.onrender.com';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link');
      return;
    }

    // Verify email with token
    fetch(`${API}/api/auth/verify-email?token=${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setStatus('success');
          setMessage('Email verified successfully! You can now login.');
          
          // Redirect to login after 3 seconds
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(data.message || 'Email verification failed. The link may have expired.');
        }
      })
      .catch(err => {
        setStatus('error');
        setMessage('Error verifying email. Please try again.');
        console.error(err);
      });
  }, [searchParams, navigate]);

  return (
    <div className="verify-email-container">
      <div className={`verify-email-card ${status}`}>
        <div className="verify-email-icon">
          {status === 'loading' && <div className="spinner"></div>}
          {status === 'success' && <span className="checkmark">✓</span>}
          {status === 'error' && <span className="error-mark">✕</span>}
        </div>
        
        <h2 className="verify-email-title">
          {status === 'loading' && 'Verifying Email'}
          {status === 'success' && 'Email Verified!'}
          {status === 'error' && 'Verification Failed'}
        </h2>
        
        <p className="verify-email-message">{message}</p>
        
        {status === 'error' && (
          <div className="verify-email-actions">
            <button 
              className="btn primary" 
              onClick={() => navigate('/login')}
            >
              Back to Login
            </button>
            <button 
              className="btn secondary" 
              onClick={() => navigate('/register')}
            >
              Try Registering Again
            </button>
          </div>
        )}
        
        {status === 'success' && (
          <p className="verify-email-redirect">
            Redirecting to login in 3 seconds...
          </p>
        )}
      </div>
    </div>
  );
}
