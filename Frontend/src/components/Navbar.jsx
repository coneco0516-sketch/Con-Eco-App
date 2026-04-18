import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const API = process.env.REACT_APP_API_URL || '';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('is_logged_in'));
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('is_logged_in'));
  }, [location]);

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  console.log("Navbar: isLoggedIn =", isLoggedIn);

  const handleLogout = () => {
    localStorage.removeItem('is_logged_in');
    localStorage.removeItem('user_role');

    fetch(`${API}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    }).then(() => {
      navigate('/login');
    });
  };

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  return (
    <nav className="navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {!isLoggedIn && (
          <Link to="/" className="nav-brand">
            <img src="/Logo.svg" alt="ConEco Logo" className="nav-logo" />
            <span>ConEco</span>
          </Link>
        )}
        {isLoggedIn && (
          <div className="nav-brand">
            <img src="/Logo.svg" alt="ConEco Logo" className="nav-logo" />
            <span>ConEco</span>
          </div>
        )}
        <button 
          onClick={toggleTheme}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title={theme === 'light' ? "Switch to Dark Mode" : "Switch to Light Mode"}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </div>
      <div className="nav-links">
        {!isLoggedIn && (
          <>
            <Link to="/" className="nav-item">Home</Link>
            <Link to="/about" className="nav-item">About Us</Link>
            <Link to="/register" className="nav-item">Registration</Link>
            <Link to="/login" className="nav-item">Login</Link>
          </>
        )}

        {isLoggedIn && <button onClick={handleLogout} className="btn danger">Logout</button>}
      </div>
    </nav>
  );
}

export default Navbar;
