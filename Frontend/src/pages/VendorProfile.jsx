import React, { useState, useEffect } from 'react';
import VendorSidebar from '../components/VendorSidebar';
import { useNavigate } from 'react-router-dom';

function VendorProfile() {
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Ideally this information is fetched from an API endpoint
    setProfile({
      businessName: 'Vendor Store',
      ownerName: 'Vendor User',
      email: 'vendor@example.com',
      phone: '+91 9876543210'
    });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('is_logged_in');
    localStorage.removeItem('user_role');
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
      <VendorSidebar />
      <main style={{ flex: 1 }}>
        <h2 style={{ fontSize: '2rem', color: 'white', marginTop: 0 }}>Vendor Profile</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Manage your business info and settings.</p>
        <hr style={{ borderColor: 'var(--surface-border)', marginBottom: '1.5rem' }} />
        
        {profile ? (
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Business Information</h3>
            <p><strong>Business Name:</strong> {profile.businessName}</p>
            <p><strong>Owner Name:</strong> {profile.ownerName}</p>
            <p><strong>Email:</strong> {profile.email}</p>
            <p><strong>Phone:</strong> {profile.phone}</p>
            <button onClick={handleLogout} className="btn" style={{ background: 'var(--danger-color)', marginTop: '2rem' }}>Logout</button>
          </div>
        ) : (
          <p>Loading profile...</p>
        )}
      </main>
    </div>
  );
}

export default VendorProfile;
