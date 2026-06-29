import React, { useEffect, useState, useCallback, useMemo } from 'react';
import AdminSidebar from '../components/AdminSidebar';

const API = import.meta.env.VITE_API_URL || 'https://api.coneco.store';

import { getStatusConfig, PAYMENT_STATUS_CONFIG as PAY_STATUS } from '../utils/statusConfig';


function Toast({ toasts, remove }) {
  return (
    <div style={{ position:'fixed', bottom:'2rem', right:'2rem', zIndex:9999, display:'flex', flexDirection:'column', gap:'0.6rem' }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          display:'flex', alignItems:'center', gap:'0.75rem', padding:'1rem 1.25rem',
          borderRadius:'12px', minWidth:'260px', maxWidth:'380px',
          background: t.type==='success' ? 'rgba(34,197,94,0.15)' : 'rgba(248,81,73,0.15)',
          border:`1px solid ${t.type==='success' ? 'rgba(34,197,94,0.4)' : 'rgba(248,81,73,0.4)'}`,
          backdropFilter:'blur(16px)', boxShadow:'0 8px 32px rgba(0,0,0,0.3)',
          animation:'toastIn 0.3s ease-out',
        }}>
          <span>{t.type==='success' ? '✅' : '❌'}</span>
          <span style={{ flex:1, fontSize:'0.88rem', color:'var(--text-highlight)', fontWeight:500 }}>{t.message}</span>
          <button onClick={() => remove(t.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-secondary)', fontSize:'1rem' }}>×</button>
        </div>
      ))}
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="glass-panel" style={{ padding:'1.25rem', textAlign:'center', transition:'transform 0.2s' }}
      onMouseEnter={e => e.currentTarget.style.transform='translateY(-3px)'}
      onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}
    >
      <div style={{ fontSize:'1.5rem', marginBottom:'0.3rem' }}>{icon}</div>
      <div style={{ fontSize:'1.8rem', fontWeight:800, color, lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:'0.72rem', color:'var(--text-secondary)', marginTop:'0.3rem', textTransform:'uppercase', letterSpacing:'0.5px', fontWeight:600 }}>{label}</div>
    </div>
  );
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortBy, setSortBy] = useState('date_desc');
  const [toasts, setToasts] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);

  const addToast = useCallback((message, type='success') => {
    const id = Date.now();
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  }, []);

  const handleDownloadSummary = async (orderId) => {
    try {
      const response = await fetch(`${API}/api/invoice/download/${orderId}`, { credentials:'include' });
      if (!response.ok) { const e = await response.json().catch(() => ({detail:'Server Error'})); throw new Error(e.detail||'Download failed'); }
      const ct = response.headers.get('content-type');
      if (!ct || !ct.includes('application/pdf')) throw new Error('Server did not return a valid PDF.');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `OrderSummary_ConEco_${orderId}.pdf`;
      document.body.appendChild(a); a.click();
      window.URL.revokeObjectURL(url); document.body.removeChild(a);
      addToast('Summary downloaded!');
    } catch (err) { addToast('Error: ' + err.message, 'error'); }
  };

  useEffect(() => {
    fetch(`${API}/api/admin/orders`, { credentials:'include' })
      .then(r => r.json())
      .then(data => { if (data.status === 'success') setOrders(data.orders); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = [...orders];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(o =>
        String(o.order_id).includes(q) ||
        (o.customer_name||'').toLowerCase().includes(q) ||
        (o.vendor_name||'').toLowerCase().includes(q) ||
        (o.order_type||'').toLowerCase().includes(q)
      );
    }
    if (filterType !== 'All') list = list.filter(o => o.order_type === filterType);
    if (filterStatus !== 'All') list = list.filter(o => o.status === filterStatus);
    if (sortBy === 'amount_desc') list.sort((a,b) => parseFloat(b.amount||0) - parseFloat(a.amount||0));
    else if (sortBy === 'amount_asc') list.sort((a,b) => parseFloat(a.amount||0) - parseFloat(b.amount||0));
    return list;
  }, [orders, search, filterType, filterStatus, sortBy]);

  const stats = useMemo(() => ({
    total: orders.length,
    products: orders.filter(o => o.order_type === 'Product').length,
    services: orders.filter(o => o.order_type === 'Service').length,
    revenue: orders.filter(o => o.payment_status === 'Completed' || o.payment_status === 'Paid').reduce((s,o) => s + parseFloat(o.amount||0), 0),
    completed: orders.filter(o => o.status === 'Completed' || o.status === 'Delivered').length,
    cancelled: orders.filter(o => o.status === 'Cancelled').length,
  }), [orders]);

  const uniqueStatuses = ['All', ...Array.from(new Set(orders.map(o => o.status)))];

  return (
    <div className="dashboard-layout">
      <style>{`
        @keyframes toastIn { from{opacity:0;transform:translateX(30px)} to{opacity:1;transform:translateX(0)} }
        .ao-row { transition: background 0.15s; }
        .ao-row:hover { background: rgba(255,255,255,0.025) !important; }
        .ao-ctrl select, .ao-ctrl input { background:rgba(0,0,0,0.25); color:var(--text-highlight); border:1px solid var(--surface-border); border-radius:8px; padding:0.55rem 0.9rem; font-family:inherit; font-size:0.85rem; outline:none; transition:border-color 0.2s; }
        .ao-ctrl select:focus, .ao-ctrl input:focus { border-color:var(--primary-color); }
        .ao-ctrl input { min-width:220px; }
        .expand-btn { background:none; border:none; color:var(--primary-color); cursor:pointer; font-size:0.8rem; padding:3px 8px; border-radius:4px; font-family:inherit; }
        .expand-btn:hover { background:rgba(46,160,67,0.1); }
      `}</style>

      <AdminSidebar />
      <main style={{ flex:1, minWidth:0 }}>

        {/* Header */}
        <div style={{ marginBottom:'1.75rem' }}>
          <h2 style={{ fontSize:'2rem', color:'var(--text-highlight)', margin:'0 0 0.3rem', fontWeight:800 }}>All Orders Overview</h2>
          <p style={{ color:'var(--text-secondary)', margin:0 }}>Monitor every product and service booking across the platform.</p>
        </div>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(130px,1fr))', gap:'1rem', marginBottom:'1.75rem' }}>
          <StatCard icon="📦" label="Total Orders" value={stats.total} color="var(--primary-color)" />
          <StatCard icon="🛒" label="Products" value={stats.products} color="#3b82f6" />
          <StatCard icon="🔧" label="Services" value={stats.services} color="#8b5cf6" />
          <StatCard icon="✅" label="Completed" value={stats.completed} color="#22c55e" />
          <StatCard icon="❌" label="Cancelled" value={stats.cancelled} color="#f85149" />
          <StatCard icon="💰" label="Revenue" value={`₹${stats.revenue.toLocaleString('en-IN', {maximumFractionDigits:0})}`} color="#ffd700" />
        </div>

        {/* Controls */}
        <div className="ao-ctrl glass-panel" style={{ padding:'1rem 1.25rem', marginBottom:'1.5rem', display:'flex', gap:'0.75rem', flexWrap:'wrap', alignItems:'center' }}>
          <input
            type="text"
            placeholder="🔍  Search by order ID, customer, vendor..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="All">All Types</option>
            <option value="Product">🛒 Products</option>
            <option value="Service">🔧 Services</option>
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            {uniqueStatuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="date_desc">📅 Newest First</option>
            <option value="amount_desc">💰 Highest Amount</option>
            <option value="amount_asc">💰 Lowest Amount</option>
          </select>
          <span style={{ marginLeft:'auto', color:'var(--text-secondary)', fontSize:'0.85rem' }}>
            Showing <strong style={{ color:'var(--text-highlight)' }}>{filtered.length}</strong> of {orders.length}
          </span>
        </div>

        {/* Table */}
        <div className="glass-panel" style={{ overflow:'hidden' }}>
          <div className="table-responsive">
            <table style={{ width:'100%', borderCollapse:'collapse', textAlign:'left' }}>
              <thead>
                <tr style={{ background:'rgba(0,0,0,0.25)', borderBottom:'1px solid var(--surface-border)' }}>
                  {['Order', 'Customer', 'Vendor', 'Type', 'Amount', 'Status', 'Review', 'Date', 'Actions'].map(h => (
                    <th key={h} style={{ padding:'14px 16px', fontSize:'0.75rem', textTransform:'uppercase', letterSpacing:'0.8px', fontWeight:700, color:'var(--text-secondary)', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(9)].map((__, j) => (
                        <td key={j} style={{ padding:'16px' }}>
                          <div style={{ height:'16px', borderRadius:'4px', background:'rgba(255,255,255,0.04)', animation:'pulse 1.5s infinite' }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ padding:'4rem', textAlign:'center', color:'var(--text-secondary)' }}>
                      <div style={{ fontSize:'2.5rem', marginBottom:'0.75rem' }}>🔍</div>
                      <p style={{ margin:0 }}>No orders match your filters.</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((order, idx) => {
                    const st = getStatusConfig(order.status, order.order_type);
                    const pst = PAY_STATUS[order.payment_status] || PAY_STATUS['Pending'];
                    const isDone = order.status === 'Delivered' || order.status === 'Completed';
                    const isExpanded = expandedRow === order.order_id;
                    return (
                      <React.Fragment key={order.order_id}>
                        <tr className="ao-row" style={{ borderBottom: idx !== filtered.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                          {/* Order ID */}
                          <td style={{ padding:'14px 16px' }}>
                            <div style={{ fontWeight:700, color:'var(--text-highlight)', fontSize:'0.9rem' }}>#{order.order_id}</div>
                          </td>

                          {/* Customer */}
                          <td style={{ padding:'14px 16px' }}>
                            <div style={{ color:'var(--text-highlight)', fontWeight:600, fontSize:'0.88rem', maxWidth:'130px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{order.customer_name}</div>
                          </td>

                          {/* Vendor */}
                          <td style={{ padding:'14px 16px' }}>
                            <div style={{ color:'var(--primary-color)', fontWeight:600, fontSize:'0.88rem', maxWidth:'130px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{order.vendor_name}</div>
                          </td>

                          {/* Type */}
                          <td style={{ padding:'14px 16px' }}>
                            <span style={{ padding:'3px 10px', borderRadius:'20px', fontSize:'0.78rem', fontWeight:600,
                              background: order.order_type === 'Product' ? 'rgba(59,130,246,0.12)' : 'rgba(139,92,246,0.12)',
                              color: order.order_type === 'Product' ? '#60a5fa' : '#a78bfa',
                              border: `1px solid ${order.order_type === 'Product' ? 'rgba(59,130,246,0.3)' : 'rgba(139,92,246,0.3)'}`,
                            }}>
                              {order.order_type === 'Product' ? '🛒' : '🔧'} {order.order_type}
                            </span>
                          </td>

                          {/* Amount */}
                          <td style={{ padding:'14px 16px' }}>
                            <div style={{ fontWeight:700, color:'var(--text-highlight)', fontSize:'0.9rem' }}>₹{parseFloat(order.amount||0).toLocaleString('en-IN', { maximumFractionDigits:2 })}</div>
                          </td>

                          {/* Status */}
                          <td style={{ padding:'14px 16px' }}>
                            <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                              <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', padding:'3px 10px', borderRadius:'20px', fontSize:'0.78rem', fontWeight:700, background:st.bg, color:st.color, whiteSpace:'nowrap' }}>
                                {st.icon} {order.status}
                              </span>
                              <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', padding:'2px 8px', borderRadius:'20px', fontSize:'0.73rem', fontWeight:600, background:pst.bg, color:pst.color, whiteSpace:'nowrap' }}>
                                {order.payment_status}
                              </span>
                              <span style={{ fontSize:'0.72rem', color:'#ffd700', background:'rgba(255,215,0,0.08)', padding:'1px 6px', borderRadius:'20px', whiteSpace:'nowrap' }}>
                                {order.payment_method}
                              </span>
                            </div>
                          </td>

                          {/* Review */}
                          <td style={{ padding:'14px 16px' }}>
                            {order.review_message ? (
                              <div style={{ maxWidth:'150px' }}>
                                <div style={{ color:'#ffd700', fontSize:'0.78rem', marginBottom:'3px' }}>
                                  {'★'.repeat(order.review_rating || 0)}{'☆'.repeat(5 - (order.review_rating || 0))}
                                </div>
                                <div style={{ fontSize:'0.75rem', color:'var(--text-secondary)', fontStyle:'italic', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'140px' }}>
                                  "{order.review_message}"
                                </div>
                              </div>
                            ) : (
                              <span style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.25)' }}>—</span>
                            )}
                          </td>

                          {/* Date */}
                          <td style={{ padding:'14px 16px', fontSize:'0.82rem', color:'var(--text-secondary)', whiteSpace:'nowrap' }}>
                            {order.date}
                          </td>

                          {/* Actions */}
                          <td style={{ padding:'14px 16px' }}>
                            <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
                              {isDone && (
                                <button
                                  onClick={() => handleDownloadSummary(order.order_id)}
                                  style={{ display:'inline-flex', alignItems:'center', gap:'5px', padding:'5px 10px', borderRadius:'6px', fontSize:'0.78rem', fontWeight:600, cursor:'pointer', background:'rgba(46,160,67,0.12)', color:'#3fb950', border:'1px solid rgba(46,160,67,0.35)', fontFamily:'inherit', transition:'all 0.2s', whiteSpace:'nowrap' }}
                                  onMouseEnter={e => { e.currentTarget.style.background='rgba(46,160,67,0.22)'; }}
                                  onMouseLeave={e => { e.currentTarget.style.background='rgba(46,160,67,0.12)'; }}
                                >
                                  📋 Summary
                                </button>
                              )}
                              {order.review_message && (
                                <button className="expand-btn" onClick={() => setExpandedRow(isExpanded ? null : order.order_id)}>
                                  {isExpanded ? '▲ Hide' : '▼ Review'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Expanded Review Row */}
                        {isExpanded && order.review_message && (
                          <tr style={{ background:'rgba(255,215,0,0.04)', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                            <td colSpan="9" style={{ padding:'1rem 1.5rem' }}>
                              <div style={{ display:'flex', alignItems:'flex-start', gap:'1rem' }}>
                                <div style={{ color:'#ffd700', fontSize:'1.2rem' }}>
                                  {'★'.repeat(order.review_rating || 0)}{'☆'.repeat(5 - (order.review_rating || 0))}
                                </div>
                                <div>
                                  <p style={{ color:'var(--text-secondary)', fontSize:'0.88rem', margin:0, lineHeight:'1.5', fontStyle:'italic' }}>"{order.review_message}"</p>
                                  <p style={{ color:'var(--text-secondary)', fontSize:'0.75rem', margin:'0.4rem 0 0', opacity:0.6 }}>by {order.customer_name} on {order.date}</p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          {!loading && filtered.length > 0 && (
            <div style={{ padding:'1rem 1.5rem', borderTop:'1px solid var(--surface-border)', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'0.5rem' }}>
              <span style={{ color:'var(--text-secondary)', fontSize:'0.85rem' }}>
                {filtered.length} order{filtered.length !== 1 ? 's' : ''} shown
              </span>
              <span style={{ color:'var(--text-secondary)', fontSize:'0.82rem' }}>
                Total Value: <strong style={{ color:'var(--primary-color)' }}>₹{filtered.reduce((s,o) => s + parseFloat(o.amount||0), 0).toLocaleString('en-IN', { maximumFractionDigits:2 })}</strong>
              </span>
            </div>
          )}
        </div>
      </main>

      <Toast toasts={toasts} remove={id => setToasts(p => p.filter(t => t.id !== id))} />
    </div>
  );
}
