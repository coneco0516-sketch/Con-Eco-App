import React, { useState, useEffect } from 'react';
import CustomerSidebar from '../components/CustomerSidebar';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'https://con-eco-app-w78g.onrender.com';

const PUSH_VAPID_KEY = 'BMWUGlFCX4gbzFvuIVv-C0l6xRNm2ymMTnd3-mQqoCwAC7TOkheENAnxhPqXJk-dLZq4DzSwd6lFVY_7QWcFBOM';


function CustomerProfile() {
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [credit, setCredit] = useState(null);
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
    fetchCredit();
  }, []);

  const fetchCredit = async () => {
    try {
      const resp = await fetch(`${API}/api/customer/credit_summary`, { credentials: 'include' });
      const data = await resp.json();
      if (data.status === 'success') {
        setCredit(data);
      }
    } catch (err) {
      console.error('Credit fetch error:', err);
    }
  };

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
        setMsg('Push notifications enabled!');
      } else {
        setPushStatus('Error');
        setMsg('Server error: ' + data.message);
      }
    } catch (err) {
      console.error("Push Error details:", err);
      setPushStatus('Denied/Error');
      if (err.message === 'Permission denied') {
        setMsg('Please allow notifications in your browser settings (Click the padlock icon near URL).');
      } else {
        setMsg('Push Error: ' + err.toString());
      }
    }
  };


  return (
    <div className="dashboard-layout">
      <CustomerSidebar />
      <main style={{ flex: 1 }}>
        <h2 style={{ fontSize: '2rem', color: 'var(--text-highlight)', marginTop: 0 }}>My Profile</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>View and update your personal information.</p>
        <hr style={{ borderColor: 'var(--surface-border)', marginBottom: '1.5rem' }} />
        
        {loading ? <p>Loading profile...</p> : (
          <div className="glass-panel" style={{ padding: '2rem' }}>
            {msg && <p style={{ color: 'var(--primary-color)', marginBottom: '1rem' }}>{msg}</p>}
            
            {profile ? (
              !editMode ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <p><strong>Name:</strong> {profile.name}</p>
                  <p><strong>Email:</strong> {profile.email} (Non-editable)</p>
                  <p><strong>Phone:</strong> {profile.phone}</p>
                  <p><strong>City:</strong> {profile.city || 'Not provided'}</p>
                  <p><strong>State:</strong> {profile.state || 'Not provided'}</p>
                  
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button onClick={() => setEditMode(true)} className="btn">Edit Profile</button>
                    <button onClick={handleLogout} className="btn danger">Logout</button>
                  </div>

                  {credit && credit.summary && parseFloat(credit.summary.credit_limit) > 0 && (
                     <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(52, 152, 219, 0.05)', borderRadius: '12px', border: '1px solid rgba(52, 152, 219, 0.2)' }}>
                        <h3 style={{ color: 'var(--text-highlight)', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span>💳</span> Credit Account 
                          {credit.summary.credit_status === 'Suspended' && <span style={{ fontSize: '0.7rem', background: '#e74c3c', color: 'white', padding: '2px 8px', borderRadius: '4px' }}>SUSPENDED</span>}
                        </h3>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                           <span style={{ color: 'var(--text-secondary)' }}>Available Limit</span>
                           <span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>₹{parseFloat(credit.summary.credit_available).toFixed(2)}</span>
                        </div>
                        
                        <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden', marginBottom: '1.5rem' }}>
                           <div style={{ 
                              height: '100%', 
                              width: `${Math.min(100, (parseFloat(credit.summary.credit_used) / parseFloat(credit.summary.credit_limit)) * 100)}%`,
                              background: 'var(--primary-color)'
                           }}></div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                           <div style={{ padding: '0.8rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Limit</p>
                              <p style={{ margin: 0, fontSize: '1rem', color: 'white', fontWeight: 'bold' }}>₹{parseFloat(credit.summary.credit_limit).toFixed(0)}</p>
                           </div>
                           <div style={{ padding: '0.8rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Currently Used</p>
                              <p style={{ margin: 0, fontSize: '1rem', color: 'white', fontWeight: 'bold' }}>₹{parseFloat(credit.summary.credit_used).toFixed(0)}</p>
                           </div>
                        </div>

                        {credit.summary.credit_status === 'Suspended' && (
                           <div style={{ padding: '0.8rem', background: 'rgba(231, 76, 60, 0.1)', borderRadius: '6px', borderLeft: '3px solid #e74c3c', marginBottom: '1.5rem' }}>
                              <p style={{ margin: 0, fontSize: '0.85rem', color: '#e74c3c' }}>
                                 <strong>Account Suspended:</strong> Your credit account is temporarily blocked due to overdue payments. Suspension ends: {credit.summary.suspended_until}
                              </p>
                           </div>
                        )}

                        <h4 style={{ color: 'var(--text-highlight)', margin: '0 0 0.8rem 0', fontSize: '1rem' }}>Recent Activity</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                           {credit?.recent_transactions?.map((txn, idx) => (
                              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', fontSize: '0.85rem' }}>
                                 <div>
                                    <span style={{ fontWeight: 'bold', color: txn.txn_type === 'Debit' ? '#e74c3c' : '#3fb950', marginRight: '10px' }}>
                                       {txn.txn_type === 'Debit' ? '−' : '+'} ₹{txn.amount}
                                    </span>
                                    <span style={{ color: 'var(--text-secondary)' }}>{txn.notes}</span>
                                 </div>
                                 <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>{txn.date}</span>
                              </div>
                           ))}
                           {(!credit?.recent_transactions || credit.recent_transactions.length === 0) && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>No recent transactions.</p>}
                        </div>
                     </div>
                  )}

                  <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                    <h4 style={{ color: 'var(--text-highlight)', margin: '0 0 0.5rem 0' }}>🔔 Browser Notifications</h4>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                      Status: <span style={{ color: pushStatus === 'Subscribed' ? 'var(--primary-color)' : 'var(--warning-color)' }}>{pushStatus}</span>
                    </p>
                    {pushStatus !== 'Subscribed' && (
                      <button onClick={handleSubscribePush} className="btn" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                        {pushStatus === 'Subscribing...' ? 'Working...' : 'Enable Alert Notifications'}
                      </button>
                    )}
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
              )
            ) : (
              <p>Unable to load profile data.</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default CustomerProfile;
