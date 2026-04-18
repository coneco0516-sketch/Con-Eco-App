import React, { useEffect, useState } from 'react';
import AdminSidebar from '../components/AdminSidebar';

const API = process.env.REACT_APP_API_URL || '';

function AdminCommissions() {
  const [data, setData] = useState({ invoices: [], outstanding: 0, collected: 0 });
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const [settings, setSettings] = useState({ 
    product_commission_pct: 3.0,
    service_commission_pct: 3.0
  });

  const fetchInvoices = () => {
    setLoading(true);
    // Fetch settings first
    fetch(`${API}/api/admin/platform_settings`, { credentials: 'include' })
      .then(res => res.json())
      .then(sData => {
        if (sData.status === 'success') setSettings(prev => ({ ...prev, ...sData.settings }));
        
        return fetch(`${API}/api/admin/weekly_invoices`, { credentials: 'include' });
      })
      .then(res => res.json())
      .then(result => {
        if (result.status === 'success') {
          setData(result);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleManualTrigger = async (endpoint, successMessage) => {
    if (!window.confirm(`Are you sure you want to run ${successMessage}? This is usually automated.`)) return;

    setIsProcessing(true);
    setActionMessage('');
    try {
      const res = await fetch(endpoint, { method: 'POST', credentials: 'include' });
      const result = await res.json();
      if (result.status === 'success') {
        setActionMessage(`✅ ${result.message}`);
        fetchInvoices();
      } else {
        setActionMessage(`❌ Error: ${result.detail || 'Unknown error'}`);
      }
    } catch (err) {
      setActionMessage(`❌ Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <AdminSidebar />
      <main style={{ flex: 1 }}>
        <h2 style={{ fontSize: '2rem', color: 'var(--text-highlight)', marginTop: 0, marginBottom: '0.5rem' }}>
          Platform Commissions
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Monitor vendor weekly commission payments (Product: {settings.product_commission_pct}%, Service: {settings.service_commission_pct}%).
        </p>

        {actionMessage && (
          <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1.5rem', background: 'rgba(9, 105, 218, 0.15)', color: 'var(--text-highlight)' }}>
            {actionMessage}
          </div>
        )}

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 0.4rem 0' }}>Outstanding Commission</p>
            <div style={{ fontSize: '1.6rem', color: '#f85149', fontWeight: 'bold' }}>₹{data.outstanding.toFixed(2)}</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', margin: '4px 0 0 0' }}>Awaiting vendor payments</p>
          </div>
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 0.4rem 0' }}>Collected Commission</p>
            <div style={{ fontSize: '1.6rem', color: '#3fb950', fontWeight: 'bold' }}>₹{data.collected.toFixed(2)}</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', margin: '4px 0 0 0' }}>Successfully received</p>
          </div>
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 0.4rem 0' }}>Active Billings</p>
            <div style={{ fontSize: '1.6rem', color: 'var(--text-highlight)', fontWeight: 'bold' }}>{data.invoices.length}</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', margin: '4px 0 0 0' }}>Total billing cycles</p>
          </div>
        </div>

        {/* Manual Controls */}
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ color: 'var(--text-highlight)', margin: '0 0 0.5rem 0' }}>Manual Controls</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
              These tasks run automatically. Use only if a manual override is needed.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              className="btn"
              style={{ background: '#238636', opacity: isProcessing ? 0.7 : 1 }}
              onClick={() => handleManualTrigger('/api/admin/generate_weekly_invoices', 'Generate Weekly Billings')}
              disabled={isProcessing}
            >
              Generate Billings (Mon)
            </button>
            <button
              className="btn"
              style={{ background: '#da3633', opacity: isProcessing ? 0.7 : 1 }}
              onClick={() => handleManualTrigger('/api/admin/enforce_commission_penalties', 'Enforce Penalties')}
              disabled={isProcessing}
            >
              Enforce Penalties (Thu)
            </button>
          </div>
        </div>

        {/* Billings Table */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ color: 'var(--text-highlight)', margin: 0 }}>Weekly Commission Billings</h3>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
              {settings.product_commission_pct}% Platform Fee on Offline Sales
            </span>
          </div>

          {loading ? (
            <p style={{ color: 'var(--text-secondary)' }}>Loading billings...</p>
          ) : data.invoices.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>No records found.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-secondary)', minWidth: '800px' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--surface-border)' }}>
                    <th style={{ padding: '1rem' }}>#</th>
                    <th style={{ padding: '1rem' }}>Vendor</th>
                    <th style={{ padding: '1rem' }}>Period</th>
                    <th style={{ padding: '1rem' }}>Commission Amount</th>
                    <th style={{ padding: '1rem' }}>Due Date</th>
                    <th style={{ padding: '1rem' }}>Strikes</th>
                    <th style={{ padding: '1rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.invoices.map(inv => (
                    <tr key={inv.invoice_id} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                      <td style={{ padding: '1rem', color: 'var(--text-highlight)' }}>#{inv.invoice_id}</td>
                      <td style={{ padding: '1rem' }}>
                        <strong style={{ color: 'var(--text-highlight)' }}>{inv.company_name}</strong><br />
                        <span style={{ fontSize: '0.8rem' }}>{inv.vendor_name}</span>
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.85rem' }}>
                        {inv.period_start} –<br />{inv.period_end}
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--primary-color)', fontWeight: 'bold', fontSize: '1rem' }}>
                        ₹{(parseFloat(inv.amount) || 0).toFixed(2)}
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.85rem' }}>{inv.due_date}</td>
                      <td style={{ padding: '1rem' }}>
                        {inv.commission_strikes > 0 ? (
                          <span style={{ color: '#f85149', fontWeight: 'bold' }}>{inv.commission_strikes} ⚠</span>
                        ) : (
                          <span style={{ color: '#3fb950' }}>0</span>
                        )}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {inv.is_blocked ? (
                          <span style={{ color: '#f85149', fontWeight: 'bold' }}>🚫 Blocked</span>
                        ) : (
                          <span style={{
                            padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem',
                            background: inv.status === 'Paid' ? 'rgba(46, 160, 67, 0.2)' : 'rgba(231, 76, 60, 0.2)',
                            color: inv.status === 'Paid' ? '#3fb950' : '#f85149'
                          }}>
                            {inv.status === 'Paid' ? '✅ Paid' : '❌ Unpaid'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div style={{
          marginTop: '1.5rem', padding: '1.25rem', borderRadius: '8px',
          border: '1px solid rgba(52, 152, 219, 0.3)', background: 'rgba(52, 152, 219, 0.05)'
        }}>
          <p style={{ color: '#3498db', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>ℹ Platform Fee Note</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0, lineHeight: '1.6' }}>
            The platform charges commission on all sales: <strong style={{ color: 'var(--text-highlight)' }}>{settings.product_commission_pct}% for Products</strong> and <strong style={{ color: 'var(--text-highlight)' }}>{settings.service_commission_pct}% for Services</strong>. 
            Vendors are billed weekly and must pay within 3 days. Accumulating 2 unpaid billings will result in an automatic account suspension.
          </p>
        </div>
      </main>
    </div>
  );
}

export default AdminCommissions;
