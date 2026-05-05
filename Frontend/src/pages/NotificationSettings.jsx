import React, { useState, useEffect } from 'react';
import './NotificationSettings.css';

const API = import.meta.env.VITE_API_URL || '';

export default function NotificationSettings() {
  const [preferences, setPreferences] = useState({
    login_alerts: true,
    password_change_alerts: true,
    profile_update_alerts: true,
    product_update_alerts: true,
    order_alerts: true,
    qc_status_alerts: true
  });

  const [loginActivity, setLoginActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('preferences');

  useEffect(() => {
    fetchPreferences();
    fetchLoginActivity();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await fetch(`${API}/api/auth/notification-preferences`);
      const data = await response.json();
      if (data.status === 'success') {
        setPreferences(data.preferences);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLoginActivity = async () => {
    try {
      const response = await fetch(`${API}/api/auth/login-activity`);
      const data = await response.json();
      if (data.status === 'success') {
        setLoginActivity(data.activities || []);
      }
    } catch (error) {
      console.error('Error fetching login activity:', error);
    }
  };

  const handleToggle = (key) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${API}/api/auth/notification-preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferences)
      });

      const data = await response.json();
      if (data.status === 'success') {
        setMessage('✓ Notification preferences updated successfully');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Failed to update preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      setMessage('Error saving preferences');
    } finally {
      setSaving(false);
    }
  };

  const notificationSettings = [
    {
      key: 'login_alerts',
      title: 'Login Notifications',
      description: 'Get notified when your account is accessed',
      icon: '🔐'
    },
    {
      key: 'password_change_alerts',
      title: 'Password Change Alerts',
      description: 'Receive alerts when your password is changed',
      icon: '🔑'
    },
    {
      key: 'profile_update_alerts',
      title: 'Profile Updates',
      description: 'Get notified when your profile information changes',
      icon: '👤'
    },
    {
      key: 'product_update_alerts',
      title: 'Product/Service Updates',
      description: 'Notifications about your products and services',
      icon: '📦'
    },
    {
      key: 'order_alerts',
      title: 'Order & Booking Notifications',
      description: 'Updates about your orders and bookings',
      icon: '📋'
    },
    {
      key: 'qc_status_alerts',
      title: 'QC Verification Status',
      description: 'Alerts about verification status changes (Vendors)',
      icon: '✅'
    }
  ];

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div className="notification-settings-container">
      <div className="notification-settings-header">
        <h1>📧 Notification Settings</h1>
        <p>Manage your email notification preferences and view your login activity</p>
      </div>

      <div className="notification-tabs">
        <button
          className={`tab-btn ${activeTab === 'preferences' ? 'active' : ''}`}
          onClick={() => setActiveTab('preferences')}
        >
          Email Preferences
        </button>
        <button
          className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          Login Activity
        </button>
      </div>

      {activeTab === 'preferences' && (
        <div className="notification-settings-content">
          <div className="settings-section">
            <h2>Email Notification Preferences</h2>
            <p className="section-description">Choose which notifications you would like to receive via email</p>

            {loading ? (
              <div className="loading">Loading preferences...</div>
            ) : (
              <>
                <div className="notification-items">
                  {notificationSettings.map(setting => (
                    <div key={setting.key} className="notification-item">
                      <div className="notification-info">
                        <div className="notification-icon">{setting.icon}</div>
                        <div className="notification-text">
                          <h3>{setting.title}</h3>
                          <p>{setting.description}</p>
                        </div>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={preferences[setting.key]}
                          onChange={() => handleToggle(setting.key)}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                  ))}
                </div>

                <div className="settings-actions">
                  <button 
                    className="btn primary" 
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Preferences'}
                  </button>
                  {message && <p className="message">{message}</p>}
                </div>
              </>
            )}
          </div>

          <div className="settings-info">
            <div className="info-card">
              <h4>📨 Email Address</h4>
              <p>Notifications are sent to your registered email address. To change your email, update your profile.</p>
            </div>
            <div className="info-card">
              <h4>🔒 Your Privacy</h4>
              <p>We respect your privacy. You can manage your email preferences at any time, and we'll never share your email address with third parties.</p>
            </div>
            <div className="info-card">
              <h4>⚠️ Important</h4>
              <p>Security notifications (like password changes and new logins) may be sent regardless of your preferences to keep your account safe.</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="notification-settings-content">
          <div className="settings-section">
            <h2>Login Activity</h2>
            <p className="section-description">Recent login activity on your account</p>

            {loading ? (
              <div className="loading">Loading activity...</div>
            ) : loginActivity.length === 0 ? (
              <div className="no-activity">No login activity recorded</div>
            ) : (
              <div className="activity-table">
                <table>
                  <thead>
                    <tr>
                      <th>Date & Time</th>
                      <th>IP Address</th>
                      <th>Device/Browser</th>
                      <th>Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loginActivity.map((activity, index) => (
                      <tr key={index}>
                        <td className="activity-time">{formatDate(activity.login_at)}</td>
                        <td className="activity-ip">{activity.ip_address || 'Unknown'}</td>
                        <td className="activity-device">
                          {activity.user_agent ? activity.user_agent.substring(0, 60) + '...' : 'Unknown'}
                        </td>
                        <td className="activity-type">{activity.device_info || 'Web'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="activity-info-card">
              <h4>🔍 Security Tip</h4>
              <p>Regularly review your login activity. If you see any suspicious logins, change your password immediately.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
