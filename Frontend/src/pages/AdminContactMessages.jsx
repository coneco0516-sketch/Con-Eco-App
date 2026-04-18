import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';

const API = process.env.REACT_APP_API_URL || '';

function AdminContactMessages() {
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState(null);
  const [replyModal, setReplyModal] = useState({ open: false, message: null });
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState('All');
  const navigate = useNavigate();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('is_logged_in');
    const role = localStorage.getItem('user_role');
    if (!isLoggedIn || role !== 'Admin') {
      navigate('/login');
      return;
    }
    fetchMessages();
  }, [navigate]);

  const fetchMessages = () => {
    fetch(`${API}/api/admin/contact_messages`, { credentials: 'include' })
      .then(res => {
        if (!res.ok) {
          return res.text().then(text => {
            try { return JSON.parse(text); } catch { return { status: 'error', message: `Server error: ${res.status}` }; }
          });
        }
        return res.json();
      })
      .then(data => {
        if (data.status === 'not_logged_in') {
          localStorage.removeItem('is_logged_in');
          navigate('/login');
        } else if (data.status === 'success') {
          setMessages(data.messages || []);
          setUnreadCount(data.unread_count || 0);
          setTotalCount(data.total_count || 0);
          setError(null);
        } else {
          setError(data.message || 'Failed to load messages');
        }
      })
      .catch(err => setError('Network error: ' + err.message));
  };

  const handleMarkRead = (msgId) => {
    fetch(`${API}/api/admin/contact_messages/update_status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ message_id: msgId, status: 'Read' })
    })
      .then(res => res.json())
      .then(() => fetchMessages());
  };

  const handleReply = () => {
    if (!replyText.trim()) return;
    setSending(true);
    fetch(`${API}/api/admin/contact_messages/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ message_id: replyModal.message.message_id, reply: replyText })
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setReplyModal({ open: false, message: null });
          setReplyText('');
          fetchMessages();
        } else {
          alert(data.detail || 'Failed to send reply');
        }
      })
      .catch(() => alert('Network error'))
      .finally(() => setSending(false));
  };

  const filteredMessages = filter === 'All'
    ? messages
    : messages.filter(m => m.status === filter);

  const statusBadge = (status) => {
    const colors = {
      'Unread': { bg: 'rgba(231, 76, 60, 0.2)', color: '#e74c3c', border: '#e74c3c' },
      'Read': { bg: 'rgba(241, 196, 15, 0.2)', color: '#f1c40f', border: '#f1c40f' },
      'Replied': { bg: 'rgba(46, 204, 113, 0.2)', color: '#2ecc71', border: '#2ecc71' }
    };
    const c = colors[status] || colors['Unread'];
    return (
      <span style={{
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '0.8rem',
        fontWeight: '600',
        backgroundColor: c.bg,
        color: c.color,
        border: `1px solid ${c.border}`
      }}>
        {status}
      </span>
    );
  };

  return (
    <div className="dashboard-layout">
      <AdminSidebar />
      <main style={{ flex: 1 }}>
        <h2 style={{ fontSize: '2rem', color: 'var(--text-highlight)', marginTop: 0 }}>Contact Messages</h2>
        <hr style={{ borderColor: 'var(--surface-border)', marginBottom: '1.5rem' }} />

        {error && <p style={{ color: 'var(--danger-color)' }}>{error}</p>}

        {/* Stats */}
        <div className="dashboard-stats-grid">
          <div className="glass-panel" style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.85rem' }}>Total</p>
            <p style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--text-highlight)', margin: '4px 0 0' }}>{totalCount}</p>
          </div>
          <div className="glass-panel" style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.85rem' }}>Unread</p>
            <p style={{ fontSize: '1.8rem', fontWeight: '700', color: '#e74c3c', margin: '4px 0 0' }}>{unreadCount}</p>
          </div>
        </div>

        {/* Filter */}
        <div className="dashboard-row wrap">
          {['All', 'Unread', 'Read', 'Replied'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="btn"
              style={{
                background: filter === f ? 'var(--primary-color)' : 'transparent',
                border: '1px solid var(--surface-border)',
                padding: '6px 16px',
                fontSize: '0.9rem'
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredMessages.length === 0 && (
            <p style={{ color: 'var(--text-secondary)' }}>No messages found.</p>
          )}
          {filteredMessages.map(msg => (
            <div
              key={msg.message_id}
              className="glass-panel"
              style={{
                padding: '1.5rem',
                borderLeft: msg.status === 'Unread' ? '4px solid #e74c3c' : msg.status === 'Replied' ? '4px solid #2ecc71' : '4px solid #f1c40f'
              }}
            >
              <div className="dashboard-header-row" style={{ marginBottom: '0.8rem' }}>
                <div>
                  <span style={{ fontWeight: '700', color: 'var(--text-highlight)', fontSize: '1.1rem' }}>{msg.name}</span>
                  <span style={{ color: 'var(--text-secondary)', marginLeft: '1rem', fontSize: '0.9rem' }}>{msg.email}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  {statusBadge(msg.status)}
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{msg.date}</span>
                </div>
              </div>
              <p style={{ color: 'var(--text-primary)', lineHeight: '1.6', whiteSpace: 'pre-wrap', margin: '0 0 1rem 0' }}>{msg.message}</p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {msg.status === 'Unread' && (
                  <button
                    onClick={() => handleMarkRead(msg.message_id)}
                    className="btn"
                    style={{ background: '#f39c12', padding: '5px 14px', fontSize: '0.85rem' }}
                  >
                    Mark as Read
                  </button>
                )}
                {msg.status !== 'Replied' && (
                  <button
                    onClick={() => { setReplyModal({ open: true, message: msg }); setReplyText(''); }}
                    className="btn"
                    style={{ background: '#3498db', padding: '5px 14px', fontSize: '0.85rem' }}
                  >
                    Reply
                  </button>
                )}
                {msg.status === 'Replied' && (
                  <span style={{ color: '#2ecc71', fontSize: '0.85rem', fontStyle: 'italic' }}>✓ Replied</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Reply Modal */}
        {replyModal.open && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 1000
          }}>
            <div className="glass-panel" style={{ width: '600px', maxWidth: '90vw', padding: '2rem' }}>
              <h3 style={{ color: 'var(--text-highlight)', marginTop: 0 }}>Reply to {replyModal.message?.name}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                To: {replyModal.message?.email}
              </p>
              <div style={{
                background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px',
                marginBottom: '1rem', borderLeft: '3px solid var(--primary-color)'
              }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 4px 0' }}>Original Message:</p>
                <p style={{ color: 'var(--text-primary)', margin: 0, whiteSpace: 'pre-wrap' }}>{replyModal.message?.message}</p>
              </div>
              <textarea
                className="input-field"
                rows="5"
                placeholder="Type your response..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                style={{ marginBottom: '1rem' }}
              ></textarea>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '1rem' }}>
                This reply will be sent as an official ConEco support email to the user.
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setReplyModal({ open: false, message: null })}
                  className="btn"
                  style={{ background: 'transparent', border: '1px solid var(--surface-border)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleReply}
                  className="btn"
                  style={{ background: '#3498db' }}
                  disabled={sending || !replyText.trim()}
                >
                  {sending ? 'Sending...' : 'Send Reply'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminContactMessages;
