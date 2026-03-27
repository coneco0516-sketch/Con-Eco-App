import React, { useState, useEffect } from 'react';
import VendorSidebar from '../components/VendorSidebar';

function Earnings() {
  const [earnings, setEarnings] = useState({ total: 0, online_total: 0, cod_total: 0, pending_online: 0, pending_cod: 0, breakdowns: [] });
  const [loading, setLoading] = useState(true);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [bankDetails, setBankDetails] = useState({ accountName: '', accountNumber: '', ifsc: '' });

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = () => {
    setLoading(true);
    fetch('/api/vendor/earnings', { credentials: 'include' })
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
                breakdowns: data.transactions 
            });
        }
        setLoading(false);
      })
      .catch(err => setLoading(false));
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
      const resp = await fetch('/api/vendor/withdraw', {
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
    <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
      <VendorSidebar />
      <main style={{ flex: 1 }}>
        <h2 style={{ fontSize: '2rem', color: 'white', marginTop: 0 }}>My Earnings</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Monitor your platform balance and request payouts.</p>
        <hr style={{ borderColor: 'var(--surface-border)', marginBottom: '1.5rem' }} />
        
        {loading ? (
          <p>Loading earnings data...</p>
        ) : (
          <div className="glass-panel" style={{ padding: '2rem' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div>
                  <h3 style={{ margin: 0, color: 'white', marginBottom: '0.25rem' }}>Withdrawable Balance (Online): <strong style={{color: 'var(--primary-color)'}}>₹{earnings.online_total || 0}</strong></h3>
                  <p style={{ margin: '0 0 1rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Pending Admin Audit: ₹{earnings.pending_online || 0}</p>
                  
                  <h3 style={{ margin: 0, color: 'white', marginBottom: '0.25rem' }}>Collected Offline (COD): <strong style={{color: '#f59e0b'}}>₹{earnings.cod_total || 0}</strong></h3>
                  <p style={{ margin: '0 0 1rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Pending COD Collections: ₹{earnings.pending_cod || 0}</p>
                  
                  <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--surface-border)' }}>
                    <h4 style={{ margin: '0', color: 'var(--primary-color)', fontSize: '1.2rem' }}>Net Payout: ₹{earnings.total_net || 0}</h4>
                    <p style={{ margin: '0', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Total Gross Sales: ₹{earnings.total || 0}</p>
                  </div>
                </div>
                <button className="btn" onClick={handleWithdrawClick} style={{ background: '#238636' }}>Withdraw to Bank</button>
             </div>
             {earnings.breakdowns && earnings.breakdowns.length > 0 ? (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {earnings.breakdowns.map((b, idx) => (
                    <li key={idx} style={{ padding: '1rem 0', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{b.description}</span>
                      <span style={{ color: b.amount >= 0 ? '#238636' : '#da3633', fontWeight: 'bold' }}>
                        {b.amount >= 0 ? '+' : ''}₹{b.amount}
                      </span>
                    </li>
                  ))}
                </ul>
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
            <h3 style={{ color: 'white', marginBottom: '1.5rem' }}>Withdraw Funds</h3>
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
