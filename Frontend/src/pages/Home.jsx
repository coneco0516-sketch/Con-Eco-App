import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem('is_logged_in');
  const userRole = localStorage.getItem('user_role');

  useEffect(() => {
    if (isLoggedIn) {
      if (userRole === 'Admin') navigate('/admin');
      else if (userRole === 'Vendor') navigate('/vendor');
      else if (userRole === 'Customer') navigate('/customer');
      else navigate('/login');
    }
  }, [isLoggedIn, userRole, navigate]);

  return (
    <div style={{ textAlign: 'center', marginTop: '10vh' }}>
      <h1 style={{ fontSize: '4rem', color: 'var(--text-highlight)', marginBottom: '1rem', background: 'linear-gradient(90deg, #2ea043, #7ee787)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        Welcome to ConEco
      </h1>
      <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 3rem', lineHeight: '1.6' }}>
        Connects Customers to get their required Construction Materials & Services with the Vendors and Service Providers
      </p>
      <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
        <Link to="/register" className="btn" style={{ fontSize: '1.2rem', padding: '0.8rem 2rem' }}>Get Started</Link>
      </div>
    </div>
  );
}

export default Home;
