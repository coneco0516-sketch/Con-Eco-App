import React, { useEffect, useState } from 'react';
import AdminSidebar from '../components/AdminSidebar';

function AdminCommissions() {
  const [data, setData] = useState({ invoices: [], outstanding: 0, collected: 0 });
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchInvoices = () => {
    setLoading(true);
    fetch('/api/admin/weekly_invoices', { credentials: 'include' })
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
      const res = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include'
      });
      const result = await res.json();
      if (result.status === 'success') {
        setActionMessage(`✅ ${result.message}`);
        fetchInvoices(); // Refresh the list
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
    <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
      <AdminSidebar />
      <main style={{ flex: 1 }}>
        <h2 style={{ fontSize: '2rem', color: 'white', marginTop: 0, marginBottom: '0.5rem' }}>Platform Commissions</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Monitor and manage vendor weekly COD commission payments.</p>

        {actionMessage && (
          <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1.5rem', background: 'rgba(9, 105, 218, 0.15)', color: 'white' }}>
            {actionMessage}
          </div>
        )}

        {/* Stats Row */}
        <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="stat-card glass-panel" style={{ flex: 1, padding: '1.5rem' }}>
            <h3 style={{ color: 'var(--text-secondary)', fontSize: '1rem', margin: '0 0 0.5rem 0' }}>Outstanding Unpaid</h3>
            <div style={{ fontSize: '2rem', color: '#f85149', fontWeight: 'bold' }}>₹{data.outstanding.toFixed(2)}</div>
          </div>
          <div className="stat-card glass-panel" style={{ flex: 1, padding: '1.5rem' }}>
            <h3 style={{ color: 'var(--text-secondary)', fontSize: '1rem', margin: '0 0 0.5rem 0' }}>Total Collected</h3>
            <div style={{ fontSize: '2rem', color: '#3fb950', fontWeight: 'bold' }}>₹{data.collected.toFixed(2)}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ color: 'white', margin: '0 0 0.5rem 0' }}>Manual Controls</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
              These tasks run automatically via scheduler (Mon/Thu). Use only if manual override is needed.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              className="btn" 
              style={{ background: '#238636', opacity: isProcessing ? 0.7 : 1 }}
              onClick={() => handleManualTrigger('/api/admin/generate_weekly_invoices', 'Generate Weekly Invoices')}
              disabled={isProcessing}
            >
              Generate Invoices (Mon)
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

        {/* Invoices Table */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ color: 'white', margin: '0 0 1.5rem 0' }}>Weekly Invoices</h3>
          {loading ? (
            <p>Loading invoices...</p>
          ) : data.invoices.length === 0 ? (
            <p>No invoices found.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-secondary)' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--surface-border)' }}>
                  <th style={{ padding: '1rem' }}>Invoice ID</th>
                  <th style={{ padding: '1rem' }}>Vendor</th>
                  <th style={{ padding: '1rem' }}>Period</th>
                  <th style={{ padding: '1rem' }}>Amount</th>
                  <th style={{ padding: '1rem' }}>Due Date</th>
                  <th style={{ padding: '1rem' }}>Strikes</th>
                  <th style={{ padding: '1rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.invoices.map(inv => (
                  <tr key={inv.invoice_id} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                    <td style={{ padding: '1rem', color: 'white' }}>#{inv.invoice_id}</td>
                    <td style={{ padding: '1rem' }}>
                      <strong style={{ color: 'white' }}>{inv.company_name}</strong><br/>
                      <span style={{ fontSize: '0.8rem' }}>{inv.vendor_name}</span>
                    </td>
                    <td style={{ padding: '1rem' }}>{inv.period_start} - {inv.period_end}</td>
                    <td style={{ padding: '1rem', color: 'white', fontWeight: 'bold' }}>₹{inv.amount}</td>
                    <td style={{ padding: '1rem' }}>{inv.due_date}</td>
                    <td style={{ padding: '1rem' }}>
                      {inv.commission_strikes > 0 ? (
                         <span style={{ color: '#f85149', fontWeight: 'bold' }}>{inv.commission_strikes}</span>
                      ) : '-'}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {inv.is_blocked ? (
                        <span style={{ color: '#f85149', fontWeight: 'bold' }}>Blocked</span>
                      ) : (
                        <span style={{ 
                          padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem',
                          background: inv.status === 'Paid' ? 'rgba(46, 160, 67, 0.2)' : 'rgba(231, 76, 60, 0.2)',
                          color: inv.status === 'Paid' ? '#3fb950' : '#f85149'
                        }}>
                          {inv.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}

export default AdminCommissions;
