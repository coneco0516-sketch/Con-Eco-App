import React, { useState, useEffect, useCallback, useRef } from 'react';

const API = import.meta.env.VITE_API_URL || 'https://api.coneco.store';

/**
 * NegotiationChat — WhatsApp-style chat thread for bulk order negotiations.
 *
 * Props:
 *   orderId     — the order this chat is linked to
 *   role        — 'Vendor' or 'Customer'
 *   canAccept   — if true (Vendor), shows Accept button on price-offer bubbles
 *   onAccepted  — callback fired when vendor accepts a price offer
 */
export default function NegotiationChat({ orderId, role, canAccept = false, onAccepted }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [showPriceInput, setShowPriceInput] = useState(false);
  const [sending, setSending] = useState(false);
  const [acceptingId, setAcceptingId] = useState(null);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/negotiations/${orderId}`, { credentials: 'include' });
      const data = await res.json();
      if (data.status === 'success') {
        setMessages(data.messages || []);
      }
    } catch (_) {}
  }, [orderId]);

  // Initial load + 5-second polling
  useEffect(() => {
    setLoading(true);
    fetchMessages().finally(() => setLoading(false));
    pollRef.current = setInterval(fetchMessages, 5000);
    return () => clearInterval(pollRef.current);
  }, [fetchMessages]);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim() && !offerPrice) return;
    setSending(true);
    try {
      const res = await fetch(`${API}/api/negotiations/${orderId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim() || null,
          offer_price: offerPrice ? parseFloat(offerPrice) : null,
        }),
        credentials: 'include',
      });
      const data = await res.json();
      if (data.status === 'success') {
        setText('');
        setOfferPrice('');
        setShowPriceInput(false);
        fetchMessages();
      } else {
        alert(data.detail || 'Failed to send message');
      }
    } catch (_) {
      alert('Network error');
    } finally {
      setSending(false);
    }
  };

  const handleAccept = async (msgId) => {
    setAcceptingId(msgId);
    try {
      const res = await fetch(`${API}/api/negotiations/${orderId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ msg_id: msgId }),
        credentials: 'include',
      });
      const data = await res.json();
      if (data.status === 'success') {
        fetchMessages();
        if (onAccepted) onAccepted();
      } else {
        alert(data.detail || 'Failed to accept offer');
      }
    } catch (_) {
      alert('Network error');
    } finally {
      setAcceptingId(null);
    }
  };

  // Build price audit trail from messages that have an offer_price
  const priceHistory = messages.filter(m => m.offer_price != null);

  return (
    <div style={{ borderTop: '1px solid var(--surface-border)', background: 'rgba(0,0,0,0.1)' }}>
      <style>{`
        @keyframes bubbleIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        .neg-bubble { animation: bubbleIn 0.2s ease-out; }
      `}</style>

      {/* Header */}
      <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--surface-border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '1rem' }}>💬</span>
        <span style={{ fontWeight: 700, color: 'var(--text-highlight)', fontSize: '0.88rem' }}>Negotiation Chat</span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: 'auto' }}>Updates every 5s</span>
      </div>

      {/* Message Thread */}
      <div style={{ maxHeight: '320px', overflowY: 'auto', padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {loading && messages.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', textAlign: 'center', margin: '1rem 0' }}>Loading messages...</p>
        ) : messages.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', textAlign: 'center', margin: '1rem 0' }}>
            No messages yet. Start the negotiation below.
          </p>
        ) : (
          messages.map(m => {
            const isMe = m.sender_role === role;
            const isOffer = m.offer_price != null;

            return (
              <div
                key={m.msg_id}
                className="neg-bubble"
                style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}
              >
                {/* Sender label */}
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '3px', fontWeight: 600 }}>
                  {isMe ? 'You' : m.sender_name} · {m.created_at}
                </span>

                {/* Bubble */}
                {isOffer ? (
                  <div style={{
                    maxWidth: '80%',
                    background: m.is_accepted ? 'rgba(46,160,67,0.15)' : 'rgba(245,158,11,0.15)',
                    border: `1px solid ${m.is_accepted ? 'rgba(46,160,67,0.35)' : 'rgba(245,158,11,0.35)'}`,
                    borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    padding: '0.6rem 0.9rem',
                  }}>
                    <div style={{ fontSize: '0.75rem', color: m.is_accepted ? '#2ea043' : '#f59e0b', fontWeight: 700, marginBottom: '3px' }}>
                      {m.is_accepted ? '✅ PRICE ACCEPTED' : '💰 PRICE OFFER'}
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-highlight)' }}>
                      ₹{parseFloat(m.offer_price).toLocaleString()} / unit
                    </div>
                    {m.message && (
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{m.message}</p>
                    )}
                    {/* Accept button — visible only to vendor on unaccepted offers */}
                    {canAccept && !m.is_accepted && (
                      <button
                        onClick={() => handleAccept(m.msg_id)}
                        disabled={acceptingId === m.msg_id}
                        style={{
                          marginTop: '8px',
                          padding: '0.35rem 0.9rem',
                          background: '#2ea043',
                          border: 'none',
                          borderRadius: '6px',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                        }}
                      >
                        {acceptingId === m.msg_id ? 'Accepting...' : '✅ Accept This Price'}
                      </button>
                    )}
                  </div>
                ) : (
                  <div style={{
                    maxWidth: '80%',
                    background: isMe ? 'rgba(var(--primary-rgb,56,189,248),0.12)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${isMe ? 'rgba(var(--primary-rgb,56,189,248),0.25)' : 'var(--surface-border)'}`,
                    borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    padding: '0.5rem 0.8rem',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    lineHeight: 1.45,
                  }}>
                    {m.message}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Price Audit Trail */}
      {priceHistory.length > 0 && (
        <div style={{ margin: '0 1.25rem', padding: '0.6rem 0.9rem', background: 'rgba(0,0,0,0.15)', borderRadius: '8px', border: '1px solid var(--surface-border)', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
          <span style={{ fontWeight: 700, color: 'var(--text-highlight)' }}>📊 Price Trail: </span>
          {priceHistory.map((m, i) => (
            <span key={m.msg_id}>
              <span style={{ color: m.is_accepted ? '#2ea043' : '#f59e0b', fontWeight: 600 }}>
                ₹{parseFloat(m.offer_price).toLocaleString()}
                {m.is_accepted ? ' ✅' : ''}
              </span>
              {i < priceHistory.length - 1 && <span style={{ color: 'var(--text-secondary)' }}> → </span>}
            </span>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--surface-border)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {showPriceInput && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: 600, whiteSpace: 'nowrap' }}>₹ Offer per unit:</span>
            <input
              type="number"
              className="input-field"
              placeholder="e.g. 480"
              value={offerPrice}
              onChange={e => setOfferPrice(e.target.value)}
              style={{ flex: 1, padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
            />
          </div>
        )}
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            className="input-field"
            placeholder="Type a message..."
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            style={{ flex: 1, padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
          />
          <button
            onClick={() => setShowPriceInput(p => !p)}
            title="Counter-offer price"
            style={{
              padding: '0.5rem 0.7rem',
              background: showPriceInput ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${showPriceInput ? 'rgba(245,158,11,0.4)' : 'var(--surface-border)'}`,
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              color: showPriceInput ? '#f59e0b' : 'var(--text-secondary)',
            }}
          >
            ₹
          </button>
          <button
            onClick={handleSend}
            disabled={sending || (!text.trim() && !offerPrice)}
            className="btn"
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.85rem',
              background: 'var(--primary-color)',
              opacity: sending || (!text.trim() && !offerPrice) ? 0.5 : 1,
            }}
          >
            {sending ? '...' : 'Send'}
          </button>
        </div>
        <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
          Press <kbd style={{ padding: '1px 5px', background: 'rgba(255,255,255,0.07)', borderRadius: '3px', border: '1px solid var(--surface-border)', fontSize: '0.7rem' }}>₹</kbd> to attach a counter-offer price to your message.
        </p>
      </div>
    </div>
  );
}
