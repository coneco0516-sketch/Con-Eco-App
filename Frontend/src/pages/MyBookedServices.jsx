import React, { useState, useEffect, useCallback } from 'react';
import CustomerSidebar from '../components/CustomerSidebar';

const API = import.meta.env.VITE_API_URL || 'https://api.coneco.store';

import { SERVICE_STATUS_CONFIG as STATUS_CONFIG, PAYMENT_STATUS_CONFIG } from '../utils/statusConfig';


// --- Toast Component ---
function Toast({ toasts, removeToast }) {
  return (
    <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '1rem 1.5rem', borderRadius: '12px', minWidth: '280px', maxWidth: '380px',
          background: t.type === 'success' ? 'rgba(34,197,94,0.15)' : 'rgba(248,81,73,0.15)',
          border: `1px solid ${t.type === 'success' ? 'rgba(34,197,94,0.4)' : 'rgba(248,81,73,0.4)'}`,
          backdropFilter: 'blur(16px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          animation: 'slideInRight 0.3s ease-out',
          color: t.type === 'success' ? '#22c55e' : '#f85149',
          fontWeight: 600,
        }}>
          <span style={{ fontSize: '1.2rem' }}>{t.type === 'success' ? '✅' : '❌'}</span>
          <span style={{ flex: 1, fontSize: '0.9rem', color: 'var(--text-highlight)' }}>{t.message}</span>
          <button onClick={() => removeToast(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '1rem', padding: '2px', lineHeight: 1 }}>×</button>
        </div>
      ))}
    </div>
  );
}

// --- Confirm Modal ---
function ConfirmModal({ open, onClose, onConfirm, title, message, confirmLabel, confirmColor = '#f85149' }) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.6)' }}>
      <div className="glass-panel" style={{ padding: '2.5rem', maxWidth: '440px', width: '90%', textAlign: 'center', animation: 'fadeIn 0.25s ease-out' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
        <h3 style={{ color: 'var(--text-highlight)', margin: '0 0 0.75rem', fontSize: '1.3rem' }}>{title}</h3>
        <p style={{ color: 'var(--text-secondary)', margin: '0 0 2rem', lineHeight: '1.6' }}>{message}</p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button onClick={onClose} className="btn" style={{ background: 'transparent', border: '1px solid var(--surface-border)', color: 'var(--text-secondary)', padding: '0.75rem 2rem' }}>Cancel</button>
          <button onClick={onConfirm} className="btn" style={{ background: confirmColor, padding: '0.75rem 2rem' }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

// --- Booking Card ---
function BookingCard({ s, onPayNow, onCancel, onDownloadSummary }) {
  const st = STATUS_CONFIG[s.status] || STATUS_CONFIG['Pending'];
  const pst = PAYMENT_STATUS_CONFIG[s.payment_status] || PAYMENT_STATUS_CONFIG['Pending'];
  const canCancel = s.status === 'Pending';
  const cannotCancelActive = s.status !== 'Cancelled' && s.status !== 'Delivered' && s.status !== 'Completed' && !canCancel;
  const isDone = s.status === 'Delivered' || s.status === 'Completed';

  return (
    <div className="glass-panel" style={{
      padding: '0',
      overflow: 'hidden',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      borderLeft: `4px solid ${st.color}`,
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 12px 40px rgba(0,0,0,0.35), 0 0 0 1px ${st.border}`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)'; }}
    >
      {/* Card Header */}
      <div style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', borderBottom: '1px solid var(--surface-border)' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
            <h4 style={{ margin: 0, color: 'var(--text-highlight)', fontSize: '1.05rem', fontWeight: 700 }}>{s.item_name}</h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '20px', border: '1px solid var(--surface-border)' }}>
              Booking #{s.order_id}
            </span>
          </div>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>🗓️ Booked on {s.date}</p>
        </div>

        {/* Status Badge */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.35rem 0.85rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700,
            background: st.bg, color: st.color, border: `1px solid ${st.border}`,
          }}>
            {st.icon} {st.label}
          </span>
          <span style={{ color: 'var(--primary-color)', fontWeight: 800, fontSize: '1.3rem' }}>₹{parseFloat(s.amount).toFixed(2)}</span>
        </div>
      </div>

      {/* Card Body */}
      <div style={{ padding: '1.25rem 1.5rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>

        {/* Vendor Info */}
        <div style={{ flex: '1 1 200px', background: 'rgba(0,0,0,0.15)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--surface-border)' }}>
          <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Service Provider</p>
          <p style={{ margin: '0 0 0.4rem', color: 'var(--text-highlight)', fontWeight: 600, fontSize: '0.95rem' }}>🏢 {s.vendor_name}</p>
          <p style={{ margin: '0 0 0.25rem', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>📧 {s.vendor_email}</p>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.82rem' }}>📞 {s.vendor_phone}</p>
        </div>

        {/* Payment Info */}
        <div style={{ flex: '1 1 160px', background: 'rgba(0,0,0,0.15)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--surface-border)' }}>
          <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Payment</p>
          <span style={{
            display: 'inline-block', padding: '3px 10px', borderRadius: '20px',
            fontSize: '0.8rem', fontWeight: 600, color: '#ffd700',
            background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.3)',
            marginBottom: '0.5rem'
          }}>
            {s.payment_method === 'PayLater' ? '🏦 Credit' : `💳 ${s.payment_method}`}
          </span>
          <br />
          <span style={{
            display: 'inline-block', padding: '3px 10px', borderRadius: '20px',
            fontSize: '0.8rem', fontWeight: 600,
            background: pst.bg, color: pst.color,
            border: `1px solid ${pst.color}40`,
          }}>
            {s.payment_status}
          </span>
        </div>

        {/* Actions */}
        <div style={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {/* Pay Now */}
          {s.payment_status !== 'Completed' && s.payment_status !== 'Refunded' && s.status !== 'Cancelled' && ['Card', 'UPI'].includes(s.payment_method) && (
            <button onClick={() => onPayNow(s)} className="btn" style={{ background: 'linear-gradient(135deg, #2ea043, #3fb950)', padding: '0.65rem 1rem', fontSize: '0.85rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
              💳 Pay Now
            </button>
          )}

          {/* Download Summary */}
          {isDone && (
            <button onClick={() => onDownloadSummary(s.order_id)} className="btn" style={{ background: 'rgba(46,160,67,0.15)', border: '1px solid rgba(46,160,67,0.4)', color: '#3fb950', padding: '0.65rem 1rem', fontSize: '0.85rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
              📋 Download Summary
            </button>
          )}

          {/* Download Vendor Bill */}
          {s.bill_file_url && (
            <a href={`${API}${s.bill_file_url}`} target="_blank" rel="noreferrer" className="btn" style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.4)', color: '#60a5fa', padding: '0.65rem 1rem', fontSize: '0.85rem', borderRadius: '8px', textDecoration: 'none', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
              📥 {s.bill_type} Bill
            </a>
          )}

          {/* Cancel */}
          {canCancel && (
            <button onClick={() => onCancel(s.order_id)} className="btn danger" style={{ padding: '0.65rem 1rem', fontSize: '0.85rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
              🗑️ Cancel Booking
            </button>
          )}
          {cannotCancelActive && (
            <button disabled title="Contact the vendor to cancel" style={{ padding: '0.65rem 1rem', fontSize: '0.82rem', borderRadius: '8px', background: 'rgba(248,81,73,0.08)', border: '1px solid rgba(248,81,73,0.25)', color: 'rgba(248,81,73,0.5)', cursor: 'not-allowed', fontFamily: 'inherit', fontWeight: 600 }}>
              📞 Contact Vendor to Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Main Component ---
function MyBookedServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [toasts, setToasts] = useState([]);
  const [confirmModal, setConfirmModal] = useState({ open: false, orderId: null });

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), []);

  const fetchServices = useCallback(() => {
    setLoading(true);
    fetch(`${API}/api/customer/my_services`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => { if (data.services) setServices(data.services); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  const handlePayNow = async (service) => {
    try {
      const resp = await fetch(`${API}/api/payment/create_order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount_paise: Math.round(service.amount * 100) }),
        credentials: 'include'
      });
      const orderData = await resp.json();
      if (!window.Razorpay) { addToast('Razorpay SDK failed to load.', 'error'); return; }
      const options = {
        key: orderData.key_id, amount: orderData.amount_paise, currency: 'INR',
        name: 'ConEco Settlement', description: `Settle Payment for Booking #${service.order_id}`,
        order_id: orderData.order_id,
        handler: async (response) => {
          const verifyResp = await fetch(`${API}/api/payment/verify_settlement`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_id: service.order_id, ...response }),
            credentials: 'include'
          });
          const verifyData = await verifyResp.json();
          if (verifyData.status === 'success') { addToast('Payment successful! Booking settled.'); fetchServices(); }
          else { addToast('Payment verification failed.', 'error'); }
        },
        theme: { color: '#2ea043' }
      };
      new window.Razorpay(options).open();
    } catch { addToast('Error initiating payment.', 'error'); }
  };

  const handleCancelConfirm = async () => {
    const orderId = confirmModal.orderId;
    setConfirmModal({ open: false, orderId: null });
    try {
      const resp = await fetch(`${API}/api/customer/orders/cancel`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId }), credentials: 'include'
      });
      const data = await resp.json();
      if (data.status === 'success') { addToast(data.message || 'Booking cancelled.'); fetchServices(); }
      else { addToast('Cannot cancel: ' + data.message, 'error'); }
    } catch { addToast('Error cancelling booking.', 'error'); }
  };

  const handleDownloadSummary = async (orderId) => {
    try {
      const response = await fetch(`${API}/api/invoice/download/${orderId}`, { credentials: 'include' });
      if (!response.ok) { const e = await response.json().catch(() => ({ detail: 'Server Error' })); throw new Error(e.detail || 'Download failed'); }
      const ct = response.headers.get('content-type');
      if (!ct || !ct.includes('application/pdf')) throw new Error('Order summary generation failed.');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `OrderSummary_ConEco_${orderId}.pdf`;
      document.body.appendChild(a); a.click();
      window.URL.revokeObjectURL(url); document.body.removeChild(a);
      addToast('Order summary downloaded!');
    } catch (err) { addToast('Error: ' + err.message, 'error'); }
  };

  const statusOptions = ['All', 'Pending', 'Confirmed', 'Scheduled', 'In Progress', 'Completed', 'Cancelled'];
  const filtered = filter === 'All' ? services : services.filter(s => s.status === filter);

  const stats = {
    total: services.length,
    active: services.filter(s => !['Delivered','Completed','Cancelled'].includes(s.status)).length,
    completed: services.filter(s => s.status === 'Completed' || s.status === 'Delivered').length,
    cancelled: services.filter(s => s.status === 'Cancelled').length,
  };

  return (
    <div className="dashboard-layout">
      <style>{`
        @keyframes slideInRight { from { opacity:0; transform:translateX(30px); } to { opacity:1; transform:translateX(0); } }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        .booking-skeleton { background: linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 12px; }
        .filter-chip { padding:0.4rem 1rem; border-radius:20px; border:1px solid var(--surface-border); background:transparent; color:var(--text-secondary); font-family:inherit; font-size:0.85rem; font-weight:500; cursor:pointer; transition:all 0.2s ease; }
        .filter-chip:hover { border-color:var(--primary-color); color:var(--primary-color); }
        .filter-chip.active { background:var(--primary-color); border-color:var(--primary-color); color:white; font-weight:600; }
      `}</style>

      <CustomerSidebar />
      <main style={{ flex: 1, minWidth: 0 }}>
        {/* Page Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '2rem', color: 'var(--text-highlight)', margin: '0 0 0.4rem', fontWeight: 800 }}>My Booked Services</h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Track and manage all your service bookings in one place.</p>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { label: 'Total', value: stats.total, color: 'var(--primary-color)', icon: '📦' },
            { label: 'Active', value: stats.active, color: '#f59e0b', icon: '⏳' },
            { label: 'Completed', value: stats.completed, color: '#22c55e', icon: '✅' },
            { label: 'Cancelled', value: stats.cancelled, color: '#f85149', icon: '❌' },
          ].map(s => (
            <div key={s.label} className="glass-panel" style={{ padding: '1.25rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }}>{s.icon}</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filter Chips */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          {statusOptions.map(opt => (
            <button key={opt} className={`filter-chip${filter === opt ? ' active' : ''}`} onClick={() => setFilter(opt)}>
              {opt === 'All' ? `All (${services.length})` : `${STATUS_CONFIG[opt]?.icon || ''} ${opt}`}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[1, 2, 3].map(i => <div key={i} className="booking-skeleton" style={{ height: '160px' }} />)}
          </div>
        ) : filtered.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filtered.map(s => (
              <BookingCard
                key={s.order_id}
                s={s}
                onPayNow={handlePayNow}
                onCancel={(id) => setConfirmModal({ open: true, orderId: id })}
                onDownloadSummary={handleDownloadSummary}
              />
            ))}
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>{filter === 'All' ? '🔧' : STATUS_CONFIG[filter]?.icon || '📋'}</div>
            <h3 style={{ color: 'var(--text-highlight)', margin: '0 0 0.5rem' }}>
              {filter === 'All' ? 'No booked services yet' : `No ${filter} bookings`}
            </h3>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
              {filter === 'All' ? 'Browse our services and make your first booking!' : `You don't have any bookings with "${filter}" status.`}
            </p>
          </div>
        )}
      </main>

      <ConfirmModal
        open={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, orderId: null })}
        onConfirm={handleCancelConfirm}
        title="Cancel Booking?"
        message="Are you sure you want to cancel this booking? For online payments, a 100% refund will be initiated automatically."
        confirmLabel="Yes, Cancel"
        confirmColor="#f85149"
      />
      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

export default MyBookedServices;
