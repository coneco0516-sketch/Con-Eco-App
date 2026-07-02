import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'https://api.coneco.store';

/* ─── Tier config (role-specific) ────────────────────────────────────────── */
const TIER_CONFIG = {
  Vendor: [
    { tier: 1, required: 50,  icon: '🏆', label: 'Tier 1' },
    { tier: 2, required: 100, icon: '🥇', label: 'Tier 2' },
    { tier: 3, required: 200, icon: '👑', label: 'Tier 3' },
  ],
  Customer: [
    { tier: 1, required: 25,  icon: '🎁', label: 'Tier 1' },
    { tier: 2, required: 50,  icon: '🎀', label: 'Tier 2' },
    { tier: 3, required: 100, icon: '💎', label: 'Tier 3' },
  ],
};

function ReferralCard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const role = localStorage.getItem('user_role') || 'Customer';
  const tiers = TIER_CONFIG[role] || TIER_CONFIG.Customer;

  useEffect(() => {
    fetch(`${API}/api/referrals/my-stats`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (data.status === 'success') setStats(data);
      })
      .catch(err => console.error('Referral stats error:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = () => {
    if (!stats) return;
    navigator.clipboard.writeText(stats.referral_link || stats.referral_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsApp = () => {
    if (!stats) return;
    const msg = encodeURIComponent(
      `Join me on ConEco — India's B2B Construction Marketplace! 🏗️\nUse my referral link to get started: ${stats.referral_link}`
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  const handleEmail = () => {
    if (!stats) return;
    const subject = encodeURIComponent('Join ConEco with my referral!');
    const body = encodeURIComponent(
      `Hey!\n\nI'm using ConEco for B2B construction procurement and it's been great. Join using my referral link:\n\n${stats.referral_link}\n\nSee you there!`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  /* ── Next milestone progress ── */
  const nextM = stats?.next_milestone;
  const totalReferrals = stats?.total_referrals ?? 0;
  const pendingReferrals = stats?.total_pending_referrals ?? 0;
  const progressPct = nextM
    ? Math.min(100, Math.round((totalReferrals / nextM.required) * 100))
    : 100;

  return (
    <div
      className="glass-panel"
      style={{
        padding: '1.8rem',
        background: 'linear-gradient(135deg, rgba(46,160,67,0.07) 0%, rgba(56,112,224,0.07) 100%)',
        border: '1px solid rgba(46,160,67,0.25)',
        borderRadius: '16px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative glow blob */}
      <div style={{
        position: 'absolute', top: '-30px', right: '-30px',
        width: '120px', height: '120px',
        background: 'radial-gradient(circle, rgba(46,160,67,0.15) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none'
      }} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.2rem' }}>
        <div>
          <h3 style={{ margin: 0, color: 'var(--text-highlight)', fontSize: '1.15rem', fontWeight: 800 }}>
            🎯 Referral Program
          </h3>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
            Refer anyone to ConEco • Unlock exclusive prizes
          </p>
        </div>
        <Link
          to="/referral"
          style={{
            fontSize: '0.78rem',
            color: 'var(--primary-color)',
            textDecoration: 'none',
            fontWeight: 700,
            padding: '4px 10px',
            border: '1px solid var(--primary-color)',
            borderRadius: '6px',
            whiteSpace: 'nowrap'
          }}
        >
          Full Dashboard →
        </Link>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)' }}>
          Loading your referral stats...
        </div>
      ) : (
        <>
          {/* Referral Code Box */}
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            border: '1px dashed rgba(46,160,67,0.4)',
            borderRadius: '10px',
            padding: '0.9rem 1.1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.2rem',
            gap: '0.5rem'
          }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '2px' }}>Your Referral Code</p>
              <span style={{
                fontFamily: 'monospace',
                fontSize: '1.3rem',
                fontWeight: 800,
                color: '#3fb950',
                letterSpacing: '3px'
              }}>
                {stats?.referral_code || '--------'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                id="referral-copy-btn"
                onClick={handleCopy}
                title="Copy referral link"
                style={{
                  padding: '6px 12px',
                  borderRadius: '7px',
                  background: copied ? 'rgba(46,160,67,0.2)' : 'rgba(255,255,255,0.07)',
                  border: `1px solid ${copied ? '#3fb950' : 'var(--surface-border)'}`,
                  color: copied ? '#3fb950' : 'var(--text-highlight)',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  transition: 'all 0.2s'
                }}
              >
                {copied ? '✅ Copied!' : '📋 Copy Link'}
              </button>
            </div>
          </div>

          {/* Share Buttons */}
          <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.4rem' }}>
            <button
              id="referral-whatsapp-btn"
              onClick={handleWhatsApp}
              style={{
                flex: 1, padding: '7px', borderRadius: '8px',
                background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.3)',
                color: '#25d366', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700
              }}
            >
              📱 WhatsApp
            </button>
            <button
              id="referral-email-btn"
              onClick={handleEmail}
              style={{
                flex: 1, padding: '7px', borderRadius: '8px',
                background: 'rgba(56,112,224,0.1)', border: '1px solid rgba(56,112,224,0.3)',
                color: '#3870e0', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700
              }}
            >
              ✉️ Email
            </button>
          </div>

          {/* Progress Bar */}
          <div style={{ marginBottom: '1.2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.82rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>
                {nextM
                  ? <>You have <strong style={{ color: 'var(--text-highlight)' }}>{totalReferrals}</strong> completed / {nextM.required} <span style={{fontSize: '0.75rem', opacity: 0.8}}>({pendingReferrals} pending)</span></>
                  : <span style={{ color: '#ffd700' }}>🎉 All milestones achieved! <span style={{fontSize: '0.75rem', opacity: 0.8}}>({pendingReferrals} pending)</span></span>}
              </span>
              {nextM && (
                <span style={{ color: 'var(--primary-color)', fontWeight: 700 }}>
                  {nextM.remaining} more to go
                </span>
              )}
            </div>
            <div style={{
              height: '8px', borderRadius: '999px',
              background: 'rgba(255,255,255,0.06)',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${progressPct}%`,
                background: 'linear-gradient(90deg, #2ea043, #3870e0)',
                borderRadius: '999px',
                transition: 'width 0.8s cubic-bezier(.4,0,.2,1)',
                boxShadow: '0 0 8px rgba(46,160,67,0.5)'
              }} />
            </div>
          </div>

          {/* Tier Badges */}
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            {tiers.map(({ tier, icon, label, required }) => {
              const achieved = (stats?.milestones || []).find(m => m.tier === tier && m.achieved);
              return (
                <div
                  key={tier}
                  title={achieved ? `Achieved at ${required} referrals! 🎉` : `${required} referrals needed`}
                  style={{
                    flex: '1 1 80px',
                    padding: '8px 6px',
                    textAlign: 'center',
                    borderRadius: '10px',
                    background: achieved ? 'rgba(46,160,67,0.12)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${achieved ? 'rgba(46,160,67,0.4)' : 'rgba(255,255,255,0.07)'}`,
                    transition: 'all 0.3s'
                  }}
                >
                  <div style={{ fontSize: achieved ? '1.4rem' : '1.2rem', marginBottom: '2px', filter: achieved ? 'none' : 'grayscale(1)' }}>
                    {achieved ? icon : '🔒'}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: achieved ? '#3fb950' : 'var(--text-secondary)', fontWeight: 700 }}>
                    {label}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                    {required} refs
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default ReferralCard;
