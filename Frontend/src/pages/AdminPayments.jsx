import React, { useEffect, useState } from 'react';
import AdminSidebar from '../components/AdminSidebar';

function AdminPayments() {
  const [stats, setStats] = useState({ total_revenue: 0, pending: 0, completed: 0 });
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    fetch('/api/admin/payments', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setStats(data.stats);
          setTransactions(data.transactions || []);
        }
      })
      .catch(err => console.error("Error loading payments:", err));
  }, []);

  const handleCreditVendor = async (orderId) => {
    try {
      const resp = await fetch('/api/admin/payments/credit_vendor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId }),
        credentials: 'include'
      });
      const data = await resp.json();
      if (data.status === 'success') {
        alert(data.message);
        window.location.reload();
      } else {
        alert("Error: " + data.message);
      }
    } catch (err) {
      console.error("Credit fail:", err);
      alert("Network error.");
    }
  };

  return (
    <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
      <AdminSidebar />
      <main style={{ flex: 1 }}>
        <h2 style={{ fontSize: '2rem', color: 'white', marginTop: 0 }}>Payments Overview</h2>
        <hr style={{ borderColor: 'var(--surface-border)', marginBottom: '1.5rem' }} />

        {/* SUMMARY CARDS */}
        <section style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
          <div className="stat-card glass-panel" style={{ flex: 1 }}>
            <h3 style={{ color: 'white' }}>Total Revenue</h3>
            <p className="stat-value">₹{stats.total_revenue}</p>
          </div>
          <div className="stat-card glass-panel" style={{ flex: 1 }}>
            <h3 style={{ color: 'white' }}>Pending Payments</h3>
            <p className="stat-value" style={{ color: '#d4a20b', WebkitTextFillColor: '#d4a20b' }}>₹{stats.pending}</p>
          </div>
          <div className="stat-card glass-panel" style={{ flex: 1 }}>
            <h3 style={{ color: 'white' }}>Completed Transactions</h3>
            <p className="stat-value">{stats.completed}</p>
          </div>
        </section>

        {/* TABLE */}
        <section className="glass-panel" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: 'rgba(0,0,0,0.3)' }}>
              <tr>
                <th style={{ padding: '15px', borderBottom: '1px solid var(--surface-border)' }}>Txn ID</th>
                <th style={{ padding: '15px', borderBottom: '1px solid var(--surface-border)' }}>Customer</th>
                <th style={{ padding: '15px', borderBottom: '1px solid var(--surface-border)' }}>Vendor</th>
                <th style={{ padding: '15px', borderBottom: '1px solid var(--surface-border)' }}>Amount</th>
                <th style={{ padding: '15px', borderBottom: '1px solid var(--surface-border)' }}>Status</th>
                <th style={{ padding: '15px', borderBottom: '1px solid var(--surface-border)' }}>Date</th>
                <th style={{ padding: '15px', borderBottom: '1px solid var(--surface-border)' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>No payments found.</td>
                </tr>
              ) : (
                transactions.map((p, idx) => (
                  <tr key={p.txn_id} style={{ borderBottom: idx !== transactions.length -1 ? '1px solid var(--surface-border)' : 'none' }}>
                    <td style={{ padding: '15px' }}>#{p.txn_id}</td>
                    <td style={{ padding: '15px', color: 'white' }}>{p.customer_name}</td>
                    <td style={{ padding: '15px', color: 'var(--primary-color)' }}>{p.vendor_name}</td>
                    <td style={{ padding: '15px', fontWeight: 'bold' }}>₹{p.amount}</td>
                    <td style={{ padding: '15px' }}>
                        <span style={{ 
                            background: p.status.toLowerCase() === 'completed' ? '#238636' : '#d4a20b', 
                            color: 'white',
                            padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold' 
                        }}>
                            {p.status}
                        </span>
                    </td>
                    <td style={{ padding: '15px', fontSize: '0.9rem' }}>{p.date}</td>
                    <td style={{ padding: '15px' }}>
                      {p.status.toLowerCase() === 'completed' && p.payment_method !== 'COD' ? (
                        p.vendor_credited ? (
                          <span style={{ color: '#238636', fontSize: '0.8rem', fontWeight: 'bold' }}>Credited ✅</span>
                        ) : (
                          <button onClick={() => handleCreditVendor(p.order_id)} style={{ fontSize: '0.75rem', padding: '4px 8px', background: 'transparent', border: '1px solid var(--primary-color)', color: 'var(--primary-color)', borderRadius: '4px', cursor: 'pointer' }}>
                            Credit Net: ₹{p.base_amount}
                          </button>
                        )
                      ) : p.payment_method === 'COD' ? (
                        <span style={{ color: '#d4a20b', fontSize: '0.8rem' }}>COD - Audit Weekly</span>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>N/A</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

      </main>
    </div>
  );
}

export default AdminPayments;
