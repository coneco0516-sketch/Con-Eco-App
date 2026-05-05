import React, { useState, useEffect } from 'react';
import VendorSidebar from '../components/VendorSidebar';

const API = import.meta.env.VITE_API_URL || '';

function Earnings() {
  const [earnings, setEarnings] = useState({ 
    total: 0, 
    total_net: 0, 
    online_total: 0, 
    cod_total: 0, 
    pending_online: 0, 
    pending_cod: 0, 
    breakdowns: [],
    rates: { product_commission_pct: 3.0, service_commission_pct: 3.0 }
  });
  const [loading, setLoading] = useState(true);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [bankDetails, setBankDetails] = useState({ accountName: '', accountNumber: '', ifsc: '' });

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = () => {
    setLoading(true);
    fetch(`${API}/api/vendor/earnings`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.stats) {
            setEarnings({ 
                total: data.stats.total || 0, 
                total_net: data.stats.total_net || 0,
                online_total: data.stats.online_total || 0,
                cod_total: data.stats.cod_total || 0,
                pending_online: data.stats.pending_online || 0,
                pending_cod: data.stats.pending_cod || 0,
                breakdowns: data.transactions || [],
                rates: data.rates || { product_commission_pct: 3.0, service_commission_pct: 3.0 }
            });
        } else if (data.status === 'success' && data.rates) {
            setEarnings(prev => ({ ...prev, rates: data.rates }));
        } else {
            console.warn('[Earnings API] Unexpected response shape - rates not updated');
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('[Earnings API] FAILED:', err);
        setLoading(false);
      });
  };

  const handleWithdrawClick = () => {
    if ((earnings.online_total || 0) <= 0) {
      alert("No online balance available to withdraw.");
      return;
    }
    setShowWithdrawModal(true);
  };

  const processWithdraw = async (e) => {
    e.preventDefault();
    try {
      const resp = await fetch(`${API}/api/vendor/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: earnings.online_total, account_number: bankDetails.accountNumber, ifsc: bankDetails.ifsc }),
        credentials: 'include'
      });
      const data = await resp.json();
      if (data.status === 'success') {
        alert(`Success! Withdrawal request for ₹${earnings.online_total} has been submitted to account ${bankDetails.accountNumber}.`);
        setShowWithdrawModal(false);
        setBankDetails({ accountName: '', accountNumber: '', ifsc: '' });
        fetchEarnings();
      } else {
        alert("Error: " + data.message);
      }
    } catch (err) {
      alert("Network error processing withdrawal.");
    }
  };

  return (
    <div className="dashboard-layout">
      <VendorSidebar />
      <main style={{ flex: 1 }}>
        <h2 style={{ fontSize: '2rem', color: 'var(--text-highlight)', marginTop: 0 }}>My Earnings</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Monitor your platform balance and request payouts.</p>
        
        <div style={{ padding: '0.82rem', background: 'rgba(255,215,0,0.05)', borderRadius: '8px', border: '1px solid rgba(255,215,0,0.2)', marginBottom: '1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: '#ffd700', fontWeight: 'bold' }}>Live Platform Rates:</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-highlight)' }}>Services: <strong style={{color: '#ffd700'}}>{earnings.rates.service_commission_pct}%</strong></span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-highlight)' }}>Products: <strong style={{color: '#ffd700'}}>{earnings.rates.product_commission_pct}%</strong></span>
          <button onClick={fetchEarnings} style={{ marginLeft: 'auto', background: 'transparent', border: '1px solid #ffd700', color: '#ffd700', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>Refresh Rates</button>
        </div>

        <hr style={{ borderColor: 'var(--surface-border)', marginBottom: '1.5rem' }} />
        
        {loading ? (
          <p>Loading earnings data...</p>
        ) : (
          <div className="glass-panel" style={{ padding: '2rem' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div>
                  <h3 style={{ margin: 0, color: 'var(--text-highlight)', marginBottom: '0.25rem' }}>Withdrawable Balance (Online): <strong style={{color: 'var(--primary-color)'}}>₹{earnings.online_total || 0}</strong></h3>
                  <p style={{ margin: '0 0 1rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Pending Admin Audit: ₹{earnings.pending_online || 0}</p>
                  
                  <h3 style={{ margin: 0, color: 'var(--text-highlight)', marginBottom: '0.25rem' }}>Collected Offline (COD): <strong style={{color: '#f59e0b'}}>₹{earnings.cod_total || 0}</strong></h3>
                  <p style={{ margin: '0 0 1rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Pending COD Collections: ₹{earnings.pending_cod || 0}</p>
                  
                  <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--surface-border)' }}>
                    <h4 style={{ margin: '0', color: 'var(--primary-color)', fontSize: '1.2rem' }}>Net Payout: ₹{earnings.total_net || 0}</h4>
                    <p style={{ margin: '0', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Total Gross Sales: ₹{earnings.total || 0}</p>
                  </div>
                </div>
                <button className="btn" onClick={handleWithdrawClick} style={{ background: '#238636' }}>Withdraw to Bank</button>
             </div>
              <h2 style={{ fontSize: '1.5rem', color: 'var(--text-highlight)', marginTop: '2.5rem' }}>Transaction History</h2>
              <hr style={{ borderColor: 'var(--surface-border)', marginBottom: '1.5rem' }} />
              
              {earnings.breakdowns && earnings.breakdowns.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: 'rgba(0,0,0,0.3)' }}>
                      <tr>
                        <th style={{ padding: '12px', borderBottom: '1px solid var(--surface-border)' }}>Date</th>
                        <th style={{ padding: '12px', borderBottom: '1px solid var(--surface-border)' }}>Details</th>
                        <th style={{ padding: '12px', borderBottom: '1px solid var(--surface-border)' }}>Gross</th>
                        <th style={{ padding: '12px', borderBottom: '1px solid var(--surface-border)' }}>GST (18%)</th>
                        <th style={{ padding: '12px', borderBottom: '1px solid var(--surface-border)' }}>Comm.</th>
                        <th style={{ padding: '12px', borderBottom: '1px solid var(--surface-border)' }}>Net</th>
                        <th style={{ padding: '12px', borderBottom: '1px solid var(--surface-border)' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {earnings.breakdowns.map((b, idx) => (
                        <tr key={idx} style={{ borderBottom: idx !== earnings.breakdowns.length - 1 ? '1px solid var(--surface-border)' : 'none' }}>
                          <td style={{ padding: '12px', fontSize: '0.85rem' }}>{b.date}</td>
                          <td style={{ padding: '12px', color: 'var(--text-highlight)' }}>{b.description}</td>
                          <td style={{ padding: '12px', color: 'var(--text-highlight)', fontWeight: 'bold' }}>₹{b.gross}</td>
                          <td style={{ padding: '12px', color: '#3498db' }}>₹{b.gst}</td>
                          <td style={{ padding: '12px', color: '#da3633' }}>
                             {b.commission > 0 ? `-₹${b.commission} (${b.commission_rate}%)` : '-'}
                          </td>
                          <td style={{ padding: '12px', color: b.net >= 0 ? '#3fb950' : '#da3633', fontWeight: 'bold' }}>
                            {b.net >= 0 ? '+' : ''}₹{b.net}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ 
                                background: b.status === 'Completed' || b.status === 'Paid' || b.status === 'Credited to Wallet' ? 'rgba(63, 185, 80, 0.15)' : 'rgba(212, 162, 11, 0.15)',
                                color: b.status === 'Completed' || b.status === 'Paid' || b.status === 'Credited to Wallet' ? '#3fb950' : '#d4a20b',
                                padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold'
                            }}>
                                {b.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ color: 'var(--text-secondary)' }}>No transactions recorded yet.</p>
              )}
          </div>
        )}
      </main>

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="glass-panel" style={{ padding: '2rem', width: '400px', maxWidth: '90%' }}>
            <h3 style={{ color: 'var(--text-highlight)', marginBottom: '1.5rem' }}>Withdraw Funds</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>You are requesting to withdraw ₹{earnings.online_total}. Please enter your bank details.</p>
            <form onSubmit={processWithdraw} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="input-label">Account Holder Name</label>
                <input type="text" className="input-field" required value={bankDetails.accountName} onChange={e => setBankDetails({...bankDetails, accountName: e.target.value})} />
              </div>
              <div>
                <label className="input-label">Account Number</label>
                <input type="password" className="input-field" required value={bankDetails.accountNumber} onChange={e => setBankDetails({...bankDetails, accountNumber: e.target.value})} />
              </div>
              <div>
                <label className="input-label">IFSC Code</label>
                <input type="text" className="input-field" required value={bankDetails.ifsc} onChange={e => setBankDetails({...bankDetails, ifsc: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn" style={{ flex: 1, background: 'rgba(255,255,255,0.1)' }} onClick={() => setShowWithdrawModal(false)}>Cancel</button>
                <button type="submit" className="btn" style={{ flex: 1, background: '#238636' }}>Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Earnings;
