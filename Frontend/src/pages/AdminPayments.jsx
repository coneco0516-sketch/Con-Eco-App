import React, { useEffect, useState } from 'react';
import AdminSidebar from '../components/AdminSidebar';

const API = import.meta.env.VITE_API_URL || '';

function AdminPayments() {
  const [stats, setStats] = useState({ total_revenue: 0, vendor_collected: 0 });
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Transactions'); // 'Transactions' or 'Credit'
  const [creditAccounts, setCreditAccounts] = useState([]);
  const [creditTransactions, setCreditTransactions] = useState([]);
  const [msg, setMsg] = useState('');

  const [settings, setSettings] = useState({ product_commission_pct: 3.0, service_commission_pct: 3.0 });

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

  const fetchCreditData = async () => {
    try {
      const res = await fetch(`${API}/api/admin/credit_accounts`, { credentials: 'include' });
      const data = await res.json();
      if (data.status === 'success') {
        setCreditAccounts(data.accounts);
        setCreditTransactions(data.transactions);
      }
    } catch (err) {
      console.error('Error loading credit accounts:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'Credit') fetchCreditData();
  }, [activeTab]);

  const handleLiftSuspension = async (custId) => {
    if (!window.confirm("Lift credit suspension for this customer?")) return;
    try {
      const res = await fetch(`${API}/api/admin/customers/${custId}/credit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lift_suspension: true, notes: 'Admin manual lift' }),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.status === 'success') {
        alert("Suspension lifted.");
        fetchCreditData();
      }
    } catch (err) {
      alert("Error lifting suspension.");
    }
  };

  const statusColor = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'completed' || s === 'paid') return { background: '#238636', color: 'var(--text-highlight)' };
    if (s === 'failed' || s === 'cancelled') return { background: '#da3633', color: 'var(--text-highlight)' };
    return { background: '#d4a20b', color: 'var(--text-highlight)' };
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
    <div className="dashboard-layout">
      <AdminSidebar />
      <main style={{ flex: 1 }}>
        <h2 style={{ fontSize: '2rem', color: 'var(--text-highlight)', marginTop: 0 }}>Payments Overview</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
          Offline and Credit payment transactions.
        </p>
        <hr style={{ borderColor: 'var(--surface-border)', marginBottom: '1.5rem' }} />

        {/* TAB NAVIGATION */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--surface-border)' }}>
          <button 
            onClick={() => setActiveTab('Transactions')}
            style={{ 
              padding: '1rem 2rem', 
              background: 'none', 
              border: 'none', 
              color: activeTab === 'Transactions' ? 'var(--primary-color)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'Transactions' ? '2px solid var(--primary-color)' : 'none',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Offline Transactions
          </button>
          <button 
            onClick={() => setActiveTab('Credit')}
            style={{ 
              padding: '1rem 2rem', 
              background: 'none', 
              border: 'none', 
              color: activeTab === 'Credit' ? 'var(--primary-color)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'Credit' ? '2px solid var(--primary-color)' : 'none',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Credit Accounts
          </button>
        </div>

        {/* SUMMARY CARDS */}
        <section className="dashboard-stats-grid">
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
            <p style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: 0, color: 'var(--text-highlight)' }}>{transactions.length}</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '4px 0 0 0' }}>All offline orders</p>
          </div>
        </section>

        {/* FILTER BAR */}
        <div className="dashboard-row wrap">
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
        {activeTab === 'Transactions' ? (
          <section className="glass-panel" style={{ overflow: 'hidden' }}>
            <div className="dashboard-header-row" style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--surface-border)' }}>
              <h3 style={{ color: 'var(--text-highlight)', margin: 0 }}>Offline Transaction History</h3>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                {filteredTxns.length} record{filteredTxns.length !== 1 ? 's' : ''}
              </span>
            </div>

            {loading ? (
              <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading transactions...</p>
            ) : (
              <div className="table-responsive"><table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ background: 'rgba(0,0,0,0.3)' }}>
                  <tr>
                    <th style={{ padding: '12px 15px', borderBottom: '1px solid var(--surface-border)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Order #</th>
                    <th style={{ padding: '12px 15px', borderBottom: '1px solid var(--surface-border)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Customer</th>
                    <th style={{ padding: '12px 15px', borderBottom: '1px solid var(--surface-border)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Vendor</th>
                    <th style={{ padding: '12px 15px', borderBottom: '1px solid var(--surface-border)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Total Amount</th>
                    <th style={{ padding: '12px 15px', borderBottom: '1px solid var(--surface-border)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Base Amount</th>
                    <th style={{ padding: '12px 15px', borderBottom: '1px solid var(--surface-border)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>GST (18%)</th>
                    <th style={{ padding: '12px 15px', borderBottom: '1px solid var(--surface-border)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Commission</th>
                    <th style={{ padding: '12px 15px', borderBottom: '1px solid var(--surface-border)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Method</th>
                    <th style={{ padding: '12px 15px', borderBottom: '1px solid var(--surface-border)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Payment Status</th>
                    <th style={{ padding: '12px 15px', borderBottom: '1px solid var(--surface-border)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTxns.length === 0 ? (
                    <tr>
                      <td colSpan="10" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
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
                        <td style={{ padding: '13px 15px', color: 'var(--text-highlight)', fontWeight: '500' }}>
                          {p.customer_name}
                        </td>
                        <td style={{ padding: '13px 15px', color: 'var(--primary-color)' }}>
                          {p.vendor_name}
                        </td>
                        <td style={{ padding: '13px 15px', fontWeight: 'bold', color: 'var(--text-highlight)' }}>
                          ₹{parseFloat(p.amount || 0).toFixed(2)}
                        </td>
                        <td style={{ padding: '13px 15px', color: '#3fb950', fontWeight: '500' }}>
                          ₹{parseFloat(p.base_amount || 0).toFixed(2)}
                        </td>
                        <td style={{ padding: '13px 15px', color: '#3498db', fontWeight: '500' }}>
                          ₹{parseFloat(p.gst_amount || 0).toFixed(2)}
                        </td>
                        <td style={{ padding: '13px 15px', color: '#da3633', fontWeight: '500' }}>
                          ₹{parseFloat(p.commission || 0).toFixed(2)}
                        </td>
                        <td style={{ padding: '13px 15px' }}>
                          <span style={{
                            background: p.payment_method === 'PayLater' ? 'rgba(52, 152, 219, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: p.payment_method === 'PayLater' ? '#3498db' : '#f59e0b',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            fontWeight: 'bold',
                            border: `1px solid ${p.payment_method === 'PayLater' ? 'rgba(52,152,219,0.3)' : 'rgba(245,158,11,0.3)'}`
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
              </table></div>
            )}
          </section>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
             {/* CREDIT ACCOUNTS TABLE */}
             <section className="glass-panel" style={{ overflow: 'hidden' }}>
                <div className="dashboard-header-row" style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--surface-border)' }}>
                   <h3 style={{ color: 'var(--text-highlight)', margin: 0 }}>Active Credit Accounts</h3>
                </div>
                <div className="table-responsive">
                   <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead style={{ background: 'rgba(0,0,0,0.3)' }}>
                         <tr>
                            <th style={{ padding: '12px 15px', borderBottom: '1px solid var(--surface-border)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Customer</th>
                            <th style={{ padding: '12px 15px', borderBottom: '1px solid var(--surface-border)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Status</th>
                            <th style={{ padding: '12px 15px', borderBottom: '1px solid var(--surface-border)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Credit Used</th>
                            <th style={{ padding: '12px 15px', borderBottom: '1px solid var(--surface-border)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Available</th>
                            <th style={{ padding: '12px 15px', borderBottom: '1px solid var(--surface-border)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Total Limit</th>
                            <th style={{ padding: '12px 15px', borderBottom: '1px solid var(--surface-border)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Action</th>
                         </tr>
                      </thead>
                      <tbody>
                         {creditAccounts.map((acc, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                               <td style={{ padding: '13px 15px' }}>
                                  <div style={{ color: 'var(--text-highlight)', fontWeight: 'bold' }}>{acc.name}</div>
                                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{acc.email}</div>
                               </td>
                               <td style={{ padding: '13px 15px' }}>
                                  <span style={{ 
                                     padding: '3px 10px', 
                                     borderRadius: '20px', 
                                     fontSize: '0.75rem', 
                                     fontWeight: 'bold',
                                     background: acc.credit_status === 'Suspended' ? 'rgba(231, 76, 60, 0.2)' : 'rgba(35, 134, 54, 0.2)',
                                     color: acc.credit_status === 'Suspended' ? '#e74c3c' : '#3fb950',
                                     border: `1px solid ${acc.credit_status === 'Suspended' ? '#e74c3c' : '#3fb950'}`
                                  }}>
                                     {acc.credit_status === 'Suspended' ? `Suspended until ${acc.suspended_until}` : acc.credit_status}
                                  </span>
                               </td>
                               <td style={{ padding: '13px 15px', color: '#e74c3c', fontWeight: 'bold' }}>₹{acc.credit_used}</td>
                               <td style={{ padding: '13px 15px', color: '#3fb950', fontWeight: 'bold' }}>₹{acc.credit_available}</td>
                               <td style={{ padding: '13px 15px', color: 'var(--text-secondary)' }}>₹{acc.credit_limit}</td>
                               <td style={{ padding: '13px 15px' }}>
                                  {acc.credit_status === 'Suspended' && (
                                     <button onClick={() => handleLiftSuspension(acc.customer_id)} className="btn" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>Lift Suspension</button>
                                  )}
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </section>

             {/* RECENT CREDIT TRANSACTIONS */}
             <section className="glass-panel" style={{ overflow: 'hidden' }}>
                <div className="dashboard-header-row" style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--surface-border)' }}>
                   <h3 style={{ color: 'var(--text-highlight)', margin: 0 }}>Recent Credit Logs</h3>
                </div>
                <div className="table-responsive">
                   <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead style={{ background: 'rgba(0,0,0,0.3)' }}>
                         <tr>
                            <th style={{ padding: '12px 15px', borderBottom: '1px solid var(--surface-border)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Date</th>
                            <th style={{ padding: '12px 15px', borderBottom: '1px solid var(--surface-border)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Customer</th>
                            <th style={{ padding: '12px 15px', borderBottom: '1px solid var(--surface-border)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Type</th>
                            <th style={{ padding: '12px 15px', borderBottom: '1px solid var(--surface-border)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Amount</th>
                            <th style={{ padding: '12px 15px', borderBottom: '1px solid var(--surface-border)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Details</th>
                         </tr>
                      </thead>
                      <tbody>
                         {creditTransactions.map((t, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid var(--surface-border)', fontSize: '0.85rem' }}>
                               <td style={{ padding: '10px 15px', color: 'var(--text-secondary)' }}>{t.date}</td>
                               <td style={{ padding: '10px 15px', color: 'var(--text-highlight)' }}>{t.customer_name}</td>
                               <td style={{ padding: '10px 15px' }}>
                                  <span style={{ color: t.txn_type === 'Debit' || t.txn_type === 'Penalty' ? '#e74c3c' : '#3fb950', fontWeight: 'bold' }}>{t.txn_type}</span>
                               </td>
                               <td style={{ padding: '10px 15px', fontWeight: 'bold' }}>₹{t.amount}</td>
                               <td style={{ padding: '10px 15px', color: 'var(--text-secondary)' }}>{t.notes}</td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </section>
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminPayments;
