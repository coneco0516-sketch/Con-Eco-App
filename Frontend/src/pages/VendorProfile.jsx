import React, { useState, useEffect } from 'react';
import VendorSidebar from '../components/VendorSidebar';
import { useNavigate } from 'react-router-dom';

function VendorProfile() {
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
      const resp = await fetch('/api/auth/profile', { credentials: 'include' });
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
      const resp = await fetch('/api/auth/profile', {
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
    fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).then(() => navigate('/login'));
  };

  return (
    <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
      <VendorSidebar />
      <main style={{ flex: 1 }}>
        <h2 style={{ fontSize: '2rem', color: 'white', marginTop: 0 }}>Vendor Profile</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Manage your business information and settings.</p>
        <hr style={{ borderColor: 'var(--surface-border)', marginBottom: '1.5rem' }} />
        
        {loading ? <p>Loading profile...</p> : (
          <div>
            {/* QC Verification Status Banner */}
            <div style={{
              padding: '1.5rem',
              marginBottom: '1.5rem',
              background: profile?.verification_status === 'Verified' 
                ? 'rgba(36, 134, 54, 0.2)' 
                : profile?.verification_status === 'Rejected'
                ? 'rgba(248, 81, 73, 0.2)'
                : 'rgba(212, 162, 11, 0.2)',
              border: `2px solid ${
                profile?.verification_status === 'Verified' 
                  ? '#238636' 
                  : profile?.verification_status === 'Rejected'
                  ? '#f85149'
                  : '#d4a20b'
              }`,
              borderRadius: '8px'
            }}>
              <h3 style={{ 
                color: profile?.verification_status === 'Verified' 
                  ? '#238636' 
                  : profile?.verification_status === 'Rejected'
                  ? '#f85149'
                  : '#d4a20b',
                margin: '0 0 0.5rem 0'
              }}>
                {profile?.verification_status === 'Verified' 
                  ? '✓ QC Verified' 
                  : profile?.verification_status === 'Rejected'
                  ? '✗ QC Rejected'
                  : '⏳ Pending QC Verification'
                }
              </h3>
              <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-secondary)' }}>
                {profile?.verification_status === 'Verified' 
                  ? 'Your business has been verified. Your products and services are visible to customers.' 
                  : profile?.verification_status === 'Rejected'
                  ? 'Your business verification was rejected. Please contact admin for details.'
                  : 'Your business is under review. Please wait for admin approval. Your products won\'t be visible to customers until verified.'
                }
              </p>
              {profile?.qc_score !== undefined && profile?.verification_status === 'Verified' && (
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
                  <strong>QC Score:</strong> {profile.qc_score}/100
                </p>
              )}
            </div>

            <div className="glass-panel" style={{ padding: '2rem' }}>
              {msg && <p style={{ color: 'var(--primary-color)', marginBottom: '1rem' }}>{msg}</p>}
              
              {!editMode ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p><strong>Business Name:</strong> {profile.company_name}</p>
                <p><strong>Owner Name:</strong> {profile.name}</p>
                <p><strong>Email:</strong> {profile.email} (Non-editable)</p>
                <p><strong>Phone:</strong> {profile.phone}</p>
                <p><strong>GST Number:</strong> {profile.gst_number || 'Not provided'}</p>
                <p><strong>Address:</strong> {profile.address || 'Not provided'}</p>
                <p><strong>City:</strong> {profile.city || 'Not provided'}</p>
                <p><strong>State:</strong> {profile.state || 'Not provided'}</p>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button onClick={() => setEditMode(true)} className="btn">Edit Business Info</button>
                  <button onClick={handleLogout} className="btn danger">Logout</button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label className="input-label">Business Name</label>
                    <input type="text" name="company_name" value={formData.company_name || ''} onChange={handleChange} className="input-field" required />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="input-label">Owner Name</label>
                    <input type="text" name="name" value={formData.name || ''} onChange={handleChange} className="input-field" required />
                  </div>
                </div>
                <div>
                  <label className="input-label">Phone No</label>
                  <input type="text" name="phone" value={formData.phone || ''} onChange={handleChange} className="input-field" required />
                </div>
                <div>
                  <label className="input-label">GST Number</label>
                  <input type="text" name="gst_number" value={formData.gst_number || ''} onChange={handleChange} className="input-field" />
                </div>
                <div>
                  <label className="input-label">Address</label>
                  <textarea name="address" value={formData.address || ''} onChange={handleChange} className="input-field" style={{ minHeight: '80px', paddingTop: '10px' }} />
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label className="input-label">City</label>
                    <input type="text" name="city" value={formData.city || ''} onChange={handleChange} className="input-field" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="input-label">State</label>
                    <input type="text" name="state" value={formData.state || ''} onChange={handleChange} className="input-field" />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button type="submit" className="btn">Save Changes</button>
                  <button type="button" onClick={() => setEditMode(false)} className="btn" style={{ background: 'var(--text-secondary)' }}>Cancel</button>
                </div>
              </form>
            )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default VendorProfile;
