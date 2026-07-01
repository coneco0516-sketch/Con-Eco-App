import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';

const API = import.meta.env.VITE_API_URL || 'https://api.coneco.store';

const VENDOR_MILESTONES = { 1: 50, 2: 100, 3: 200 };
const CUSTOMER_MILESTONES = { 1: 25, 2: 50, 3: 100 };

function AdminReferrals() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [fulfilling, setFulfilling] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const role = localStorage.getItem('user_role');
    if (!['Super Admin', 'Admin', 'Employee'].includes(role)) {
      navigate('/admin');
      return;
    }
    fetchData();
  }, [navigate]);

  const fetchData = () => {
    setLoading(true);
    fetch(`${API}/api/referrals/admin/all`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (data.status === 'success') setUsers(data.users || []);
      })
      .finally(() => setLoading(false));
  };

  const handleFulfill = async (userId, tier, userName) => {
    if (!window.confirm(`Mark Tier ${tier} prize as fulfilled for ${userName}?`)) return;
    setFulfilling(`${userId}-${tier}`);
    try {
      const resp = await fetch(`${API}/api/referrals/admin/fulfill/${userId}/${tier}`, {
        method: 'PUT',
        credentials: 'include'
      });
      const data = await resp.json();
      if (data.status === 'success') {
        setSuccessMsg(`✅ Tier ${tier} prize for ${userName} marked as fulfilled.`);
        setTimeout(() => setSuccessMsg(''), 4000);
        fetchData();
      }
    } finally {
      setFulfilling(null);
    }
  };

  // Filter users
  const filtered = users.filter(u => {
    if (filterRole !== 'All' && u.role !== filterRole) return false;
    if (filterStatus === 'Has Milestones' && (!u.milestones_achieved || u.milestones_achieved.length === 0)) return false;
    if (filterStatus === 'Pending Prize' && !u.milestones_achieved?.some(m => !m.prize_fulfilled)) return false;
    return true;
  });

  const pendingPrizeCount = users.reduce((acc, u) => {
    return acc + (u.milestones_achieved?.filter(m => !m.prize_fulfilled).length || 0);
  }, 0);

  const milestoneThresholds = (role) => role === 'Vendor' ? VENDOR_MILESTONES : CUSTOMER_MILESTONES;

  return (
    <div className="dashboard-layout">
      <AdminSidebar />
      <main style={{ flex: 1, padding: '2rem' }}>

        {/* Header */}
        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ margin: 0, color: 'var(--text-highlight)', fontSize: '1.8rem', fontWeight: 800 }}>
                🎯 Referral Program Monitor
              </h2>
              <p style={{ margin: '0.4rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Track all referral activity. Mark prizes as fulfilled when awarded.
              </p>
            </div>
            {pendingPrizeCount > 0 && (
              <div style={{
                padding: '0.8rem 1.2rem',
                background: 'rgba(255,165,0,0.1)',
                border: '1px solid rgba(255,165,0,0.4)',
                borderRadius: '10px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffa500' }}>{pendingPrizeCount}</div>
                <div style={{ fontSize: '0.75rem', color: '#ffa500' }}>Prizes Pending</div>
              </div>
            )}
          </div>
        </div>

        {/* Success message */}
        {successMsg && (
          <div style={{
            padding: '0.9rem 1.2rem',
            marginBottom: '1.5rem',
            background: 'rgba(46,160,67,0.12)',
            border: '1px solid rgba(46,160,67,0.4)',
            borderRadius: '8px',
            color: '#3fb950',
            fontWeight: 600
          }}>
            {successMsg}
          </div>
        )}

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { label: 'Total Users', value: users.length, icon: '👥' },
            { label: 'Vendors', value: users.filter(u => u.role === 'Vendor').length, icon: '🏭' },
            { label: 'Customers', value: users.filter(u => u.role === 'Customer').length, icon: '🛒' },
            { label: 'Active Referrers', value: users.filter(u => u.referral_count > 0).length, icon: '🔗' },
            { label: 'Milestones Hit', value: users.reduce((a, u) => a + (u.milestones_achieved?.length || 0), 0), icon: '🏅' },
          ].map(s => (
            <div key={s.label} className="glass-panel" style={{ padding: '1.2rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem' }}>{s.icon}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-highlight)' }}>{loading ? '...' : s.value}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="glass-panel" style={{ padding: '1.2rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <label style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginRight: '0.5rem' }}>Role:</label>
            {['All', 'Vendor', 'Customer'].map(r => (
              <button
                key={r}
                onClick={() => setFilterRole(r)}
                style={{
                  marginRight: '0.4rem',
                  padding: '4px 12px',
                  borderRadius: '6px',
                  background: filterRole === r ? 'var(--primary-color)' : 'transparent',
                  border: `1px solid ${filterRole === r ? 'var(--primary-color)' : 'var(--surface-border)'}`,
                  color: filterRole === r ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: 600
                }}
              >
                {r}
              </button>
            ))}
          </div>
          <div>
            <label style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginRight: '0.5rem' }}>Status:</label>
            {['All', 'Has Milestones', 'Pending Prize'].map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                style={{
                  marginRight: '0.4rem',
                  padding: '4px 12px',
                  borderRadius: '6px',
                  background: filterStatus === s ? 'rgba(255,165,0,0.15)' : 'transparent',
                  border: `1px solid ${filterStatus === s ? '#ffa500' : 'var(--surface-border)'}`,
                  color: filterStatus === s ? '#ffa500' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: 600
                }}
              >
                {s}
              </button>
            ))}
          </div>
          <span style={{ marginLeft: 'auto', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
            Showing {filtered.length} of {users.length}
          </span>
        </div>

        {/* Table */}
        <div className="glass-panel" style={{ padding: '1.5rem', overflowX: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Loading referral data...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📭</div>
              <p>No users match the selected filters.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--surface-border)' }}>
                  {['User', 'Role', 'Referral Code', 'Total Referrals', 'Milestones & Actions'].map(h => (
                    <th key={h} style={{ padding: '0.8rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => {
                  const thresholds = milestoneThresholds(u.role);
                  return (
                    <tr key={u.user_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '1rem 0.8rem' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-highlight)' }}>{u.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{u.email}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Joined: {u.joined_date}</div>
                      </td>
                      <td style={{ padding: '1rem 0.8rem' }}>
                        <span style={{
                          padding: '3px 8px', borderRadius: '5px', fontSize: '0.78rem', fontWeight: 700,
                          background: u.role === 'Vendor' ? 'rgba(56,112,224,0.12)' : 'rgba(46,160,67,0.12)',
                          color: u.role === 'Vendor' ? '#3870e0' : '#3fb950'
                        }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 0.8rem' }}>
                        <span style={{ fontFamily: 'monospace', color: 'var(--text-highlight)', fontWeight: 700, letterSpacing: '1px' }}>
                          {u.referral_code || '—'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 0.8rem', textAlign: 'center' }}>
                        <span style={{
                          fontSize: '1.4rem', fontWeight: 800,
                          color: u.referral_count > 0 ? '#3fb950' : 'var(--text-secondary)'
                        }}>
                          {u.referral_count}
                        </span>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>referrals</div>
                      </td>
                      <td style={{ padding: '1rem 0.8rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          {Object.entries(thresholds).map(([tier, req]) => {
                            const t = parseInt(tier);
                            const achieved = u.milestones_achieved?.find(m => m.tier === t);
                            const fKey = `${u.user_id}-${t}`;
                            if (!achieved) {
                              return (
                                <div key={t} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', padding: '3px 0' }}>
                                  Tier {t}: {u.referral_count}/{req} ({Math.min(100, Math.round((u.referral_count / req) * 100))}%)
                                </div>
                              );
                            }
                            return (
                              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {achieved.prize_fulfilled ? (
                                  <span style={{ fontSize: '0.75rem', color: '#3fb950', fontWeight: 700 }}>
                                    ✅ Tier {t} Fulfilled
                                  </span>
                                ) : (
                                  <>
                                    <span style={{ fontSize: '0.75rem', color: '#ffd700', fontWeight: 700 }}>
                                      🏅 Tier {t} Achieved!
                                    </span>
                                    <button
                                      disabled={fulfilling === fKey}
                                      onClick={() => handleFulfill(u.user_id, t, u.name)}
                                      style={{
                                        padding: '3px 8px',
                                        borderRadius: '5px',
                                        background: 'rgba(46,160,67,0.15)',
                                        border: '1px solid rgba(46,160,67,0.4)',
                                        color: '#3fb950',
                                        cursor: fulfilling === fKey ? 'wait' : 'pointer',
                                        fontSize: '0.72rem',
                                        fontWeight: 700
                                      }}
                                    >
                                      {fulfilling === fKey ? 'Saving...' : 'Mark Fulfilled'}
                                    </button>
                                  </>
                                )}
                              </div>
                            );
                          })}
                          {(!u.milestones_achieved || u.milestones_achieved.length === 0) && u.referral_count === 0 && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>No activity yet</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}

export default AdminReferrals;
