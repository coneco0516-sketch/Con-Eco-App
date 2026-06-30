import React, { useState, useEffect } from 'react';
import VendorSidebar from '../components/VendorSidebar';

const API = import.meta.env.VITE_API_URL || 'https://api.coneco.store';

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
      <main style={{ flex: 1, padding: '2rem', minWidth: 0 }}>
        
        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '2rem', color: 'var(--text-highlight)', margin: 0, fontWeight: '800' }}>My Earnings</h2>
            <p style={{ color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>Monitor your platform balance and request payouts.</p>
          </div>
          <button 
            className="btn" 
            onClick={handleWithdrawClick} 
            style={{ background: '#238636', fontWeight: '700', padding: '0.8rem 1.6rem', borderRadius: '8px' }}
          >
            Withdraw to Bank 🏦
          </button>
        </div>

        {/* Live Platform Rates Info Bar */}
        <div style={{ 
          padding: '0.8rem 1.2rem', 
          background: 'rgba(255,215,0,0.03)', 
          borderRadius: '8px', 
          borderLeft: '4px solid #ffd700',
          borderTop: '1px solid rgba(255,215,0,0.1)',
          borderRight: '1px solid rgba(255,215,0,0.1)',
          borderBottom: '1px solid rgba(255,215,0,0.1)',
          marginBottom: '2rem', 
          display: 'flex', 
          gap: '1.5rem', 
          alignItems: 'center',
          flexWrap: 'wrap',
          fontSize: '0.88rem'
        }}>
          <span style={{ color: '#ffd700', fontWeight: 'bold' }}>Live Platform Rates:</span>
          <span style={{ color: 'var(--text-highlight)' }}>Services Commission: <strong style={{color: '#ffd700'}}>{earnings.rates.service_commission_pct}%</strong></span>
          <span style={{ color: 'var(--text-highlight)' }}>Products Commission: <strong style={{color: '#ffd700'}}>{earnings.rates.product_commission_pct}%</strong></span>
          <button onClick={fetchEarnings} style={{ marginLeft: 'auto', background: 'transparent', border: '1px solid #ffd700', color: '#ffd700', padding: '3px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '700' }}>Refresh Rates 🔄</button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
              {[1, 2, 3, 4].map(i => <div key={i} className="skeleton-pulse" style={{ height: '140px', borderRadius: '12px' }}></div>)}
            </div>
            <div className="glass-panel" style={{ padding: '2rem', borderRadius: '16px' }}>
              <div className="skeleton-pulse" style={{ height: '40px', marginBottom: '1rem', borderRadius: '6px' }}></div>
              <div className="skeleton-pulse" style={{ height: '150px', borderRadius: '8px' }}></div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            
            {/* KPI Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
              
              {/* Online Withdrawable */}
              <div className="glass-panel interactive-card" style={{ padding: '1.5rem', borderRadius: '12px', borderLeft: '4px solid var(--primary-color)' }}>
                <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '0.5rem' }}>💰</span>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>Withdrawable (Online)</div>
                <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--primary-color)', margin: '0.3rem 0' }}>₹{earnings.online_total || 0}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Audit pending: ₹{earnings.pending_online || 0}</div>
              </div>

              {/* COD / Offline */}
              <div className="glass-panel interactive-card" style={{ padding: '1.5rem', borderRadius: '12px', borderLeft: '4px solid #f59e0b' }}>
                <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '0.5rem' }}>🤝</span>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>Collected Offline</div>
                <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#f59e0b', margin: '0.3rem 0' }}>₹{earnings.cod_total || 0}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Unpaid COD: ₹{earnings.pending_cod || 0}</div>
              </div>

              {/* Net Payout */}
              <div className="glass-panel interactive-card" style={{ padding: '1.5rem', borderRadius: '12px', borderLeft: '4px solid #3498db' }}>
                <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '0.5rem' }}>📈</span>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>Net Earnings Payout</div>
                <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#3498db', margin: '0.3rem 0' }}>₹{earnings.total_net || 0}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Commission/GST deducted</div>
              </div>

              {/* Total Gross */}
              <div className="glass-panel interactive-card" style={{ padding: '1.5rem', borderRadius: '12px', borderLeft: '4px solid var(--text-highlight)' }}>
                <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '0.5rem' }}>📊</span>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>Total Gross Sales</div>
                <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-highlight)', margin: '0.3rem 0' }}>₹{earnings.total || 0}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>All orders combined</div>
              </div>

            </div>

            {/* Transactions Section */}
            <div>
              <h3 style={{ fontSize: '1.4rem', color: 'var(--text-highlight)', margin: '0 0 1rem 0', fontWeight: '700' }}>Transaction History</h3>
              
              {earnings.breakdowns && earnings.breakdowns.length > 0 ? (
                <div className="table-responsive" style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--surface-border)' }}>
                        <th style={{ padding: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Date</th>
                        <th style={{ padding: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Details</th>
                        <th style={{ padding: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Gross</th>
                        <th style={{ padding: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>GST (18%)</th>
                        <th style={{ padding: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Comm.</th>
                        <th style={{ padding: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Net</th>
                        <th style={{ padding: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {earnings.breakdowns.map((b, idx) => (
                        <tr key={idx} style={{ borderBottom: idx !== earnings.breakdowns.length - 1 ? '1px solid var(--surface-border)' : 'none', transition: 'background 0.2s ease' }} onMouseOver={(e)=>e.currentTarget.style.background='rgba(255,255,255,0.01)'} onMouseOut={(e)=>e.currentTarget.style.background='transparent'}>
                          <td style={{ padding: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{b.date}</td>
                          <td style={{ padding: '16px', color: 'var(--text-highlight)', fontWeight: '600' }}>{b.description}</td>
                          <td style={{ padding: '16px', color: 'var(--text-highlight)', fontWeight: '700' }}>₹{b.gross}</td>
                          <td style={{ padding: '16px', color: '#3498db', fontWeight: '600' }}>₹{b.gst}</td>
                          <td style={{ padding: '16px', color: '#f85149', fontWeight: '600' }}>
                             {b.commission > 0 ? `-₹${b.commission} (${b.commission_rate}%)` : '-'}
                          </td>
                          <td style={{ padding: '16px', color: b.net >= 0 ? '#3fb950' : '#f85149', fontWeight: '700' }}>
                            {b.net >= 0 ? '+' : ''}₹{b.net}
                          </td>
                          <td style={{ padding: '16px' }}>
                            <span style={{ 
                                background: b.status === 'Completed' || b.status === 'Paid' || b.status === 'Credited to Wallet' ? 'rgba(63, 185, 80, 0.12)' : 'rgba(212, 162, 11, 0.12)',
                                color: b.status === 'Completed' || b.status === 'Paid' || b.status === 'Credited to Wallet' ? '#3fb950' : '#d4a20b',
                                border: `1px solid ${b.status === 'Completed' || b.status === 'Paid' || b.status === 'Credited to Wallet' ? 'rgba(63, 185, 80, 0.25)' : 'rgba(212, 162, 11, 0.25)'}`,
                                padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px'
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
                <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center', borderRadius: '16px' }}>
                  <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🧾</span>
                  <h4 style={{ color: 'var(--text-highlight)', margin: '0 0 0.5rem 0', fontSize: '1.15rem' }}>No Transactions Recorded</h4>
                  <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Earnings history will populate automatically once orders are dispatched/completed.</p>
                </div>
              )}
            </div>

          </div>
        )}
      </main>

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000,
          backdropFilter: 'blur(8px)'
        }}>
          <div className="glass-panel" style={{ padding: '2.5rem', width: '420px', maxWidth: '90%', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h3 style={{ color: 'var(--text-highlight)', marginBottom: '0.8rem', marginTop: 0, fontWeight: '800' }}>Withdraw Funds 🏛️</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.8rem', fontSize: '0.92rem', lineHeight: '1.5' }}>
              You are requesting to transfer <strong>₹{earnings.online_total}</strong> to your registered bank account. Please provide bank info details below:
            </p>
            <form onSubmit={processWithdraw} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <label className="input-label" style={{ fontWeight: '600' }}>Account Holder Name</label>
                <input 
                  type="text" 
                  className="input-field" 
                  required 
                  value={bankDetails.accountName} 
                  onChange={e => setBankDetails({...bankDetails, accountName: e.target.value})} 
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--surface-border)', color: 'var(--text-highlight)', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label className="input-label" style={{ fontWeight: '600' }}>Account Number</label>
                <input 
                  type="password" 
                  className="input-field" 
                  required 
                  value={bankDetails.accountNumber} 
                  onChange={e => setBankDetails({...bankDetails, accountNumber: e.target.value})} 
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--surface-border)', color: 'var(--text-highlight)', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label className="input-label" style={{ fontWeight: '600' }}>IFSC Code</label>
                <input 
                  type="text" 
                  className="input-field" 
                  required 
                  value={bankDetails.ifsc} 
                  onChange={e => setBankDetails({...bankDetails, ifsc: e.target.value})} 
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--surface-border)', color: 'var(--text-highlight)', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn" style={{ flex: 1, background: 'rgba(255,255,255,0.08)', fontWeight: '600' }} onClick={() => setShowWithdrawModal(false)}>Cancel</button>
                <button type="submit" className="btn" style={{ flex: 1, background: '#238636', fontWeight: '700' }}>Submit 🏦</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Earnings;
