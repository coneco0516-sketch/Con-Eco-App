import React, { useEffect, useState } from 'react';
import AdminSidebar from '../components/AdminSidebar';

const GST_RATE = 0.18; // 18% GST

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

  // Calculate totals with 18% GST
  const calcGST = (amount) => {
    const base = parseFloat(amount) || 0;
    const gst  = +(base * GST_RATE).toFixed(2);
    return { base, gst, total: +(base + gst).toFixed(2) };
  };

  // Aggregate GST totals
  const totalOutstandingWithGST  = +(data.outstanding  * (1 + GST_RATE)).toFixed(2);
  const totalCollectedWithGST    = +(data.collected    * (1 + GST_RATE)).toFixed(2);
  const totalGSTOutstanding      = +(data.outstanding  * GST_RATE).toFixed(2);
  const totalGSTCollected        = +(data.collected    * GST_RATE).toFixed(2);

  return (
    <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
      <AdminSidebar />
      <main style={{ flex: 1 }}>
        <h2 style={{ fontSize: '2rem', color: 'white', marginTop: 0, marginBottom: '0.5rem' }}>
          Platform Commissions &amp; GST
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Monitor vendor weekly COD commission payments and 18% GST collection.
          All vendors are GST-registered and can claim ITC on paid invoices.
        </p>

        {actionMessage && (
          <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1.5rem', background: 'rgba(9, 105, 218, 0.15)', color: 'white' }}>
            {actionMessage}
          </div>
        )}

        {/* Stats Row — 4 cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 0.4rem 0' }}>Outstanding Commission</p>
            <div style={{ fontSize: '1.6rem', color: '#f85149', fontWeight: 'bold' }}>₹{data.outstanding.toFixed(2)}</div>
            <p style={{ color: 'rgba(248,81,73,0.6)', fontSize: '0.75rem', margin: '4px 0 0 0' }}>
              +GST: ₹{totalGSTOutstanding.toFixed(2)}
            </p>
          </div>
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 0.4rem 0' }}>Outstanding (incl. GST)</p>
            <div style={{ fontSize: '1.6rem', color: '#e67e22', fontWeight: 'bold' }}>₹{totalOutstandingWithGST.toFixed(2)}</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', margin: '4px 0 0 0' }}>Total vendor liability</p>
          </div>
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 0.4rem 0' }}>Collected Commission</p>
            <div style={{ fontSize: '1.6rem', color: '#3fb950', fontWeight: 'bold' }}>₹{data.collected.toFixed(2)}</div>
            <p style={{ color: 'rgba(63,185,80,0.6)', fontSize: '0.75rem', margin: '4px 0 0 0' }}>
              GST collected: ₹{totalGSTCollected.toFixed(2)}
            </p>
          </div>
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 0.4rem 0' }}>Collected (incl. GST)</p>
            <div style={{ fontSize: '1.6rem', color: '#2ea043', fontWeight: 'bold' }}>₹{totalCollectedWithGST.toFixed(2)}</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', margin: '4px 0 0 0' }}>Total received from vendors</p>
          </div>
        </div>

        {/* Manual Controls */}
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ color: 'white', margin: '0 0 0.5rem 0' }}>Manual Controls</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
              These tasks run automatically via scheduler (Mon/Thu). Use only if a manual override is needed.
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ color: 'white', margin: 0 }}>Weekly Commission Invoices</h3>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
              3% Commission + 18% GST | Vendors can claim ITC on paid invoices
            </span>
          </div>

          {loading ? (
            <p style={{ color: 'var(--text-secondary)' }}>Loading invoices...</p>
          ) : data.invoices.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>No invoices found.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-secondary)', minWidth: '800px' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--surface-border)' }}>
                    <th style={{ padding: '1rem' }}>#</th>
                    <th style={{ padding: '1rem' }}>Vendor</th>
                    <th style={{ padding: '1rem' }}>Period</th>
                    <th style={{ padding: '1rem' }}>Commission</th>
                    <th style={{ padding: '1rem', color: '#f1c40f' }}>GST (18%)</th>
                    <th style={{ padding: '1rem' }}>Total Due</th>
                    <th style={{ padding: '1rem' }}>Due Date</th>
                    <th style={{ padding: '1rem' }}>Strikes</th>
                    <th style={{ padding: '1rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.invoices.map(inv => {
                    const gstCalc = calcGST(inv.amount);
                    return (
                      <tr key={inv.invoice_id} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                        <td style={{ padding: '1rem', color: 'white' }}>#{inv.invoice_id}</td>
                        <td style={{ padding: '1rem' }}>
                          <strong style={{ color: 'white' }}>{inv.company_name}</strong><br />
                          <span style={{ fontSize: '0.8rem' }}>{inv.vendor_name}</span>
                        </td>
                        <td style={{ padding: '1rem', fontSize: '0.85rem' }}>
                          {inv.period_start} –<br />{inv.period_end}
                        </td>
                        <td style={{ padding: '1rem', color: 'white', fontWeight: 'bold' }}>
                          ₹{gstCalc.base.toFixed(2)}
                        </td>
                        <td style={{ padding: '1rem', color: '#f1c40f', fontWeight: 'bold' }}>
                          ₹{gstCalc.gst.toFixed(2)}
                        </td>
                        <td style={{ padding: '1rem', color: 'var(--primary-color)', fontWeight: 'bold', fontSize: '1rem' }}>
                          ₹{gstCalc.total.toFixed(2)}
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* GST Info Box */}
        <div style={{
          marginTop: '1.5rem', padding: '1.25rem', borderRadius: '8px',
          border: '1px solid rgba(52, 152, 219, 0.3)', background: 'rgba(52, 152, 219, 0.05)'
        }}>
          <p style={{ color: '#3498db', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>🧾 GST Note</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0, lineHeight: '1.6' }}>
            Platform charges <strong style={{ color: 'white' }}>3% commission</strong> on all COD order amounts.
            <strong style={{ color: '#f1c40f' }}> 18% GST</strong> (SAC 998314 — Online Marketplace Services) is applicable
            on this commission under Indian GST law. All vendors are required to be GST-registered and can claim
            <strong style={{ color: 'white' }}> Input Tax Credit (ITC)</strong> on the GST paid to ConEco by downloading
            the GST Tax Invoice from their billing page after payment.
          </p>
        </div>
      </main>
    </div>
  );
}

export default AdminCommissions;
