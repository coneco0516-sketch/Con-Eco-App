import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const isLoggedIn = localStorage.getItem('is_logged_in') === 'true';

  const handleLogout = () => {
    localStorage.removeItem('is_logged_in');
    localStorage.removeItem('user_role');

    fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    }).then(() => {
      navigate('/login');
    });
  };

  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">ConEco System</Link>
      <div className="nav-links">
        {!isLoggedIn && (
          <>
            <Link to="/" className="nav-item">Home</Link>
            <Link to="/about" className="nav-item">About Us</Link>
            <Link to="/faq" className="nav-item">FAQ</Link>
            <Link to="/contact" className="nav-item">Contact</Link>
            <Link to="/privacy" className="nav-item">Privacy Policy</Link>
            <Link to="/terms" className="nav-item">Terms of Service</Link>
            <Link to="/register" className="nav-item">Register</Link>
            <Link to="/login" className="nav-item">Login</Link>
          </>
        )}

        {isLoggedIn && <button onClick={handleLogout} className="btn danger">Logout</button>}
      </div>
    </nav>
  );
}

export default Navbar;
