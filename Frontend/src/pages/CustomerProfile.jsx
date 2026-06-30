import React, { useState, useEffect } from 'react';
import CustomerSidebar from '../components/CustomerSidebar';
import { useNavigate } from 'react-router-dom';
import AddressBook from '../components/AddressBook';

const API = import.meta.env.VITE_API_URL || 'https://api.coneco.store';
const PUSH_VAPID_KEY = 'BMWUGlFCX4gbzFvuIVv-C0l6xRNm2ymMTnd3-mQqoCwAC7TOkheENAnxhPqXJk-dLZq4DzSwd6lFVY_7QWcFBOM';

function CustomerProfile() {
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [credit, setCredit] = useState(null);
  const [platformSettings, setPlatformSettings] = useState({});
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('success');
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
    fetchCredit();
    fetchPlatformSettings();
  }, []);

  const fetchPlatformSettings = async () => {
    try {
      const resp = await fetch(`${API}/api/admin/platform_settings`, { credentials: 'include' });
      const data = await resp.json();
      if (data.status === 'success') setPlatformSettings(data.settings);
    } catch (err) {
      console.error('Platform settings fetch error:', err);
    }
  };

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
      <CustomerSidebar />
      <main style={{ flex: 1, padding: '2rem', minWidth: 0 }}>
        <h2 style={{ fontSize: '2rem', color: 'var(--text-highlight)', marginTop: 0, fontWeight: '800' }}>My Profile</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>View and update your personal information.</p>
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
          <div className="glass-panel" style={{ padding: '2rem', borderRadius: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div className="skeleton-pulse" style={{ height: '70px', borderRadius: '8px' }}></div>
              <div className="skeleton-pulse" style={{ height: '70px', borderRadius: '8px' }}></div>
              <div className="skeleton-pulse" style={{ height: '70px', borderRadius: '8px' }}></div>
              <div className="skeleton-pulse" style={{ height: '70px', borderRadius: '8px' }}></div>
            </div>
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '2rem', borderRadius: '16px' }}>
            
            {profile ? (
              !editMode ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  
                  {/* Profile info cards */}
                  <div className="profile-info-grid">
                    <div className="profile-info-cell">
                      <div className="label">Full Name</div>
                      <div className="value">{profile.name}</div>
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
                  </div>
                  
                  {/* Profile Actions */}
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <button onClick={() => setEditMode(true)} className="btn" style={{ fontWeight: '600' }}>Edit Profile ⚙️</button>
                    <button onClick={handleLogout} className="btn danger" style={{ fontWeight: '600' }}>Logout 🚪</button>
                  </div>

                  {/* Credit summary block */}
                  {platformSettings.enable_pay_later !== false && credit && credit.summary && parseFloat(credit.summary.credit_limit) > 0 && (
                     <div style={{ padding: '1.5rem', background: 'rgba(52, 152, 219, 0.03)', borderRadius: '12px', border: '1px solid rgba(52, 152, 219, 0.15)', backdropFilter: 'blur(4px)' }}>
                        <h3 style={{ color: 'var(--text-highlight)', margin: '0 0 1.2rem 0', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.15rem', fontWeight: '700' }}>
                          <span>💳</span> Credit Account (PayLater)
                          {credit.summary.credit_status === 'Suspended' && <span style={{ fontSize: '0.7rem', background: '#e74c3c', color: 'white', padding: '2px 8px', borderRadius: '4px', fontWeight: '800' }}>SUSPENDED</span>}
                        </h3>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem', fontSize: '0.95rem' }}>
                           <span style={{ color: 'var(--text-secondary)' }}>Available Limit</span>
                           <span style={{ color: 'var(--primary-color)', fontWeight: '800' }}>₹{parseFloat(credit.summary.credit_available).toFixed(2)}</span>
                        </div>
                        
                        <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden', marginBottom: '1.5rem', border: '1px solid var(--surface-border)' }}>
                           <div style={{ 
                              height: '100%', 
                              width: `${Math.min(100, (parseFloat(credit.summary.credit_used) / parseFloat(credit.summary.credit_limit)) * 100)}%`,
                              background: 'var(--primary-color)'
                           }}></div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                           <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>Total Credit Limit</p>
                              <p style={{ margin: '0.2rem 0 0 0', fontSize: '1.2rem', color: 'white', fontWeight: '800' }}>₹{parseFloat(credit.summary.credit_limit).toFixed(0)}</p>
                           </div>
                           <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>Currently Used</p>
                              <p style={{ margin: '0.2rem 0 0 0', fontSize: '1.2rem', color: 'white', fontWeight: '800' }}>₹{parseFloat(credit.summary.credit_used).toFixed(0)}</p>
                           </div>
                        </div>

                        {credit.summary.credit_status === 'Suspended' && (
                           <div style={{ padding: '0.8rem 1.2rem', background: 'rgba(231, 76, 60, 0.1)', borderRadius: '8px', borderLeft: '4px solid #e74c3c', marginBottom: '1.5rem' }}>
                              <p style={{ margin: 0, fontSize: '0.9rem', color: '#e74c3c', lineHeight: '1.5' }}>
                                 <strong>Account Suspended:</strong> Your credit account is temporarily blocked due to overdue payments. Suspension ends: <strong>{credit.summary.suspended_until}</strong>
                              </p>
                           </div>
                        )}

                        <h4 style={{ color: 'var(--text-highlight)', margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: '700' }}>Recent Credit Activity</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                           {credit?.recent_transactions?.map((txn, idx) => (
                              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 1rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--surface-border)', borderRadius: '6px', fontSize: '0.9rem' }}>
                                 <div>
                                    <span style={{ fontWeight: '800', color: txn.txn_type === 'Debit' ? '#e74c3c' : '#3fb950', marginRight: '10px' }}>
                                       {txn.txn_type === 'Debit' ? '−' : '+'} ₹{txn.amount}
                                    </span>
                                    <span style={{ color: 'var(--text-secondary)' }}>{txn.notes}</span>
                                 </div>
                                 <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{txn.date}</span>
                              </div>
                           ))}
                           {(!credit?.recent_transactions || credit.recent_transactions.length === 0) && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic', margin: 0 }}>No recent transactions.</p>}
                        </div>
                     </div>
                  )}

                  {/* Address Book Card */}
                  <AddressBook role="Customer" />

                  {/* Browser notification widget */}
                  <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--surface-border)', borderRadius: '12px' }}>
                    <h4 style={{ color: 'var(--text-highlight)', margin: '0 0 0.5rem 0', fontSize: '1.05rem', fontWeight: '700' }}>🔔 Browser Notifications</h4>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.2rem', marginTop: '0.2rem' }}>
                      Stay updated with live order status & quote matches. Status: <span style={{ color: pushStatus === 'Subscribed' ? 'var(--primary-color)' : 'var(--warning-color)', fontWeight: '700' }}>{pushStatus}</span>
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
                  <h3 style={{ color: 'var(--text-highlight)', margin: '0 0 0.5rem 0', fontWeight: '700' }}>Edit Personal Details</h3>
                  <div>
                    <label className="input-label" style={{ fontWeight: '600' }}>Full Name</label>
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
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
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
              )
            ) : (
              <p style={{ color: 'var(--text-secondary)' }}>Unable to load profile data.</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default CustomerProfile;
