import React, { useState, useEffect, useCallback } from 'react';
import VendorSidebar from '../components/VendorSidebar';

const API = import.meta.env.VITE_API_URL || 'https://api.coneco.store';

import { getStatusConfig, PAYMENT_STATUS_CONFIG as PAY_STATUS } from '../utils/statusConfig';

function Toast({ toasts, remove }) {
  return (
    <div style={{ position:'fixed', bottom:'2rem', right:'2rem', zIndex:9999, display:'flex', flexDirection:'column', gap:'0.6rem' }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          display:'flex', alignItems:'center', gap:'0.75rem', padding:'1rem 1.25rem',
          borderRadius:'12px', minWidth:'280px', maxWidth:'380px',
          background: t.type === 'success' ? 'rgba(34,197,94,0.15)' : t.type === 'error' ? 'rgba(248,81,73,0.15)' : 'rgba(59,130,246,0.15)',
          border:`1px solid ${t.type === 'success' ? 'rgba(34,197,94,0.4)' : t.type === 'error' ? 'rgba(248,81,73,0.4)' : 'rgba(59,130,246,0.4)'}`,
          backdropFilter:'blur(16px)', boxShadow:'0 8px 32px rgba(0,0,0,0.3)',
          animation:'slideToast 0.3s ease-out',
        }}>
          <span>{t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : 'ℹ️'}</span>
          <span style={{ flex:1, fontSize:'0.88rem', color:'var(--text-highlight)', fontWeight:500 }}>{t.message}</span>
          <button onClick={() => remove(t.id)} style={{ background:'none', border:'none', color:'var(--text-secondary)', cursor:'pointer', fontSize:'1rem' }}>×</button>
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
      <div style={{ fontSize:'1.6rem', marginBottom:'0.3rem' }}>{icon}</div>
      <div style={{ fontSize:'1.8rem', fontWeight:800, color, lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:'0.75rem', color:'var(--text-secondary)', marginTop:'0.3rem', textTransform:'uppercase', letterSpacing:'0.5px', fontWeight:600 }}>{label}</div>
    </div>
  );
}

function OrderCard({ o, onStatusChange, onPaymentStatus, onBulkAction, onBillUpload, bulkNegotiation, setBulkNegotiation }) {
  const st = getStatusConfig(o.status, o.order_type);
  const pst = PAY_STATUS[o.payment_status] || PAY_STATUS['Pending'];
  const isBulk = o.status === 'Bulk Requested';
  const isCash = ['COD', 'Negotiable', 'PayLater'].includes(o.payment_method);
  const showMarkPaid = isCash && o.payment_status !== 'Completed';

  return (
    <div className="glass-panel" style={{ padding:0, overflow:'hidden', borderLeft:`4px solid ${st.color}`, transition:'box-shadow 0.2s, transform 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow=`0 12px 40px rgba(0,0,0,0.3), 0 0 0 1px ${st.border}`; }}
      onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 8px 32px rgba(0,0,0,0.3)'; }}
    >
      {/* Header */}
      <div style={{ padding:'1.1rem 1.5rem', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'0.75rem', borderBottom:'1px solid var(--surface-border)', background:'rgba(0,0,0,0.1)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', flexWrap:'wrap' }}>
          <span style={{ fontWeight:700, color:'var(--text-highlight)', fontSize:'1rem' }}>Order #{o.order_id}</span>
          <span style={{ color:'var(--text-secondary)', fontSize:'0.9rem' }}>— {o.customer_name}</span>
          {isBulk && <span style={{ background:'rgba(59,130,246,0.15)', color:'#60a5fa', border:'1px solid rgba(59,130,246,0.35)', padding:'2px 10px', borderRadius:'20px', fontSize:'0.75rem', fontWeight:700 }}>📋 BULK</span>}
          <span style={{ background: o.bill_type === 'GST' ? 'rgba(59,130,246,0.12)' : 'rgba(46,160,67,0.12)', color: o.bill_type === 'GST' ? '#60a5fa' : '#3fb950', border:`1px solid ${o.bill_type === 'GST' ? 'rgba(59,130,246,0.3)' : 'rgba(46,160,67,0.3)'}`, padding:'2px 10px', borderRadius:'20px', fontSize:'0.75rem' }}>
            {o.bill_type === 'GST' ? '📋 GST Bill' : '🧾 Simple Bill'}
          </span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
          <span style={{ fontSize:'0.82rem', color:'var(--text-secondary)' }}>{o.date}</span>
          <span style={{ display:'inline-flex', alignItems:'center', gap:'0.3rem', padding:'0.3rem 0.8rem', borderRadius:'20px', fontSize:'0.8rem', fontWeight:700, background:st.bg, color:st.color, border:`1px solid ${st.border}` }}>
            {st.icon} {o.status}
          </span>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding:'1.25rem 1.5rem', display:'flex', gap:'1.25rem', flexWrap:'wrap', alignItems:'flex-start' }}>

        {/* Customer & Delivery Info */}
        <div style={{ flex:'1 1 220px' }}>
          {o.status !== 'Pending' && o.customer_phone && (
            <div style={{ background:'rgba(46,160,67,0.1)', border:'1px solid rgba(46,160,67,0.3)', borderRadius:'8px', padding:'0.6rem 1rem', marginBottom:'0.75rem', display:'flex', alignItems:'center', gap:'0.5rem' }}>
              <span style={{ fontSize:'1rem' }}>📞</span>
              <span style={{ color:'#3fb950', fontWeight:700, fontSize:'0.9rem' }}>{o.customer_phone}</span>
            </div>
          )}

          {/* Delivery Address */}
          <div style={{ background:'rgba(0,0,0,0.15)', padding:'0.85rem', borderRadius:'8px', borderLeft:'3px solid var(--primary-color)', marginBottom:'0.75rem' }}>
            <p style={{ color:'var(--text-secondary)', fontSize:'0.75rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px', margin:'0 0 0.3rem' }}>Delivery Address</p>
            <p style={{ color:'var(--text-highlight)', fontSize:'0.88rem', margin:0, lineHeight:'1.4' }}>{o.delivery_address || 'No address provided'}</p>
          </div>

          {o.customer_message && (
            <div style={{ background:'rgba(255,255,255,0.03)', padding:'0.85rem', borderRadius:'8px', border:'1px solid var(--surface-border)' }}>
              <p style={{ color:'var(--primary-color)', fontSize:'0.75rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px', margin:'0 0 0.3rem' }}>Customer Note</p>
              <p style={{ color:'var(--text-secondary)', fontSize:'0.85rem', margin:0, fontStyle:'italic', lineHeight:'1.4' }}>"{o.customer_message}"</p>
            </div>
          )}
        </div>

        {/* Payment Info */}
        <div style={{ flex:'0 0 170px' }}>
          <div style={{ background:'rgba(0,0,0,0.15)', padding:'1rem', borderRadius:'8px', border:'1px solid var(--surface-border)', textAlign:'center', marginBottom:'0.75rem' }}>
            <p style={{ margin:'0 0 0.4rem', fontSize:'0.72rem', color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.5px', fontWeight:600 }}>
              {isCash ? 'Gross (Collect)' : 'Net Payout'}
            </p>
            <p style={{ margin:'0 0 0.5rem', fontSize:'1.6rem', fontWeight:800, color:'var(--primary-color)' }}>
              ₹{isCash ? parseFloat(o.amount||0).toFixed(2) : parseFloat(o.base_amount||0).toFixed(2)}
            </p>
            {!isCash && <p style={{ margin:0, fontSize:'0.72rem', color:'rgba(255,255,255,0.35)' }}>Gross: ₹{parseFloat(o.amount||0).toFixed(2)}</p>}
          </div>
          <div style={{ textAlign:'center' }}>
            <span style={{ fontSize:'0.78rem', color:'#ffd700', background:'rgba(255,215,0,0.1)', border:'1px solid rgba(255,215,0,0.3)', padding:'3px 10px', borderRadius:'20px' }}>
              {o.payment_method === 'PayLater' ? '🏦 Credit' : `💳 ${o.payment_method}`}
            </span>
            <br /><br />
            <span style={{ fontSize:'0.78rem', fontWeight:600, background:pst.bg, color:pst.color, padding:'3px 10px', borderRadius:'20px', border:`1px solid ${pst.color}40` }}>
              {o.payment_status || 'Pending'}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ flex:'0 0 220px', display:'flex', flexDirection:'column', gap:'0.6rem' }}>
          {isBulk ? (
            bulkNegotiation.orderId === o.order_id ? (
              <div style={{ background:'rgba(255,255,255,0.04)', padding:'1rem', borderRadius:'10px', border:'1px solid var(--surface-border)' }}>
                <label style={{ fontSize:'0.78rem', color:'var(--text-secondary)', display:'block', marginBottom:'4px' }}>Bulk Price (Per Unit)</label>
                <input type="number" className="input-field" style={{ marginBottom:'0.6rem', padding:'0.55rem' }} placeholder="New unit price" value={bulkNegotiation.price} onChange={e => setBulkNegotiation(p => ({...p, price:e.target.value}))} />
                <label style={{ fontSize:'0.78rem', color:'var(--text-secondary)', display:'block', marginBottom:'4px' }}>Note to Customer</label>
                <textarea className="input-field" style={{ marginBottom:'0.6rem', padding:'0.55rem', resize:'none' }} rows="2" placeholder="Optional message" value={bulkNegotiation.message} onChange={e => setBulkNegotiation(p => ({...p, message:e.target.value}))} />
                <div style={{ display:'flex', gap:'0.5rem' }}>
                  <button className="btn" onClick={() => onBulkAction(o.order_id, 'Accept', bulkNegotiation.price, bulkNegotiation.message)} style={{ flex:1, padding:'0.55rem', fontSize:'0.82rem', background:'#238636' }}>✅ Confirm</button>
                  <button className="btn danger" onClick={() => setBulkNegotiation({ orderId:null, price:'', message:'' })} style={{ padding:'0.55rem 0.75rem', fontSize:'0.82rem' }}>✕</button>
                </div>
              </div>
            ) : (
              <div style={{ display:'flex', gap:'0.5rem' }}>
                <button className="btn" onClick={() => setBulkNegotiation({ orderId:o.order_id, price:'', message:'' })} style={{ flex:1, background:'var(--primary-color)', fontSize:'0.85rem', padding:'0.6rem' }}>✅ Accept & Price</button>
                <button className="btn danger" onClick={() => onBulkAction(o.order_id, 'Reject')} style={{ padding:'0.6rem 0.8rem', fontSize:'0.85rem' }}>✕ Reject</button>
              </div>
            )
          ) : (
            <div>
              <label style={{ fontSize:'0.75rem', color:'var(--text-secondary)', display:'block', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.5px', fontWeight:600 }}>Update Status</label>
              <select value={o.status} onChange={e => onStatusChange(o.order_id, e.target.value)} style={{ width:'100%', background:'rgba(0,0,0,0.3)', color:'var(--text-highlight)', border:`1px solid ${st.border}`, padding:'0.65rem 0.9rem', borderRadius:'8px', cursor:'pointer', fontSize:'0.88rem', fontFamily:'inherit', fontWeight:600 }}>
                {o.order_type === 'Service' ? (
                  <>
                    <option value="Pending">⏳ Pending / Awaiting Confirmation</option>
                    <option value="Confirmed">✅ Confirmed</option>
                    <option value="Scheduled">📅 Scheduled</option>
                    <option value="In Progress">🔨 In Progress</option>
                    <option value="Completed">🎉 Completed</option>
                    <option value="Cancelled">❌ Cancelled</option>
                  </>
                ) : (
                  <>
                    <option value="Pending">⏳ Pending</option>
                    <option value="Processing">⚙️ Processing</option>
                    <option value="Shipped">🚚 Shipped</option>
                    <option value="Out for Delivery">📦 Out for Delivery</option>
                    <option value="Delivered">✅ Delivered</option>
                    <option value="Completed">🎉 Completed</option>
                    <option value="Cancelled">❌ Cancelled</option>
                  </>
                )}
              </select>
            </div>
          )}

          {showMarkPaid && (
            <button className="btn" onClick={() => onPaymentStatus(o.order_id, 'Completed')} style={{ background:'transparent', border:'1px solid #22c55e', color:'#22c55e', fontSize:'0.82rem', padding:'0.6rem', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', gap:'5px' }}>
              {o.payment_method === 'PayLater' ? '✅ Mark Credit Received' : '✅ Mark as Paid'}
            </button>
          )}

          {/* Bill Upload */}
          <div style={{ borderTop:'1px solid var(--surface-border)', paddingTop:'0.75rem' }}>
            {o.bill_file_url ? (
              <div style={{ display:'flex', flexDirection:'column', gap:'0.4rem' }}>
                <span style={{ color:'#3fb950', fontSize:'0.82rem', fontWeight:700 }}>✅ Bill Uploaded</span>
                <a href={`${API}${o.bill_file_url}`} target="_blank" rel="noreferrer" style={{ color:'var(--primary-color)', fontSize:'0.8rem', textDecoration:'none', borderBottom:'1px dashed var(--primary-color)' }}>View Bill ↗</a>
                <button onClick={() => document.getElementById(`bill-${o.order_id}`).click()} style={{ background:'none', border:'none', color:'var(--text-secondary)', fontSize:'0.75rem', cursor:'pointer', padding:0, textAlign:'left' }}>(Replace Bill)</button>
              </div>
            ) : (
              <button className="btn" onClick={() => document.getElementById(`bill-${o.order_id}`).click()} style={{ width:'100%', padding:'0.6rem', fontSize:'0.82rem', background:'rgba(255,255,255,0.07)', border:'1px solid var(--surface-border)', color:'var(--text-primary)', borderRadius:'8px' }}>
                📤 Upload {o.bill_type} Bill
              </button>
            )}
            <input type="file" id={`bill-${o.order_id}`} style={{ display:'none' }} accept=".pdf,image/*" onChange={e => onBillUpload(o.order_id, e.target.files[0])} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VendorOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [toasts, setToasts] = useState([]);
  const [bulkNegotiation, setBulkNegotiation] = useState({ orderId:null, price:'', message:'' });

  const addToast = useCallback((message, type='success') => {
    const id = Date.now();
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  }, []);

  const fetchOrders = useCallback(() => {
    setLoading(true);
    fetch(`${API}/api/vendor/orders`, { credentials:'include' })
      .then(r => r.json())
      .then(data => { if (data.orders) setOrders(data.orders); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const resp = await fetch(`${API}/api/vendor/orders/update_status`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ order_id:orderId, status:newStatus }), credentials:'include'
      });
      const data = await resp.json();
      if (data.status === 'success') { addToast(`Status updated to ${newStatus === 'Processing' ? 'Accepted' : newStatus}`); fetchOrders(); }
      else addToast(data.message || 'Update failed.', 'error');
    } catch { addToast('Network error updating status.', 'error'); }
  };

  const handlePaymentStatus = async (orderId, newStatus) => {
    try {
      const resp = await fetch(`${API}/api/vendor/orders/update_payment_status`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ order_id:orderId, status:newStatus }), credentials:'include'
      });
      const data = await resp.json();
      if (data.status === 'success') { addToast('Payment marked as ' + newStatus); fetchOrders(); }
      else addToast(data.message || 'Update failed.', 'error');
    } catch { addToast('Network error.', 'error'); }
  };

  const handleBulkAction = async (orderId, action, price=null, message='') => {
    try {
      const resp = await fetch(`${API}/api/vendor/orders/bulk_action`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ order_id:orderId, action, negotiated_price:price, vendor_message:message }), credentials:'include'
      });
      const data = await resp.json();
      if (data.status === 'success') { addToast(`Bulk request ${action === 'Accept' ? 'accepted' : 'rejected'}`); setBulkNegotiation({ orderId:null, price:'', message:'' }); fetchOrders(); }
      else addToast(data.message || 'Action failed.', 'error');
    } catch { addToast('Network error.', 'error'); }
  };

  const handleBillUpload = async (orderId, file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const resp = await fetch(`${API}/api/vendor/orders/${orderId}/upload_bill`, { method:'POST', body:formData, credentials:'include' });
      const data = await resp.json();
      if (data.status === 'success') { addToast('Bill uploaded successfully!'); fetchOrders(); }
      else addToast(data.detail || data.message || 'Upload failed.', 'error');
    } catch { addToast('Network error uploading bill.', 'error'); }
  };

  const tabs = ['All', 'Pending', 'Bulk Requested', 'Processing', 'Confirmed', 'Scheduled', 'In Progress', 'Shipped', 'Delivered', 'Completed', 'Cancelled'];
  const filtered = activeTab === 'All' ? orders : orders.filter(o => o.status === activeTab);
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'Pending' || o.status === 'Bulk Requested').length,
    active: orders.filter(o => ['Processing','Shipped','Out for Delivery','Confirmed','Scheduled','In Progress'].includes(o.status)).length,
    completed: orders.filter(o => o.status === 'Delivered' || o.status === 'Completed').length,
  };

  return (
    <div className="dashboard-layout">
      <style>{`
        @keyframes slideToast { from { opacity:0; transform:translateX(30px); } to { opacity:1; transform:translateX(0); } }
        .v-tab { padding:0.45rem 1.1rem; border-radius:20px; border:1px solid var(--surface-border); background:transparent; color:var(--text-secondary); font-family:inherit; font-size:0.83rem; font-weight:500; cursor:pointer; transition:all 0.2s; white-space:nowrap; }
        .v-tab:hover { border-color:var(--primary-color); color:var(--primary-color); }
        .v-tab.active { background:var(--primary-color); border-color:var(--primary-color); color:#fff; font-weight:700; }
      `}</style>

      <VendorSidebar />
      <main style={{ flex:1, minWidth:0 }}>
        <div style={{ marginBottom:'1.75rem' }}>
          <h2 style={{ fontSize:'2rem', color:'var(--text-highlight)', margin:'0 0 0.3rem', fontWeight:800 }}>Incoming Orders</h2>
          <p style={{ color:'var(--text-secondary)', margin:0 }}>Manage service & product orders, update statuses, and upload bills.</p>
        </div>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(130px,1fr))', gap:'1rem', marginBottom:'1.75rem' }}>
          <StatCard icon="📦" label="Total" value={stats.total} color="var(--primary-color)" />
          <StatCard icon="⏳" label="Pending" value={stats.pending} color="#f59e0b" />
          <StatCard icon="⚙️" label="Active" value={stats.active} color="#3b82f6" />
          <StatCard icon="✅" label="Delivered" value={stats.completed} color="#22c55e" />
        </div>

        {/* Notice */}
        <div style={{ background:'rgba(255,215,0,0.08)', borderLeft:'4px solid #ffd700', borderRadius:'8px', padding:'0.9rem 1.25rem', marginBottom:'1.75rem', display:'flex', alignItems:'center', gap:'0.75rem' }}>
          <span style={{ fontSize:'1.1rem' }}>⚠️</span>
          <p style={{ color:'#ffd700', margin:0, fontSize:'0.88rem', fontWeight:600 }}>Delivery charges are separate. Confirm with the customer and collect directly. ConEco is not responsible.</p>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap', marginBottom:'1.5rem' }}>
          {tabs.map(tab => (
              <button key={tab} className={`v-tab${activeTab === tab ? ' active' : ''}`} onClick={() => setActiveTab(tab)}>
                {getStatusConfig(tab, 'Product')?.icon || '📋'} {tab}{tab === 'All' ? ` (${orders.length})` : ''}
              </button>
          ))}
        </div>

        {/* Orders */}
        {loading ? (
          <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            {[1,2,3].map(i => <div key={i} style={{ height:'180px', borderRadius:'12px', background:'rgba(255,255,255,0.03)', animation:'pulse 1.5s infinite' }} />)}
          </div>
        ) : filtered.length > 0 ? (
          <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            {filtered.map(o => (
              <OrderCard key={o.order_id} o={o}
                onStatusChange={handleStatusChange}
                onPaymentStatus={handlePaymentStatus}
                onBulkAction={handleBulkAction}
                onBillUpload={handleBillUpload}
                bulkNegotiation={bulkNegotiation}
                setBulkNegotiation={setBulkNegotiation}
              />
            ))}
          </div>
        ) : (
          <div className="glass-panel" style={{ padding:'4rem', textAlign:'center' }}>
            <div style={{ fontSize:'3.5rem', marginBottom:'1rem' }}>🎉</div>
            <h3 style={{ color:'var(--text-highlight)', margin:'0 0 0.5rem' }}>{activeTab === 'All' ? 'No orders yet' : `No ${activeTab} orders`}</h3>
            <p style={{ color:'var(--text-secondary)', margin:0 }}>New orders will appear here once customers place them.</p>
          </div>
        )}
      </main>

      <Toast toasts={toasts} remove={id => setToasts(p => p.filter(t => t.id !== id))} />
    </div>
  );
}
