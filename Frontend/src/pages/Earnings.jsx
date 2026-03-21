import React, { useState, useEffect } from 'react';
import VendorSidebar from '../components/VendorSidebar';

function Earnings() {
  const [earnings, setEarnings] = useState({ total: 0, breakdowns: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/vendor/earnings', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.earnings) setEarnings(data.earnings);
        setLoading(false);
      })
      .catch(err => setLoading(false));
  }, []);

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
             <h3 style={{ marginBottom: '1rem', color: 'white' }}>Current Balance: <strong style={{color: 'var(--primary-color)'}}>₹{earnings.total}</strong></h3>
             {earnings.breakdowns && earnings.breakdowns.length > 0 ? (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {earnings.breakdowns.map((b, idx) => (
                    <li key={idx} style={{ padding: '1rem 0', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{b.description}</span>
                      <span style={{ color: '#238636', fontWeight: 'bold' }}>+₹{b.amount}</span>
                    </li>
                  ))}
                </ul>
             ) : (
                <p style={{ color: 'var(--text-secondary)' }}>No transactions recorded yet.</p>
             )}
          </div>
        )}
      </main>
    </div>
  );
}

export default Earnings;
