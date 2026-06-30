import React, { useState, useEffect, useCallback } from 'react';
import VendorSidebar from '../components/VendorSidebar';
import NegotiationChat from './NegotiationChat';

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

function MilestonesSection({ orderId, orderAmount, orderStatus, onRefresh }) {
  const [expanded, setExpanded] = useState(false);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);
  const [completingId, setCompletingId] = useState(null);
  const [vendorNote, setVendorNote] = useState('');

  const [builderSteps, setBuilderSteps] = useState([
    { title: 'Initial Milestone', description: '', scheduled_date: '', payment_percentage: 100 }
  ]);

  const fetchMilestones = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/milestones/${orderId}`, { credentials: 'include' });
      const data = await res.json();
      if (data.status === 'success') {
        setMilestones(data.milestones || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (expanded) {
      fetchMilestones();
    }
  }, [expanded, fetchMilestones]);

  const handleMarkComplete = async (milestoneId) => {
    try {
      const res = await fetch(`${API}/api/milestones/vendor/milestones/${milestoneId}/complete`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: vendorNote }),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.status === 'success') {
        setCompletingId(null);
        setVendorNote('');
        fetchMilestones();
        if (onRefresh) onRefresh();
      } else {
        alert(data.detail || data.message || 'Error updating milestone');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  const handleSavePlan = async () => {
    const totalPct = builderSteps.reduce((acc, step) => acc + parseInt(step.payment_percentage || 0), 0);
    if (totalPct !== 100) {
      alert(`Total percentage must be exactly 100% (currently ${totalPct}%)`);
      return;
    }
    
    if (builderSteps.some(s => !s.title.trim())) {
      alert("Please provide a title for all milestones");
      return;
    }

    try {
      const res = await fetch(`${API}/api/milestones/vendor/orders/${orderId}/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ milestones: builderSteps }),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.status === 'success') {
        setShowBuilder(false);
        fetchMilestones();
        if (onRefresh) onRefresh();
      } else {
        alert(data.detail || data.message || 'Error saving milestone plan');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  const addBuilderStep = () => {
    setBuilderSteps([...builderSteps, { title: '', description: '', scheduled_date: '', payment_percentage: 0 }]);
  };

  const removeBuilderStep = (index) => {
    setBuilderSteps(builderSteps.filter((_, i) => i !== index));
  };

  const updateBuilderStep = (index, field, value) => {
    const updated = [...builderSteps];
    updated[index][field] = value;
    setBuilderSteps(updated);
  };

  const totalPercentage = builderSteps.reduce((acc, step) => acc + parseInt(step.payment_percentage || 0), 0);

  const completedCount = milestones.filter(m => m.status === 'Approved').length;
  const totalAmountReleased = milestones.filter(m => m.status === 'Approved').reduce((acc, m) => acc + parseFloat(m.payment_amount || 0), 0);

  return (
    <div style={{ borderTop: '1px solid var(--surface-border)', padding: '1.25rem 1.5rem', background: 'rgba(255,255,255,0.01)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '1.1rem' }}>📅</span>
          <span style={{ fontWeight: 600, color: 'var(--text-highlight)', fontSize: '0.9rem' }}>
            Milestones Progress ({completedCount}/{milestones.length || 0} Approved)
          </span>
          {milestones.length > 0 && (
            <span style={{ fontSize: '0.8rem', color: '#2ea043', background: 'rgba(46,160,67,0.12)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(46,160,67,0.25)', fontWeight: 600 }}>
              ₹{totalAmountReleased.toLocaleString()} / ₹{orderAmount.toLocaleString()} Released
            </span>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          {milestones.length === 0 && !['Cancelled', 'Completed'].includes(orderStatus) && (
            <button 
              className="btn" 
              onClick={() => {
                setBuilderSteps([{ title: 'Initial Phase', description: '', scheduled_date: '', payment_percentage: 100 }]);
                setShowBuilder(true);
              }}
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: 'var(--primary-color)' }}
            >
              ➕ Set Milestones Plan
            </button>
          )}

          {milestones.length > 0 && !['Cancelled', 'Completed'].includes(orderStatus) && milestones.every(m => m.status === 'Pending') && (
            <button 
              className="btn" 
              onClick={() => {
                setBuilderSteps(milestones.map(m => ({
                  title: m.title,
                  description: m.description || '',
                  scheduled_date: m.scheduled_date || '',
                  payment_percentage: m.payment_percentage
                })));
                setShowBuilder(true);
              }}
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--surface-border)', color: 'var(--text-primary)' }}
            >
              ✏️ Edit Plan
            </button>
          )}

          <button 
            className="btn" 
            onClick={() => setExpanded(!expanded)}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: 'transparent', border: '1px solid var(--surface-border)', color: 'var(--text-secondary)' }}
          >
            {expanded ? 'Hide Milestones 🔼' : 'Show Milestones 🔽'}
          </button>
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: '1.25rem' }}>
          {loading ? (
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Loading milestones...</div>
          ) : milestones.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '1.5rem', background: 'rgba(0,0,0,0.1)', borderRadius: '8px', border: '1px dashed var(--surface-border)', textAlign: 'center' }}>
              <span style={{ fontSize: '1.8rem' }}>📋</span>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>No milestone payment plan has been set for this service order yet.</p>
              <button 
                className="btn" 
                onClick={() => {
                  setBuilderSteps([{ title: 'Initial Phase', description: '', scheduled_date: '', payment_percentage: 100 }]);
                  setShowBuilder(true);
                }}
                style={{ padding: '0.5rem 1rem', fontSize: '0.82rem', background: 'var(--primary-color)' }}
              >
                Create Milestone Plan
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '2px solid var(--surface-border)', marginLeft: '12px', paddingLeft: '20px', marginTop: '1rem' }}>
              {milestones.map((m, idx) => {
                let statusColor = '#8b949e';
                let statusLabel = 'Pending';
                if (m.status === 'In Progress') { statusColor = '#3b82f6'; statusLabel = 'In Progress'; }
                else if (m.status === 'Done') { statusColor = '#ffd700'; statusLabel = 'Completed - Awaiting Customer Approval'; }
                else if (m.status === 'Approved') { statusColor = '#2ea043'; statusLabel = 'Approved & Released'; }

                return (
                  <div key={m.milestone_id} style={{ position: 'relative', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                    <div style={{ 
                      position: 'absolute', 
                      left: '-29px', 
                      top: '18px', 
                      width: '16px', 
                      height: '16px', 
                      borderRadius: '50%', 
                      background: statusColor,
                      border: '3px solid #0d1117'
                    }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <h5 style={{ margin: '0 0 4px 0', color: 'var(--text-highlight)', fontWeight: 700, fontSize: '0.92rem' }}>
                          {m.title}
                        </h5>
                        <p style={{ margin: '0 0 6px 0', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                          {m.description || 'No description provided'}
                        </p>
                        <div style={{ display: 'flex', gap: '12px', fontSize: '0.78rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                          <span>📅 Target: {m.scheduled_date || 'Not scheduled'}</span>
                          {m.completed_at && <span>Completed: {m.completed_at}</span>}
                          {m.approved_at && <span>Approved: {m.approved_at}</span>}
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                        <span style={{ fontWeight: 800, color: 'var(--primary-color)', fontSize: '0.9rem' }}>
                          ₹{parseFloat(m.payment_amount).toFixed(2)} ({m.payment_percentage}%)
                        </span>
                        <span style={{ 
                          fontSize: '0.72rem', 
                          fontWeight: 700, 
                          color: statusColor, 
                          background: `${statusColor}15`, 
                          border: `1px solid ${statusColor}30`,
                          padding: '2px 8px',
                          borderRadius: '12px'
                        }}>
                          {statusLabel}
                        </span>
                      </div>
                    </div>

                    {(m.status === 'Pending' || m.status === 'In Progress') && (
                      <div style={{ marginTop: '10px', borderTop: '1px dashed var(--surface-border)', paddingTop: '10px' }}>
                        {completingId === m.milestone_id ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '400px' }}>
                            <input 
                              type="text" 
                              placeholder="Add progress note (optional)..." 
                              className="input-field" 
                              style={{ padding: '0.45rem', fontSize: '0.8rem' }}
                              value={vendorNote} 
                              onChange={e => setVendorNote(e.target.value)} 
                            />
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button 
                                className="btn" 
                                onClick={() => handleMarkComplete(m.milestone_id)}
                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', background: '#2ea043' }}
                              >
                                Submit Completion
                              </button>
                              <button 
                                className="btn danger" 
                                onClick={() => { setCompletingId(null); setVendorNote(''); }}
                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button 
                            className="btn" 
                            onClick={() => setCompletingId(m.milestone_id)}
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--surface-border)' }}
                          >
                            🚀 Mark as Completed
                          </button>
                        )}
                      </div>
                    )}

                    {m.vendor_note && (
                      <div style={{ marginTop: '8px', fontSize: '0.78rem', padding: '6px 8px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', borderLeft: '2px solid var(--primary-color)' }}>
                        <strong style={{ color: 'var(--text-highlight)' }}>Vendor Note:</strong> {m.vendor_note}
                      </div>
                    )}
                    {m.customer_note && (
                      <div style={{ marginTop: '6px', fontSize: '0.78rem', padding: '6px 8px', background: 'rgba(46,160,67,0.05)', borderRadius: '4px', borderLeft: '2px solid #2ea043' }}>
                        <strong style={{ color: '#2ea043' }}>Customer Note:</strong> {m.customer_note}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {showBuilder && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.6)' }}>
          <div className="glass-panel" style={{ padding: '2rem', maxWidth: '650px', width: '90%', maxHeight: '85vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <h3 style={{ color: 'var(--text-highlight)', margin: '0 0 4px 0', fontSize: '1.3rem', fontWeight: 800 }}>Create Milestones Plan</h3>
              <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.85rem' }}>
                Split the total order value of <strong>₹{orderAmount.toLocaleString()}</strong> into milestones. The total percentage must sum to exactly 100%.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', maxHeight: '45vh', paddingRight: '4px' }}>
              {builderSteps.map((step, idx) => (
                <div key={idx} style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--surface-border)', display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative' }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ flex: 2 }}>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Milestone Title *</label>
                      <input 
                        type="text" 
                        required 
                        className="input-field" 
                        placeholder="e.g. Foundation Work, Plumbing Stage 1" 
                        style={{ padding: '0.5rem', fontSize: '0.85rem' }}
                        value={step.title} 
                        onChange={e => updateBuilderStep(idx, 'title', e.target.value)} 
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Payment % *</label>
                      <input 
                        type="number" 
                        required 
                        min="1" 
                        max="100" 
                        className="input-field" 
                        placeholder="Percentage" 
                        style={{ padding: '0.5rem', fontSize: '0.85rem' }}
                        value={step.payment_percentage || ''} 
                        onChange={e => updateBuilderStep(idx, 'payment_percentage', parseInt(e.target.value) || 0)} 
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ flex: 2 }}>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Description</label>
                      <input 
                        type="text" 
                        className="input-field" 
                        placeholder="Detail of work to complete..." 
                        style={{ padding: '0.5rem', fontSize: '0.85rem' }}
                        value={step.description} 
                        onChange={e => updateBuilderStep(idx, 'description', e.target.value)} 
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Scheduled Date</label>
                      <input 
                        type="date" 
                        className="input-field" 
                        style={{ padding: '0.5rem', fontSize: '0.85rem' }}
                        value={step.scheduled_date} 
                        onChange={e => updateBuilderStep(idx, 'scheduled_date', e.target.value)} 
                      />
                    </div>
                  </div>

                  {builderSteps.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => removeBuilderStep(idx)}
                      style={{ 
                        position: 'absolute', 
                        top: '8px', 
                        right: '8px', 
                        background: 'none', 
                        border: 'none', 
                        color: '#f85149', 
                        cursor: 'pointer',
                        fontSize: '1.1rem' 
                      }}
                      title="Remove Step"
                    >
                      🗑️
                    </button>
                  )}

                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textAlign: 'right' }}>
                    Calculated Payment: <strong>₹{(orderAmount * (step.payment_percentage || 0) / 100).toFixed(2)}</strong>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--surface-border)', paddingTop: '1rem', flexWrap: 'wrap', gap: '10px' }}>
              <button 
                type="button" 
                className="btn" 
                onClick={addBuilderStep}
                style={{ padding: '0.5rem 1rem', fontSize: '0.82rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--surface-border)', color: 'var(--text-primary)' }}
              >
                ➕ Add Milestone
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Percentage:</span>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: totalPercentage === 100 ? '#2ea043' : '#f85149' }}>
                  {totalPercentage}% / 100%
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button 
                type="button" 
                className="btn" 
                onClick={() => setShowBuilder(false)}
                style={{ background: 'transparent', border: '1px solid var(--surface-border)', color: 'var(--text-secondary)', padding: '0.6rem 1.5rem', fontSize: '0.85rem' }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn" 
                disabled={totalPercentage !== 100}
                onClick={handleSavePlan}
                style={{ 
                  background: totalPercentage === 100 ? 'var(--primary-color)' : 'rgba(255,255,255,0.03)', 
                  border: totalPercentage === 100 ? 'none' : '1px solid var(--surface-border)',
                  color: totalPercentage === 100 ? 'white' : 'var(--text-secondary)',
                  cursor: totalPercentage === 100 ? 'pointer' : 'not-allowed',
                  padding: '0.6rem 1.5rem', 
                  fontSize: '0.85rem' 
                }}
              >
                Save Milestone Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function VendorNegotiationPanel({ orderId, onRefresh }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderTop: '1px solid var(--surface-border)' }}>
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          width: '100%', padding: '0.6rem 1.25rem', background: 'rgba(245,158,11,0.05)',
          border: 'none', borderBottom: open ? '1px solid var(--surface-border)' : 'none',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
          color: 'var(--text-secondary)', fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 600,
          textAlign: 'left',
        }}
      >
        <span>💬</span>
        <span style={{ color: '#f59e0b' }}>Negotiation Chat</span>
        <span style={{ marginLeft: 'auto', fontSize: '0.75rem' }}>{open ? '▲ Hide' : '▼ Show'}</span>
      </button>
      {open && (
        <NegotiationChat
          orderId={orderId}
          role="Vendor"
          canAccept={true}
          onAccepted={onRefresh}
        />
      )}
    </div>
  );
}

function OrderCard({ o, onStatusChange, onPaymentStatus, onBulkAction, onBillUpload, bulkNegotiation, setBulkNegotiation, onRefresh }) {
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

      {o.order_type === 'Service' && (
        <MilestonesSection 
          orderId={o.order_id} 
          orderAmount={parseFloat(o.amount)} 
          orderStatus={o.status}
          onRefresh={onRefresh}
        />
      )}

      {o.is_bulk_request && (
        <VendorNegotiationPanel orderId={o.order_id} onRefresh={onRefresh} />
      )}
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
                onRefresh={fetchOrders}
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
