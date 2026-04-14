import React, { useEffect, useState } from 'react';
import AdminSidebar from '../components/AdminSidebar';

const API = process.env.REACT_APP_API_URL || '';

function AdminPayments() {
  const [stats, setStats] = useState({ total_revenue: 0, vendor_collected: 0 });
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  const [settings, setSettings] = useState({ product_commission_pct: 3.0 });

  useEffect(() => {
    setLoading(true);
    // Fetch settings first
    fetch(`${API}/api/admin/platform_settings`, { credentials: 'include' })
      .then(res => res.json())
      .then(sData => {
        if (sData.status === 'success') setSettings(prev => ({ ...prev, ...sData.settings }));
        
        return fetch(`${API}/api/admin/payments`, { credentials: 'include' });
      })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setStats(data.stats);
          setTransactions(data.transactions || []);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading payments:', err);
        setLoading(false);
      });
  }, []);

  const statusColor = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'completed' || s === 'paid') return { background: '#238636', color: 'white' };
    if (s === 'failed' || s === 'cancelled') return { background: '#da3633', color: 'white' };
    return { background: '#d4a20b', color: 'white' };
  };

  const filteredTxns = filter === 'All'
    ? transactions
    : transactions.filter(t => (t.status || '').toLowerCase() === filter.toLowerCase());

  const totalPending = transactions
    .filter(t => (t.status || '').toLowerCase() === 'pending')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const totalCollected = transactions
    .filter(t => ['completed', 'paid'].includes((t.status || '').toLowerCase()))
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  return (
    <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
      <AdminSidebar />
      <main style={{ flex: 1 }}>
        <h2 style={{ fontSize: '2rem', color: 'white', marginTop: 0 }}>Payments Overview</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
          Offline payment transactions (COD) — Test phase only.
        </p>
        <hr style={{ borderColor: 'var(--surface-border)', marginBottom: '1.5rem' }} />

        {/* SUMMARY CARDS */}
        <section style={{ display: 'flex', gap: '20px', marginBottom: '2rem' }}>
          <div className="stat-card glass-panel" style={{ flex: 1 }}>
            <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: '0 0 0.5rem 0' }}>Total Sales (Offline)</h3>
            <p style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: 0, color: '#3fb950' }}>₹{stats.total_revenue}</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '4px 0 0 0' }}>Total offline sales</p>
          </div>
          <div className="stat-card glass-panel" style={{ flex: 1 }}>
            <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: '0 0 0.5rem 0' }}>Pending Collection</h3>
            <p style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: 0, color: '#f59e0b' }}>₹{totalPending.toFixed(2)}</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '4px 0 0 0' }}>Awaiting cash collection</p>
          </div>
          <div className="stat-card glass-panel" style={{ flex: 1 }}>
            <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: '0 0 0.5rem 0' }}>Total Transactions</h3>
            <p style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: 0, color: 'white' }}>{transactions.length}</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '4px 0 0 0' }}>All offline orders</p>
          </div>
        </section>

        {/* FILTER BAR */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Filter by status:</span>
          {['All', 'Pending', 'Paid', 'Completed'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '5px 14px',
                borderRadius: '20px',
                border: '1px solid',
                borderColor: filter === f ? 'var(--primary-color)' : 'var(--surface-border)',
                background: filter === f ? 'var(--primary-color)' : 'transparent',
                color: filter === f ? 'white' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: filter === f ? 'bold' : 'normal'
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* TRANSACTION HISTORY TABLE */}
        <section className="glass-panel" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ color: 'white', margin: 0 }}>Offline Transaction History</h3>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              {filteredTxns.length} record{filteredTxns.length !== 1 ? 's' : ''}
            </span>
          </div>

          {loading ? (
            <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading transactions...</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: 'rgba(0,0,0,0.3)' }}>
                <tr>
                  <th style={{ padding: '12px 15px', borderBottom: '1px solid var(--surface-border)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Order #</th>
                  <th style={{ padding: '12px 15px', borderBottom: '1px solid var(--surface-border)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Customer</th>
                  <th style={{ padding: '12px 15px', borderBottom: '1px solid var(--surface-border)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Vendor</th>
                  <th style={{ padding: '12px 15px', borderBottom: '1px solid var(--surface-border)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Total Amount</th>
                  <th style={{ padding: '12px 15px', borderBottom: '1px solid var(--surface-border)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Base Amount</th>
                  <th style={{ padding: '12px 15px', borderBottom: '1px solid var(--surface-border)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Commission ({settings.product_commission_pct}%)</th>
                  <th style={{ padding: '12px 15px', borderBottom: '1px solid var(--surface-border)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Method</th>
                  <th style={{ padding: '12px 15px', borderBottom: '1px solid var(--surface-border)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Payment Status</th>
                  <th style={{ padding: '12px 15px', borderBottom: '1px solid var(--surface-border)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredTxns.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      No offline transactions found.
                    </td>
                  </tr>
                ) : (
                  filteredTxns.map((p, idx) => (
                    <tr
                      key={p.txn_id || idx}
                      style={{
                        borderBottom: idx !== filteredTxns.length - 1 ? '1px solid var(--surface-border)' : 'none',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '13px 15px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        #{p.order_id || p.txn_id}
                      </td>
                      <td style={{ padding: '13px 15px', color: 'white', fontWeight: '500' }}>
                        {p.customer_name}
                      </td>
                      <td style={{ padding: '13px 15px', color: 'var(--primary-color)' }}>
                        {p.vendor_name}
                      </td>
                      <td style={{ padding: '13px 15px', fontWeight: 'bold', color: 'white' }}>
                        ₹{parseFloat(p.amount || 0).toFixed(2)}
                      </td>
                      <td style={{ padding: '13px 15px', color: '#3fb950', fontWeight: '500' }}>
                        ₹{parseFloat(p.base_amount || 0).toFixed(2)}
                      </td>
                      <td style={{ padding: '13px 15px', color: '#da3633', fontWeight: '500' }}>
                        ₹{parseFloat(p.commission || 0).toFixed(2)}
                      </td>
                      <td style={{ padding: '13px 15px' }}>
                        <span style={{
                          background: 'rgba(245, 158, 11, 0.15)',
                          color: '#f59e0b',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          fontWeight: 'bold',
                          border: '1px solid rgba(245,158,11,0.3)'
                        }}>
                          {p.payment_method || 'COD'}
                        </span>
                      </td>
                      <td style={{ padding: '13px 15px' }}>
                        <span style={{
                          ...statusColor(p.status),
                          padding: '4px 10px',
                          borderRadius: '4px',
                          fontSize: '0.82rem',
                          fontWeight: 'bold'
                        }}>
                          {p.status}
                        </span>
                      </td>
                      <td style={{ padding: '13px 15px', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                        {p.date}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </div>
  );
}

export default AdminPayments;
