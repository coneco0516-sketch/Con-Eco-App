import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import CustomerSidebar from '../components/CustomerSidebar';
import VendorSidebar from '../components/VendorSidebar';

const API = import.meta.env.VITE_API_URL || 'https://api.coneco.store';

const TIER_CONFIG = {
  Vendor: [
    { tier: 1, required: 50,  icon: '🏆', label: 'Tier 1 Prize', color: '#cd7f32' },
    { tier: 2, required: 100, icon: '🥇', label: 'Tier 2 Prize', color: '#c0c0c0' },
    { tier: 3, required: 200, icon: '👑', label: 'Tier 3 Prize', color: '#ffd700' },
  ],
  Customer: [
    { tier: 1, required: 25,  icon: '🎁', label: 'Tier 1 Prize', color: '#cd7f32' },
    { tier: 2, required: 50,  icon: '🎀', label: 'Tier 2 Prize', color: '#c0c0c0' },
    { tier: 3, required: 100, icon: '💎', label: 'Tier 3 Prize', color: '#ffd700' },
  ],
};

function ReferralPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const role = localStorage.getItem('user_role') || 'Customer';
  const tiers = TIER_CONFIG[role] || TIER_CONFIG.Customer;

  const fetchData = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch(`${API}/api/referrals/my-stats`, { credentials: 'include' }).then(r => r.json()),
      fetch(`${API}/api/referrals/history`, { credentials: 'include' }).then(r => r.json()),
    ]).then(([statsData, historyData]) => {
      if (statsData.status === 'success') setStats(statsData);
      if (historyData.status === 'success') setHistory(historyData.referred_users || []);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('is_logged_in');
    if (!isLoggedIn) { navigate('/login'); return; }
    fetchData();
  }, [navigate, fetchData]);

  const handleCopy = () => {
    if (!stats) return;
    navigator.clipboard.writeText(stats.referral_link);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleWhatsApp = () => {
    if (!stats) return;
    const msg = encodeURIComponent(
      `Join me on ConEco — India's B2B Construction Marketplace! 🏗️\nUse my referral link: ${stats.referral_link}`
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  const handleEmail = () => {
    if (!stats) return;
    const sub = encodeURIComponent('Join ConEco with my referral!');
    const body = encodeURIComponent(
      `Hey!\n\nI'm using ConEco for B2B construction procurement. Join using my referral link:\n\n${stats.referral_link}`
    );
    window.open(`mailto:?subject=${sub}&body=${body}`);
  };

  const Sidebar = role === 'Vendor' ? VendorSidebar : CustomerSidebar;
  const totalReferrals = stats?.total_referrals ?? 0;
  const nextM = stats?.next_milestone;

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main style={{ flex: 1, padding: '2rem' }}>

        {/* ── Page Header ── */}
        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', background: 'linear-gradient(135deg, rgba(46,160,67,0.08) 0%, rgba(56,112,224,0.08) 100%)', border: '1px solid rgba(46,160,67,0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '2rem', color: 'var(--text-highlight)', margin: 0, fontWeight: 800 }}>
                🎯 Referral Loyalty Program
              </h2>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', marginBottom: 0 }}>
                Refer anyone — customers or vendors — and unlock exclusive prizes as you grow!
              </p>
            </div>
            <div style={{
              padding: '1rem 1.5rem',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '12px',
              textAlign: 'center',
              border: '1px solid rgba(46,160,67,0.2)'
            }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#3fb950' }}>
                {loading ? '...' : totalReferrals}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Completed Referrals
              </div>
              {stats?.total_pending_referrals > 0 && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '5px' }}>
                  + {stats.total_pending_referrals} Pending
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>

          {/* ── Referral Code Card ── */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ color: 'var(--text-highlight)', margin: '0 0 1.5rem 0' }}>🔗 Your Referral Link</h3>

            {/* Code Display */}
            <div style={{
              background: 'rgba(0,0,0,0.4)',
              border: '1px dashed rgba(46,160,67,0.5)',
              borderRadius: '12px',
              padding: '1.2rem',
              marginBottom: '1.2rem',
              textAlign: 'center'
            }}>
              <p style={{ margin: '0 0 6px 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Your Unique Code</p>
              <div style={{
                fontFamily: 'monospace',
                fontSize: '2rem',
                fontWeight: 900,
                color: '#3fb950',
                letterSpacing: '5px',
                marginBottom: '10px'
              }}>
                {loading ? '••••••••' : (stats?.referral_code || '••••••••')}
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', wordBreak: 'break-all', padding: '0 0.5rem' }}>
                {stats?.referral_link || ''}
              </p>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <button
                id="referral-page-copy-btn"
                onClick={handleCopy}
                style={{
                  padding: '0.9rem',
                  borderRadius: '10px',
                  background: copied ? 'rgba(46,160,67,0.2)' : 'var(--primary-color)',
                  border: `1px solid ${copied ? '#3fb950' : 'transparent'}`,
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: 700,
                  transition: 'all 0.3s'
                }}
              >
                {copied ? '✅ Link Copied to Clipboard!' : '📋 Copy Referral Link'}
              </button>
              <div style={{ display: 'flex', gap: '0.8rem' }}>
                <button
                  id="referral-page-whatsapp-btn"
                  onClick={handleWhatsApp}
                  style={{
                    flex: 1, padding: '0.8rem', borderRadius: '10px',
                    background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.4)',
                    color: '#25d366', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem'
                  }}
                >
                  📱 Share on WhatsApp
                </button>
                <button
                  id="referral-page-email-btn"
                  onClick={handleEmail}
                  style={{
                    flex: 1, padding: '0.8rem', borderRadius: '10px',
                    background: 'rgba(56,112,224,0.1)', border: '1px solid rgba(56,112,224,0.4)',
                    color: '#3870e0', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem'
                  }}
                >
                  ✉️ Share via Email
                </button>
              </div>
            </div>

            {/* How it Works */}
            <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid var(--surface-border)' }}>
              <h4 style={{ color: 'var(--text-highlight)', margin: '0 0 1rem 0', fontSize: '0.95rem' }}>📖 How It Works</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {[
                  { step: '1', text: 'Share your unique referral link with others', icon: '🔗' },
                  { step: '2', text: 'They register and verify their email on ConEco using your link', icon: '📝' },
                  { step: '3', text: 'You earn a point once they complete 2 orders (Customer) or 3 orders (Vendor)', icon: '✅' },
                  { step: '4', text: 'Reach milestones to unlock exclusive surprise prizes!', icon: '🎁' },
                ].map(item => (
                  <div key={item.step} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.8rem' }}>
                    <span style={{
                      minWidth: '24px', height: '24px',
                      borderRadius: '50%',
                      background: 'var(--primary-color)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.7rem', fontWeight: 800, color: '#fff'
                    }}>{item.step}</span>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                      {item.icon} {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Milestone Tracker ── */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ color: 'var(--text-highlight)', margin: '0 0 0.5rem 0' }}>🏅 Prize Milestones</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem', marginTop: 0 }}>
              Reach each milestone to unlock a special prize. Prizes are revealed when claimed! 🔒
            </p>

            {/* Overall Progress */}
            {nextM && (
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    Progress to Tier {nextM.tier}: <strong style={{ color: 'var(--text-highlight)' }}>{totalReferrals}/{nextM.required}</strong>
                  </span>
                  <span style={{ color: 'var(--primary-color)', fontWeight: 700 }}>
                    {Math.min(100, Math.round((totalReferrals / nextM.required) * 100))}%
                  </span>
                </div>
                <div style={{ height: '10px', borderRadius: '999px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.min(100, Math.round((totalReferrals / nextM.required) * 100))}%`,
                    background: 'linear-gradient(90deg, #2ea043, #3870e0)',
                    borderRadius: '999px',
                    transition: 'width 1s ease',
                    boxShadow: '0 0 12px rgba(46,160,67,0.5)'
                  }} />
                </div>
              </div>
            )}

            {/* Tier Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {tiers.map(({ tier, required, icon, label, color }) => {
                const milestoneData = (stats?.milestones || []).find(m => m.tier === tier);
                const achieved = milestoneData?.achieved;
                const fulfilled = milestoneData?.prize_fulfilled;
                const progress = Math.min(100, Math.round((totalReferrals / required) * 100));

                return (
                  <div key={tier} style={{
                    padding: '1.2rem',
                    borderRadius: '12px',
                    background: achieved ? `rgba(${color === '#ffd700' ? '255,215,0' : color === '#c0c0c0' ? '192,192,192' : '205,127,50'},0.06)` : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${achieved ? color : 'var(--surface-border)'}`,
                    transition: 'all 0.3s'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: achieved ? '0' : '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <span style={{ fontSize: '1.8rem', filter: achieved ? 'none' : 'grayscale(1)', opacity: achieved ? 1 : 0.5 }}>
                          {achieved ? icon : '🔒'}
                        </span>
                        <div>
                          <h4 style={{ margin: 0, color: achieved ? color : 'var(--text-highlight)', fontSize: '0.95rem', fontWeight: 700 }}>
                            {label}
                          </h4>
                          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                            {required} referrals needed
                          </p>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        {achieved ? (
                          <span style={{
                            padding: '4px 10px', borderRadius: '6px',
                            background: fulfilled ? 'rgba(46,160,67,0.15)' : 'rgba(255,215,0,0.1)',
                            color: fulfilled ? '#3fb950' : '#ffd700',
                            border: `1px solid ${fulfilled ? '#3fb950' : '#ffd700'}`,
                            fontSize: '0.75rem', fontWeight: 700
                          }}>
                            {fulfilled ? '✅ Prize Claimed' : '🎉 Achieved!'}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
                            {progress}%
                          </span>
                        )}
                      </div>
                    </div>

                    {!achieved && (
                      <div style={{ height: '5px', borderRadius: '999px', background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', width: `${progress}%`,
                          background: `linear-gradient(90deg, rgba(46,160,67,0.7), ${color})`,
                          borderRadius: '999px', transition: 'width 1s ease'
                        }} />
                      </div>
                    )}

                    {achieved && !fulfilled && (
                      <p style={{ margin: '8px 0 0 0', fontSize: '0.8rem', color: '#ffd700', fontStyle: 'italic' }}>
                        🎊 Our team will reach out to you soon with your surprise prize!
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Referral History Table ── */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ color: 'var(--text-highlight)', margin: '0 0 1.5rem 0' }}>
            📋 Referral History
            <span style={{ marginLeft: '0.8rem', fontSize: '0.85rem', fontWeight: 400, color: 'var(--text-secondary)' }}>
              ({history.length} {role === 'Vendor' ? 'vendor' : 'customer'}{history.length !== 1 ? 's' : ''} referred)
            </span>
          </h3>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Loading history...</div>
          ) : history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌱</div>
              <h4 style={{ color: 'var(--text-highlight)', marginBottom: '0.5rem' }}>No referrals yet!</h4>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>Share your referral link to start earning prizes.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--surface-border)' }}>
                    {['#', 'Name', 'Role', 'Joined', 'Status'].map(h => (
                      <th key={h} style={{ padding: '0.6rem 0.8rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map((u, i) => (
                    <tr key={u.user_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '0.8rem', color: 'var(--text-secondary)' }}>{i + 1}</td>
                      <td style={{ padding: '0.8rem', color: 'var(--text-highlight)', fontWeight: 600 }}>
                        {u.name}
                      </td>
                      <td style={{ padding: '0.8rem' }}>
                        <span style={{
                          padding: '2px 7px', borderRadius: '5px', fontSize: '0.75rem', fontWeight: 700,
                          background: u.referred_role === 'Vendor' ? 'rgba(56,112,224,0.1)' : 'rgba(46,160,67,0.1)',
                          color: u.referred_role === 'Vendor' ? '#3870e0' : '#3fb950'
                        }}>
                          {u.referred_role || '—'}
                        </span>
                      </td>
                      <td style={{ padding: '0.8rem', color: 'var(--text-secondary)' }}>{u.joined_date}</td>
                      <td style={{ padding: '0.8rem' }}>
                        <span style={{
                          padding: '3px 8px', borderRadius: '5px', fontSize: '0.78rem', fontWeight: 700,
                          background: u.is_completed ? 'rgba(46,160,67,0.12)' : (u.email_verified ? 'rgba(56,112,224,0.1)' : 'rgba(210,109,14,0.12)'),
                          color: u.is_completed ? '#3fb950' : (u.email_verified ? '#3870e0' : '#d4a20b'),
                          border: `1px solid ${u.is_completed ? 'rgba(46,160,67,0.3)' : (u.email_verified ? 'rgba(56,112,224,0.3)' : 'rgba(210,109,14,0.3)')}`
                        }}>
                          {u.is_completed ? '✅ Completed' : (u.email_verified ? '⏳ Pending Orders' : '⏳ Pending Verify')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}

export default ReferralPage;
