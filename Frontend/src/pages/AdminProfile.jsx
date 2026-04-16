import React, { useState, useEffect } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import { useNavigate } from 'react-router-dom';

const API = process.env.REACT_APP_API_URL || '';

function AdminProfile() {
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const resp = await fetch(`${API}/api/auth/profile`, { credentials: 'include' });
      const data = await resp.json();
      if (data.status === 'success') {
        setProfile(data.profile);
        setFormData(data.profile);
      } else if (data.detail === 'not_logged_in') {
        navigate('/login');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setMsg('Updating...');
    try {
      const resp = await fetch(`${API}/api/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include'
      });
      const data = await resp.json();
      if (data.status === 'success') {
        setMsg('Profile updated successfully!');
        setEditMode(false);
        fetchProfile();
      } else {
        setMsg('Update failed: ' + data.message);
      }
    } catch (err) {
      setMsg('Network error occurred.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('is_logged_in');
    localStorage.removeItem('user_role');
    fetch(`${API}/api/auth/logout`, { method: 'POST', credentials: 'include' }).then(() => navigate('/login'));
  };

  return (
    <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
      <AdminSidebar />
      <main style={{ flex: 1 }}>
        <h2 style={{ fontSize: '2rem', color: 'var(--text-highlight)', marginTop: 0 }}>My Account</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Manage your administrative profile.</p>
        <hr style={{ borderColor: 'var(--surface-border)', marginBottom: '1.5rem' }} />
        
        {loading ? <p>Loading profile...</p> : (
          <div className="glass-panel" style={{ padding: '2rem' }}>
            {msg && <p style={{ color: 'var(--primary-color)', marginBottom: '1rem' }}>{msg}</p>}

            {!editMode ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p><strong>Name:</strong> {profile.name}</p>
                <p><strong>Email:</strong> {profile.email} (Non-editable)</p>
                <p><strong>Phone:</strong> {profile.phone}</p>
                <p><strong>Role:</strong> {profile.role}</p>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button onClick={() => setEditMode(true)} className="btn">Edit Profile</button>
                  <button onClick={handleLogout} className="btn danger">Logout</button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div>
                  <label className="input-label">Full Name</label>
                  <input type="text" name="name" value={formData.name || ''} onChange={handleChange} className="input-field" required />
                </div>
                <div>
                  <label className="input-label">Phone No</label>
                  <input type="text" name="phone" value={formData.phone || ''} onChange={handleChange} className="input-field" required />
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button type="submit" className="btn">Save Changes</button>
                  <button type="button" onClick={() => setEditMode(false)} className="btn" style={{ background: 'var(--text-secondary)' }}>Cancel</button>
                </div>
              </form>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminProfile;
