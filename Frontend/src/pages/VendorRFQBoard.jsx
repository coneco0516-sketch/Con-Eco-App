import React, { useState, useEffect } from 'react';
import VendorSidebar from '../components/VendorSidebar';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'https://api.coneco.store';

const VendorRFQBoard = () => {
    const navigate = useNavigate();
    const [rfqs, setRfqs] = useState([]);
    const [myBids, setMyBids] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('available');
    const [showBidModal, setShowBidModal] = useState(false);
    const [selectedRfq, setSelectedRfq] = useState(null);
    const [bidData, setBidData] = useState({ unit_price: '', delivery_days: '', note: '' });

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const [rfqRes, bidsRes] = await Promise.all([
                fetch(`${API}/api/vendor/rfq`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API}/api/vendor/rfq/my_bids`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);
            const rfqData = await rfqRes.json();
            const bidsData = await bidsRes.json();
            setRfqs(rfqData.rfqs || []);
            setMyBids(bidsData.bids || []);
        } catch (error) {
            console.error("Error fetching RFQ data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleBidSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API}/api/vendor/rfq/bid`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ rfq_id: selectedRfq.rfq_id, unit_price: parseFloat(bidData.unit_price), delivery_days: parseInt(bidData.delivery_days), note: bidData.note })
            });
            const data = await res.json();
            if (data.status === 'success') {
                alert("Bid submitted successfully!");
                setShowBidModal(false);
                setBidData({ unit_price: '', delivery_days: '', note: '' });
                fetchData();
            } else {
                alert(data.message || "Failed to submit bid");
            }
        } catch (error) {
            alert("Failed to submit bid");
        }
    };

    const openBidModal = (rfq) => {
        setSelectedRfq(rfq);
        setBidData({ unit_price: '', delivery_days: '', note: '' });
        setShowBidModal(true);
    };

    const inputStyle = {
        width: '100%', padding: '0.8rem 1rem', borderRadius: '8px',
        background: 'var(--input-bg)', border: '1px solid var(--surface-border)',
        color: 'var(--text-highlight)', fontSize: '0.95rem', outline: 'none',
        boxSizing: 'border-box', fontFamily: 'inherit'
    };

    const bidStatusStyle = (status) => {
        if (status === 'Pending') return { color: '#ffd700', background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.3)' };
        if (status === 'Accepted') return { color: '#3fb950', background: 'rgba(46,160,67,0.15)', border: '1px solid rgba(46,160,67,0.3)' };
        return { color: '#f85149', background: 'rgba(248,81,73,0.1)', border: '1px solid rgba(248,81,73,0.3)' };
    };

    if (loading) return (
        <div className="dashboard-layout">
            <VendorSidebar />
            <main style={{ flex: 1, padding: '2rem' }}>
                <div className="glass-panel skeleton-pulse" style={{ height: '300px', borderRadius: '12px' }}></div>
            </main>
        </div>
    );

    return (
        <div className="dashboard-layout">
            <VendorSidebar />
            <main style={{ flex: 1, padding: '2rem', minWidth: 0 }}>

                {/* Header */}
                <div style={{ marginBottom: '2rem' }}>
                    <button className="btn" onClick={() => navigate('/vendor')} style={{ marginBottom: '1rem', background: 'transparent', border: '1px solid var(--surface-border)', color: 'var(--text-highlight)', fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                        ← Back to Dashboard
                    </button>
                    <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', fontWeight: '800', color: 'var(--text-highlight)', margin: '0 0 0.3rem 0' }}>
                        🔔 RFQ Board
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem' }}>
                        View bulk purchase requests matching your category and location. Submit competitive bids to win orders.
                    </p>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid var(--surface-border)', marginBottom: '2rem', gap: '0.5rem' }}>
                    {['available', 'bids'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                padding: '0.8rem 1.5rem', background: 'none', border: 'none', cursor: 'pointer',
                                fontFamily: 'inherit', fontSize: '1rem', fontWeight: '700', transition: 'all 0.2s',
                                color: activeTab === tab ? 'var(--primary-color)' : 'var(--text-secondary)',
                                borderBottom: activeTab === tab ? '2px solid var(--primary-color)' : '2px solid transparent',
                                marginBottom: '-1px'
                            }}
                        >
                            {tab === 'available' ? `📋 Available RFQs (${rfqs.length})` : `📨 My Bids (${myBids.length})`}
                        </button>
                    ))}
                </div>

                {/* Available RFQs Tab */}
                {activeTab === 'available' && (
                    rfqs.length === 0 ? (
                        <div className="empty-state">
                            <span style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</span>
                            <h3 style={{ color: 'var(--text-highlight)', margin: '0 0 0.5rem' }}>No Matching RFQs</h3>
                            <p style={{ margin: 0 }}>There are currently no open requests in your city matching your product categories.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                            {rfqs.map(rfq => (
                                <div key={rfq.rfq_id} className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <h3 style={{ margin: 0, color: 'var(--text-highlight)', fontSize: '1.05rem', fontWeight: '700', lineHeight: '1.3', flex: 1 }}>{rfq.title}</h3>
                                        <span style={{ marginLeft: '0.8rem', padding: '0.2rem 0.7rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '700', background: 'rgba(46,160,67,0.12)', color: 'var(--primary-color)', border: '1px solid rgba(46,160,67,0.25)', whiteSpace: 'nowrap' }}>
                                            {rfq.category}
                                        </span>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                                        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '0.8rem' }}>
                                            <p style={{ margin: '0 0 0.2rem', fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Requirement</p>
                                            <p style={{ margin: 0, color: 'var(--text-highlight)', fontWeight: '700', fontSize: '1rem' }}>{rfq.quantity} {rfq.unit}</p>
                                        </div>
                                        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '0.8rem' }}>
                                            <p style={{ margin: '0 0 0.2rem', fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Required By</p>
                                            <p style={{ margin: 0, color: 'var(--text-highlight)', fontWeight: '600', fontSize: '0.88rem' }}>⏱️ {rfq.required_by_fmt}</p>
                                        </div>
                                    </div>

                                    <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '10px', padding: '0.8rem', border: '1px solid var(--surface-border)' }}>
                                        <p style={{ margin: '0 0 0.3rem', fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Description</p>
                                        <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.85rem', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{rfq.description}</p>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>📍 {rfq.cust_city}, {rfq.cust_state}</span>
                                        <button onClick={() => openBidModal(rfq)} className="btn" style={{ padding: '0.6rem 1.4rem', fontSize: '0.9rem', fontWeight: '700', boxShadow: '0 4px 10px var(--accent-glow)' }}>
                                            Submit Bid
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}

                {/* My Bids Tab */}
                {activeTab === 'bids' && (
                    myBids.length === 0 ? (
                        <div className="empty-state">
                            <span style={{ fontSize: '3rem', marginBottom: '1rem' }}>📨</span>
                            <h3 style={{ color: 'var(--text-highlight)', margin: '0 0 0.5rem' }}>No Bids Submitted</h3>
                            <p style={{ margin: 0 }}>You haven't submitted any bids yet. Browse available RFQs to start bidding.</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--surface-border)' }}>
                                        {['RFQ Details', 'My Bid (₹)', 'Delivery', 'Status', 'Date'].map(h => (
                                            <th key={h} style={{ padding: '0.8rem 1rem', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {myBids.map(bid => (
                                        <tr key={bid.bid_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s' }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <td style={{ padding: '1rem' }}>
                                                <p style={{ margin: '0 0 0.2rem', color: 'var(--text-highlight)', fontWeight: '600', fontSize: '0.9rem' }}>{bid.title}</p>
                                                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.78rem' }}>{bid.quantity} {bid.unit} • {bid.category}</p>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <p style={{ margin: '0 0 0.2rem', color: '#3fb950', fontWeight: '700' }}>₹{parseFloat(bid.total_price).toLocaleString('en-IN')}</p>
                                                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.78rem' }}>₹{parseFloat(bid.unit_price).toLocaleString('en-IN')}/{bid.unit}</p>
                                            </td>
                                            <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>{bid.delivery_days} days</td>
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{ ...bidStatusStyle(bid.status), padding: '0.25rem 0.7rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                    {bid.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{bid.bid_date}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                )}

                {/* Bid Submission Modal */}
                {showBidModal && selectedRfq && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
                        <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', borderRadius: '20px', padding: 0, overflow: 'hidden' }}>
                            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2 style={{ margin: 0, color: 'var(--text-highlight)', fontSize: '1.3rem', fontWeight: '800' }}>💰 Submit Your Bid</h2>
                                <button onClick={() => setShowBidModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: 'var(--text-secondary)', lineHeight: 1 }}>✕</button>
                            </div>

                            <div style={{ padding: '1.5rem 2rem', background: 'rgba(46,160,67,0.04)', borderBottom: '1px solid var(--surface-border)' }}>
                                <p style={{ margin: '0 0 0.2rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Requesting</p>
                                <p style={{ margin: 0, color: 'var(--text-highlight)', fontWeight: '700', fontSize: '1.1rem' }}>
                                    {selectedRfq.quantity} {selectedRfq.unit} of {selectedRfq.category}
                                </p>
                            </div>

                            <form onSubmit={handleBidSubmit} style={{ padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                        Unit Price (₹ per {selectedRfq.unit})
                                    </label>
                                    <input type="number" required step="0.01" min="1" placeholder="e.g. 500" style={inputStyle} value={bidData.unit_price} onChange={e => setBidData({ ...bidData, unit_price: e.target.value })} />
                                    {bidData.unit_price && (
                                        <p style={{ margin: '0.4rem 0 0', color: 'var(--primary-color)', fontSize: '0.88rem', fontWeight: '600' }}>
                                            Total Bid: ₹{(parseFloat(bidData.unit_price) * selectedRfq.quantity).toLocaleString('en-IN')}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Delivery Time (Days)</label>
                                    <input type="number" required min="1" placeholder="e.g. 3" style={inputStyle} value={bidData.delivery_days} onChange={e => setBidData({ ...bidData, delivery_days: e.target.value })} />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Notes to Customer (Optional)</label>
                                    <textarea rows="2" placeholder="Brand, quality grade, terms..." style={{ ...inputStyle, resize: 'vertical' }} value={bidData.note} onChange={e => setBidData({ ...bidData, note: e.target.value })}></textarea>
                                </div>

                                <button type="submit" className="btn" style={{ width: '100%', padding: '0.9rem', fontSize: '1rem', fontWeight: '800', boxShadow: '0 4px 15px var(--accent-glow)', marginTop: '0.5rem' }}>
                                    🚀 Place Bid
                                </button>
                            </form>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
};

export default VendorRFQBoard;
