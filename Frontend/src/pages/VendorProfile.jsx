import React, { useState, useEffect } from 'react';
import VendorSidebar from '../components/VendorSidebar';
import { useNavigate } from 'react-router-dom';
import AddressBook from '../components/AddressBook';

const API = import.meta.env.VITE_API_URL || 'https://api.coneco.store';
const PUSH_VAPID_KEY = 'BMWUGlFCX4gbzFvuIVv-C0l6xRNm2ymMTnd3-mQqoCwAC7TOkheENAnxhPqXJk-dLZq4DzSwd6lFVY_7QWcFBOM';

function VendorProfile() {
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('success');
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

  const showStatusMsg = (text, type = 'success') => {
    setMsg(text);
    setMsgType(type);
    setTimeout(() => setMsg(''), 4000);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setMsg('Updating...');
    setMsgType('info');
    try {
      const resp = await fetch(`${API}/api/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include'
      });
      const data = await resp.json();
      if (data.status === 'success') {
        showStatusMsg('Profile updated successfully!', 'success');
        setEditMode(false);
        fetchProfile();
      } else {
        showStatusMsg('Update failed: ' + data.message, 'error');
      }
    } catch (err) {
      showStatusMsg('Network error occurred.', 'error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('is_logged_in');
    localStorage.removeItem('user_role');
    fetch(`${API}/api/auth/logout`, { method: 'POST', credentials: 'include' }).then(() => navigate('/login'));
  };

  const [pushStatus, setPushStatus] = useState('Checking...');
  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => {
          setPushStatus(sub ? 'Subscribed' : 'Not Subscribed');
        });
      });
    } else {
      setPushStatus('Not Supported');
    }
  }, []);

  const urlB64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const handleSubscribePush = async () => {
    if (pushStatus === 'Not Supported') return;
    setPushStatus('Subscribing...');
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Permission denied');
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array(PUSH_VAPID_KEY)
      });
      const resp = await fetch(`${API}/api/auth/subscribe-push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub }),
        credentials: 'include'
      });
      const data = await resp.json();
      if (data.status === 'success') {
        setPushStatus('Subscribed');
        showStatusMsg('Push notifications enabled!', 'success');
      } else {
        setPushStatus('Error');
        showStatusMsg('Server error: ' + data.message, 'error');
      }
    } catch (err) {
      console.error("Push Error details:", err);
      setPushStatus('Denied/Error');
      if (err.message === 'Permission denied') {
        showStatusMsg('Please allow notifications in your browser settings.', 'error');
      } else {
        showStatusMsg('Push Error: ' + err.toString(), 'error');
      }
    }
  };

  return (
    <div className="dashboard-layout">
      <VendorSidebar />
      <main style={{ flex: 1, padding: '2rem', minWidth: 0 }}>
        <h2 style={{ fontSize: '2rem', color: 'var(--text-highlight)', marginTop: 0, fontWeight: '800' }}>Vendor Profile</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Manage your business information and settings.</p>
        <hr style={{ borderColor: 'var(--surface-border)', marginBottom: '2rem' }} />
        
        {msg && (
          <div style={{ 
            padding: '1rem 1.5rem', 
            marginBottom: '1.5rem', 
            borderRadius: '8px', 
            background: msgType === 'success' ? 'rgba(36, 134, 54, 0.15)' : msgType === 'error' ? 'rgba(248, 81, 73, 0.15)' : 'rgba(52, 152, 219, 0.15)', 
            color: msgType === 'success' ? '#3fb950' : msgType === 'error' ? '#f85149' : '#58a6ff', 
            border: msgType === 'success' ? '1px solid rgba(36, 134, 54, 0.3)' : msgType === 'error' ? '1px solid rgba(248, 81, 73, 0.3)' : '1px solid rgba(52, 152, 219, 0.3)',
            fontWeight: '600',
            fontSize: '0.95rem'
          }}>
            {msgType === 'success' ? '✨ ' : msgType === 'error' ? '⚠️ ' : 'ℹ️ '} {msg}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="skeleton-pulse" style={{ height: '80px', borderRadius: '12px' }}></div>
            <div className="glass-panel" style={{ padding: '2rem', borderRadius: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div className="skeleton-pulse" style={{ height: '70px', borderRadius: '8px' }}></div>
                <div className="skeleton-pulse" style={{ height: '70px', borderRadius: '8px' }}></div>
                <div className="skeleton-pulse" style={{ height: '70px', borderRadius: '8px' }}></div>
                <div className="skeleton-pulse" style={{ height: '70px', borderRadius: '8px' }}></div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            {/* QC Verification Status Banner */}
            <div style={{
              padding: '1.5rem 2rem',
              marginBottom: '2rem',
              background: profile?.verification_status === 'Verified' 
                ? 'rgba(36, 134, 54, 0.08)' 
                : profile?.verification_status === 'Rejected'
                ? 'rgba(248, 81, 73, 0.08)'
                : 'rgba(212, 162, 11, 0.08)',
              borderLeft: `5px solid ${
                profile?.verification_status === 'Verified' 
                  ? '#2ea043' 
                  : profile?.verification_status === 'Rejected'
                  ? '#f85149'
                  : '#d4a20b'
              }`,
              borderTop: '1px solid var(--surface-border)',
              borderRight: '1px solid var(--surface-border)',
              borderBottom: '1px solid var(--surface-border)',
              borderRadius: '12px',
              backdropFilter: 'blur(4px)'
            }}>
              <h3 style={{ 
                color: profile?.verification_status === 'Verified' 
                  ? '#3fb950' 
                  : profile?.verification_status === 'Rejected'
                  ? '#f85149'
                  : '#d4a20b',
                margin: '0 0 0.5rem 0',
                fontSize: '1.2rem',
                fontWeight: '800',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                {profile?.verification_status === 'Verified' 
                  ? '✓ QC Verified' 
                  : profile?.verification_status === 'Rejected'
                  ? '✗ QC Rejected'
                  : '⏳ Pending QC Verification'
                }
              </h3>
              <p style={{ margin: '0.4rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                {profile?.verification_status === 'Verified' 
                  ? 'Your business profile has been reviewed and verified. Your active catalog products and services are now visible to all platform customers.' 
                  : profile?.verification_status === 'Rejected'
                  ? 'Your business verification has been rejected. Please review your credentials or contact the support admin team.'
                  : 'Your business application is currently under manual verification review. Catalog listings will activate once approved.'
                }
              </p>
              {profile?.qc_score !== undefined && profile?.verification_status === 'Verified' && (
                <p style={{ margin: '0.8rem 0 0 0', fontSize: '0.9rem', color: 'var(--text-highlight)' }}>
                  <strong>QC Score Rating:</strong> <span style={{ background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--surface-border)', fontWeight: 'bold' }}>{profile.qc_score}/100</span>
                </p>
              )}
            </div>

            <div className="glass-panel" style={{ padding: '2rem', borderRadius: '16px' }}>
              
              {!editMode ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  
                  {/* Grid of Business Information Cells */}
                  <div className="profile-info-grid">
                    <div className="profile-info-cell">
                      <div className="label">Business Name</div>
                      <div className="value">{profile.company_name}</div>
                    </div>
                    <div className="profile-info-cell">
                      <div className="label">Owner Name</div>
                      <div className="value">{profile.name}</div>
                    </div>
                    <div className="profile-info-cell">
                      <div className="label">GST Number</div>
                      <div className="value">{profile.gst_number || 'Not provided'}</div>
                    </div>
                    <div className="profile-info-cell">
                      <div className="label">Email Address</div>
                      <div className="value" style={{ fontSize: '0.9rem' }}>{profile.email}</div>
                    </div>
                    <div className="profile-info-cell">
                      <div className="label">Phone Number</div>
                      <div className="value">{profile.phone}</div>
                    </div>
                    <div className="profile-info-cell">
                      <div className="label">City</div>
                      <div className="value">{profile.city || 'Not provided'}</div>
                    </div>
                    <div className="profile-info-cell">
                      <div className="label">State</div>
                      <div className="value">{profile.state || 'Not provided'}</div>
                    </div>
                    <div className="profile-info-cell" style={{ gridColumn: 'span 2' }}>
                      <div className="label">Business Address</div>
                      <div className="value" style={{ wordBreak: 'normal' }}>{profile.address || 'Not provided'}</div>
                    </div>
                  </div>

                  {/* Profile Actions */}
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <button onClick={() => setEditMode(true)} className="btn" style={{ fontWeight: '600' }}>Edit Business Info ⚙️</button>
                    <button onClick={handleLogout} className="btn danger" style={{ fontWeight: '600' }}>Logout 🚪</button>
                  </div>

                  {/* Address Book Card */}
                  <AddressBook role="Vendor" />

                  {/* Notification card widget */}
                  <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--surface-border)', borderRadius: '12px' }}>
                    <h4 style={{ color: 'var(--text-highlight)', margin: '0 0 0.5rem 0', fontSize: '1.05rem', fontWeight: '700' }}>🔔 Browser Notifications</h4>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.2rem', marginTop: '0.2rem' }}>
                      Get instant alerts when you match a new customer RFQ. Status: <span style={{ color: pushStatus === 'Subscribed' ? 'var(--primary-color)' : 'var(--warning-color)', fontWeight: '700' }}>{pushStatus}</span>
                    </p>
                    {pushStatus !== 'Subscribed' && (
                      <button onClick={handleSubscribePush} className="btn" style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem', fontWeight: '600', borderRadius: '6px' }}>
                        {pushStatus === 'Subscribing...' ? 'Working...' : 'Enable Alert Notifications 🔔'}
                      </button>
                    )}
                  </div>

                </div>
              ) : (
                <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <h3 style={{ color: 'var(--text-highlight)', margin: '0 0 0.5rem 0', fontWeight: '700' }}>Edit Business Details</h3>
                  
                  <div style={{ display: 'flex', gap: '1.2rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '220px' }}>
                      <label className="input-label" style={{ fontWeight: '600' }}>Business Name</label>
                      <input 
                        type="text" 
                        name="company_name" 
                        value={formData.company_name || ''} 
                        onChange={handleChange} 
                        className="input-field" 
                        required 
                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--surface-border)', color: 'var(--text-highlight)', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: '220px' }}>
                      <label className="input-label" style={{ fontWeight: '600' }}>Owner Name</label>
                      <input 
                        type="text" 
                        name="name" 
                        value={formData.name || ''} 
                        onChange={handleChange} 
                        className="input-field" 
                        required 
                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--surface-border)', color: 'var(--text-highlight)', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="input-label" style={{ fontWeight: '600' }}>Phone Number</label>
                    <input 
                      type="text" 
                      name="phone" 
                      value={formData.phone || ''} 
                      onChange={handleChange} 
                      className="input-field" 
                      required 
                      style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--surface-border)', color: 'var(--text-highlight)', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label className="input-label" style={{ fontWeight: '600' }}>GST Number</label>
                    <input 
                      type="text" 
                      name="gst_number" 
                      value={formData.gst_number || ''} 
                      onChange={handleChange} 
                      className="input-field" 
                      style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--surface-border)', color: 'var(--text-highlight)', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label className="input-label" style={{ fontWeight: '600' }}>Business Address</label>
                    <textarea 
                      name="address" 
                      value={formData.address || ''} 
                      onChange={handleChange} 
                      className="input-field" 
                      style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--surface-border)', color: 'var(--text-highlight)', boxSizing: 'border-box', minHeight: '80px', paddingTop: '10px' }} 
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '1.2rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <label className="input-label" style={{ fontWeight: '600' }}>City</label>
                      <input 
                        type="text" 
                        name="city" 
                        value={formData.city || ''} 
                        onChange={handleChange} 
                        className="input-field" 
                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--surface-border)', color: 'var(--text-highlight)', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <label className="input-label" style={{ fontWeight: '600' }}>State</label>
                      <input 
                        type="text" 
                        name="state" 
                        value={formData.state || ''} 
                        onChange={handleChange} 
                        className="input-field" 
                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--surface-border)', color: 'var(--text-highlight)', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button type="submit" className="btn" style={{ fontWeight: '600' }}>Save Changes</button>
                    <button type="button" onClick={() => setEditMode(false)} className="btn" style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text-primary)', fontWeight: '600' }}>Cancel</button>
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
