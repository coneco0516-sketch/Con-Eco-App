import React, { useState, useEffect } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'https://api.coneco.store';

const AdminRFQMonitor = () => {
    const navigate = useNavigate();
    const [rfqs, setRfqs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRfqs = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API}/api/admin/rfq`, { headers: { 'Authorization': `Bearer ${token}` } });
                const data = await res.json();
                setRfqs(data.rfqs || []);
            } catch (error) {
                console.error("Error fetching RFQs:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchRfqs();
    }, []);

    const statusColor = (status) => {
        if (status === 'Open') return { color: '#3fb950', background: 'rgba(46,160,67,0.15)', border: '1px solid rgba(46,160,67,0.3)' };
        if (status === 'Awarded') return { color: '#58a6ff', background: 'rgba(56,112,224,0.15)', border: '1px solid rgba(56,112,224,0.3)' };
        return { color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--surface-border)' };
    };

    if (loading) return (
        <div className="dashboard-layout">
            <AdminSidebar />
            <main style={{ flex: 1, padding: '2rem' }}>
                <div className="glass-panel skeleton-pulse" style={{ height: '300px', borderRadius: '12px' }}></div>
            </main>
        </div>
    );

    return (
        <div className="dashboard-layout">
            <AdminSidebar />
            <main style={{ flex: 1, padding: '2rem', minWidth: 0 }}>
                
                {/* Back Button & Header */}
                <div style={{ marginBottom: '2rem' }}>
                    <button className="btn" onClick={() => navigate('/admin/dashboard')} style={{ marginBottom: '1rem', background: 'transparent', border: '1px solid var(--surface-border)', color: 'var(--text-highlight)', fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                        ← Back to Dashboard
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--surface-border)', paddingBottom: '1.5rem' }}>
                        <div style={{ fontSize: '2.5rem', background: 'rgba(46, 160, 67, 0.15)', padding: '0.5rem 1rem', borderRadius: '12px', border: '1px solid rgba(46, 160, 67, 0.3)' }}>
                            🖥️
                        </div>
                        <div>
                            <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', fontWeight: '800', color: 'var(--text-highlight)', margin: '0 0 0.3rem 0' }}>
                                Global RFQ Monitor
                            </h1>
                            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem' }}>
                                Monitor and audit all active and completed reverse auctions across the platform.
                            </p>
                        </div>
                    </div>
                </div>

                {rfqs.length === 0 ? (
                    <div className="empty-state">
                        <span style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</span>
                        <h3 style={{ color: 'var(--text-highlight)', margin: '0 0 0.5rem' }}>No RFQs Active</h3>
                        <p style={{ margin: 0 }}>There are no reverse auctions running on the platform at the moment.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        {rfqs.map(rfq => (
                            <div key={rfq.rfq_id} className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <span style={{ ...statusColor(rfq.status), padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        {rfq.status}
                                    </span>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{rfq.created_at_fmt}</span>
                                </div>

                                <div>
                                    <h3 style={{ color: 'var(--text-highlight)', margin: '0 0 0.2rem 0', fontSize: '1.1rem', fontWeight: '700', lineHeight: '1.3' }}>{rfq.title}</h3>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--primary-color)', fontWeight: '600' }}>Category: {rfq.category}</span>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem', background: 'rgba(0, 0, 0, 0.2)', borderRadius: '12px', border: '1px solid var(--surface-border)', fontSize: '0.85rem' }}>
                                    <div style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span>👤</span> <strong style={{ color: 'var(--text-highlight)' }}>{rfq.customer_name}</strong>
                                    </div>
                                    <div style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span>📍</span> {rfq.city}, {rfq.state}
                                    </div>
                                    <div style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span>⏱️</span> Required: {rfq.required_by_fmt}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--surface-border)', paddingTop: '1rem', marginTop: 'auto' }}>
                                    <div>
                                        <p style={{ margin: '0 0 0.2rem 0', fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Requirement</p>
                                        <p style={{ margin: 0, color: 'var(--text-highlight)', fontWeight: '700', fontSize: '0.95rem' }}>{rfq.quantity} {rfq.unit}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ margin: '0 0 0.2rem 0', fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Bids</p>
                                        <p style={{ margin: 0, color: '#3fb950', fontWeight: '800', fontSize: '1.2rem' }}>{rfq.bid_count}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminRFQMonitor;
