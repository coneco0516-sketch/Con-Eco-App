import React, { useState, useEffect } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'https://con-eco-app-w78g.onrender.com';

function PlatformSettings() {
  const [settings, setSettings] = useState({
    enable_vendor_registration: true,
    enable_customer_registration: true,
    auto_vendor_approval: false,
    service_commission_pct: 3.0,
    product_commission_pct: 3.0,
    allow_cod: true,
    enable_order_cancellation: true,
    auto_order_confirmation: false,
    email_notifications: true,
    push_notifications: false,
    server_maintenance_mode: false,
    default_credit_limit: 5000,
    enable_pay_later: true
  });
  
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const resp = await fetch(`${API}/api/admin/platform_settings`, { credentials: 'include' });
      const data = await resp.json();
      if (data.status === 'success') {
        // Merge defaults with DB values if they exist
        setSettings(prev => ({ ...prev, ...data.settings }));
      } else if (data.detail === 'not_logged_in') {
        navigate('/login');
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) : value)
    }));
  };

  const handleSave = async () => {
    setMsg('Saving changes...');
    try {
      const resp = await fetch(`${API}/api/admin/platform_settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
        credentials: 'include'
      });
      const data = await resp.json();
      if (data.status === 'success') {
        setMsg('Settings saved successfully!');
        // Keep message visible for 3 seconds
        setTimeout(() => setMsg(''), 3000);
      } else {
        setMsg('Failed to save: ' + (data.message || 'Unknown error'));
      }
    } catch (err) {
      setMsg('Network error occurred.');
    }
  };

  if (loading) {
    return (
      <div className="dashboard-layout">
        <AdminSidebar />
        <main style={{ flex: 1 }}>
          <h2 style={{ color: 'var(--text-highlight)' }}>Loading Platform Settings...</h2>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <AdminSidebar />
      <main style={{ flex: 1, paddingBottom: '3rem' }}>
        <h2 style={{ fontSize: '2rem', color: 'var(--text-highlight)', marginTop: 0 }}>Platform Settings</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Configure marketplace preferences, commissions, and system-wide controls.</p>
        
        {msg && (
          <div className="glass-panel" style={{ padding: '0.8rem 1.2rem', marginBottom: '1.5rem', borderLeft: '4px solid var(--primary-color)' }}>
            <p style={{ color: 'var(--primary-color)', margin: 0, fontWeight: 'bold' }}>{msg}</p>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
          
          {/* User & Vendor Control */}
          <section className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ color: 'var(--text-highlight)', borderBottom: '1px solid var(--surface-border)', paddingBottom: '0.5rem', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🔐</span> User & Vendor Control
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ color: 'var(--text-secondary)' }}>Enable Vendor Registration</label>
                <input type="checkbox" name="enable_vendor_registration" checked={settings.enable_vendor_registration} onChange={handleChange} style={{ transform: 'scale(1.2)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ color: 'var(--text-secondary)' }}>Enable Customer Registration</label>
                <input type="checkbox" name="enable_customer_registration" checked={settings.enable_customer_registration} onChange={handleChange} style={{ transform: 'scale(1.2)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ color: 'var(--text-secondary)' }}>Auto Vendor Approval</label>
                <input type="checkbox" name="auto_vendor_approval" checked={settings.auto_vendor_approval} onChange={handleChange} style={{ transform: 'scale(1.2)' }} />
              </div>
            </div>
          </section>

          {/* Commission Settings */}
          <section className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ color: 'var(--text-highlight)', borderBottom: '1px solid var(--surface-border)', paddingBottom: '0.5rem', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>💰</span> Commission Settings
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <label className="input-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Service Commission (%)</label>
                <input type="number" name="service_commission_pct" value={settings.service_commission_pct} onChange={handleChange} className="input-field" />
              </div>
              <div>
                <label className="input-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Product Commission (%)</label>
                <input type="number" name="product_commission_pct" value={settings.product_commission_pct} onChange={handleChange} className="input-field" />
              </div>
            </div>
          </section>

          {/* Order & Credit Settings */}
          <section className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ color: 'var(--text-highlight)', borderBottom: '1px solid var(--surface-border)', paddingBottom: '0.5rem', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>📦</span> Order & Credit Settings
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ color: 'var(--text-secondary)' }}>Allow COD (Cash on Delivery)</label>
                <input type="checkbox" name="allow_cod" checked={settings.allow_cod} onChange={handleChange} style={{ transform: 'scale(1.2)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ color: 'var(--text-secondary)' }}>Enable Order Cancellation</label>
                <input type="checkbox" name="enable_order_cancellation" checked={settings.enable_order_cancellation} onChange={handleChange} style={{ transform: 'scale(1.2)' }} />
              </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <label style={{ color: 'var(--text-secondary)' }}>Enable Pay Later (Credit System)</label>
                  <input type="checkbox" name="enable_pay_later" checked={settings.enable_pay_later} onChange={handleChange} style={{ transform: 'scale(1.2)' }} />
                </div>
                <div style={{ marginTop: '0.5rem', borderTop: '1px solid var(--surface-border)', paddingTop: '0.5rem' }}>
                  <label className="input-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Default Credit Limit (₹)</label>
                  <input type="number" name="default_credit_limit" value={settings.default_credit_limit} onChange={handleChange} className="input-field" placeholder="e.g. 5000" />
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
                    Default limit for verified customers. Can be overridden per-customer.
                  </p>
                </div>
            </div>
          </section>

          {/* Notifications */}
          <section className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ color: 'var(--text-highlight)', borderBottom: '1px solid var(--surface-border)', paddingBottom: '0.5rem', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🔔</span> Notifications
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ color: 'var(--text-secondary)' }}>Email Notifications</label>
                <input type="checkbox" name="email_notifications" checked={settings.email_notifications} onChange={handleChange} style={{ transform: 'scale(1.2)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ color: 'var(--text-secondary)' }}>Push Notifications (Browser)</label>
                <input type="checkbox" name="push_notifications" checked={settings.push_notifications} onChange={handleChange} style={{ transform: 'scale(1.2)' }} />
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic', padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                Push Notifications allow real-time browser alerts even when the app is closed.
              </div>
            </div>
          </section>

          {/* Server Control */}
          <section className="glass-panel" style={{ padding: '1.5rem', border: settings.server_maintenance_mode ? '1px solid var(--danger-color)' : '1px solid var(--surface-border)' }}>
            <h3 style={{ color: 'var(--text-highlight)', borderBottom: '1px solid var(--surface-border)', paddingBottom: '0.5rem', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🖥️</span> Server Control
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <label style={{ color: 'var(--text-secondary)', display: 'block' }}>Maintenance Mode (Server Off)</label>
                  <span style={{ fontSize: '0.8rem', color: settings.server_maintenance_mode ? 'var(--danger-color)' : 'var(--text-secondary)' }}>
                    {settings.server_maintenance_mode ? 'CRITICAL: Site is locked for users!' : 'Website is currently live.'}
                  </span>
                </div>
                <input type="checkbox" name="server_maintenance_mode" checked={settings.server_maintenance_mode} onChange={handleChange} style={{ transform: 'scale(1.2)' }} />
              </div>
            </div>
          </section>
        </div>

        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={handleSave} className="btn" style={{ padding: '1rem 3rem', fontSize: '1.1rem' }}>
            Save All Platform Changes
          </button>
        </div>
      </main>
    </div>
  );
}

export default PlatformSettings;
