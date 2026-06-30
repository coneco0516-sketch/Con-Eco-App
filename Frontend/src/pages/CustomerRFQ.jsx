import React, { useState, useEffect } from 'react';
import CustomerSidebar from '../components/CustomerSidebar';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'https://api.coneco.store';

const CustomerRFQ = () => {
    const navigate = useNavigate();
    const [rfqs, setRfqs] = useState([]);
    const [sites, setSites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedRfq, setSelectedRfq] = useState(null);
    const [bids, setBids] = useState([]);
    const [loadingBids, setLoadingBids] = useState(false);

    const [formData, setFormData] = useState({
        item_type: 'Product', category: 'Cement', title: '', description: '',
        quantity: 1, unit: 'Tons', required_by: '', site_id: '',
        delivery_address: '', city: '', state: ''
    });

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const [rfqRes, siteRes] = await Promise.all([
                fetch(`${API}/api/customer/rfq`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API}/api/customer/sites`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);
            const rfqData = await rfqRes.json();
            const siteData = await siteRes.json();
            setRfqs(rfqData.rfqs || []);
            setSites(siteData.sites || []);
        } catch (error) {
            console.error("Error fetching RFQ data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSiteChange = (e) => {
        const siteId = e.target.value;
        const site = sites.find(s => s.site_id.toString() === siteId);
        if (site) {
            setFormData({ ...formData, site_id: siteId, delivery_address: site.site_address || '', city: site.city || '', state: site.state || '' });
        } else {
            setFormData({ ...formData, site_id: '', delivery_address: '', city: '', state: '' });
        }
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API}/api/customer/rfq`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (data.status === 'success') {
                setShowCreateModal(false);
                fetchData();
                setFormData({ item_type: 'Product', category: 'Cement', title: '', description: '', quantity: 1, unit: 'Tons', required_by: '', site_id: '', delivery_address: '', city: '', state: '' });
            } else {
                alert(data.message || "Failed to create RFQ");
            }
        } catch (error) {
            alert("Failed to create RFQ");
        }
    };

    const viewBids = async (rfq) => {
        setSelectedRfq(rfq);
        setLoadingBids(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API}/api/customer/rfq/${rfq.rfq_id}/bids`, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            setBids(data.bids || []);
        } catch (error) {
            console.error("Error fetching bids:", error);
        } finally {
            setLoadingBids(false);
        }
    };

    const acceptBid = async (bidId) => {
        if (!window.confirm("Accept this bid? It will automatically generate an order.")) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API}/api/customer/rfq/accept_bid`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ rfq_id: selectedRfq.rfq_id, bid_id: bidId })
            });
            const data = await res.json();
            if (data.status === 'success') {
                alert(data.message);
                setSelectedRfq(null);
                fetchData();
            } else {
                alert(data.message || "Failed to accept bid");
            }
        } catch (error) {
            alert("Failed to accept bid");
        }
    };

    const statusColor = (status) => {
        if (status === 'Open') return { color: '#3fb950', background: 'rgba(46,160,67,0.15)', border: '1px solid rgba(46,160,67,0.3)' };
        if (status === 'Awarded') return { color: '#58a6ff', background: 'rgba(56,112,224,0.15)', border: '1px solid rgba(56,112,224,0.3)' };
        return { color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--surface-border)' };
    };

    const inputStyle = {
        width: '100%', padding: '0.8rem 1rem', borderRadius: '8px',
        background: 'var(--input-bg)', border: '1px solid var(--surface-border)',
        color: 'var(--text-highlight)', fontSize: '0.95rem', outline: 'none',
        boxSizing: 'border-box', fontFamily: 'inherit'
    };

    if (loading) return (
        <div className="dashboard-layout">
            <CustomerSidebar />
            <main style={{ flex: 1, padding: '2rem' }}>
                <div className="glass-panel skeleton-pulse" style={{ height: '300px', borderRadius: '12px' }}></div>
            </main>
        </div>
    );

    return (
        <div className="dashboard-layout">
            <CustomerSidebar />
            <main style={{ flex: 1, padding: '2rem', minWidth: 0 }}>

                {/* Header */}
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '2rem' }}>
                    <div>
                        <button className="btn" onClick={() => navigate('/customer')} style={{ marginBottom: '1rem', background: 'transparent', border: '1px solid var(--surface-border)', color: 'var(--text-highlight)', fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                            ← Back to Dashboard
                        </button>
                        <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', fontWeight: '800', color: 'var(--text-highlight)', margin: '0 0 0.3rem 0' }}>
                            🔄 Reverse Auction (RFQ)
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem' }}>
                            Request bulk pricing and let verified nearby vendors bid for your order.
                        </p>
                    </div>
                    <button className="btn" onClick={() => setShowCreateModal(true)} style={{ padding: '0.8rem 1.8rem', fontSize: '1rem', fontWeight: '700', boxShadow: '0 4px 15px var(--accent-glow)', whiteSpace: 'nowrap' }}>
                        + Post New RFQ
                    </button>
                </div>

                {/* RFQ Cards */}
                {rfqs.length === 0 ? (
                    <div className="empty-state">
                        <span style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</span>
                        <h3 style={{ color: 'var(--text-highlight)', margin: '0 0 0.5rem' }}>No Active RFQs</h3>
                        <p style={{ margin: 0 }}>Create your first Request for Quotation to start receiving competitive bids from verified vendors.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        {rfqs.map(rfq => (
                            <div key={rfq.rfq_id} className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <span style={{ ...statusColor(rfq.status), padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        {rfq.status}
                                    </span>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{rfq.created_at_fmt}</span>
                                </div>

                                <h3 style={{ color: 'var(--text-highlight)', margin: 0, fontSize: '1.1rem', fontWeight: '700', lineHeight: '1.3' }}>{rfq.title}</h3>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                                    <span>📦 {rfq.quantity} {rfq.unit} of <strong style={{ color: 'var(--text-primary)' }}>{rfq.category}</strong></span>
                                    <span>⏱️ Required by: <strong style={{ color: 'var(--text-primary)' }}>{rfq.required_by_fmt}</strong></span>
                                    <span>📍 {rfq.city}, {rfq.state}</span>
                                </div>

                                <button
                                    onClick={() => viewBids(rfq)}
                                    className="btn"
                                    style={{ marginTop: 'auto', width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--surface-border)', color: 'var(--text-highlight)', textAlign: 'center' }}
                                >
                                    View {rfq.bid_count} Bid{rfq.bid_count !== 1 ? 's' : ''}
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Create RFQ Modal */}
                {showCreateModal && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
                        <div className="glass-panel" style={{ width: '100%', maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '20px', padding: 0 }}>
                            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'var(--surface-color)', backdropFilter: 'var(--glass-blur)', zIndex: 1 }}>
                                <h2 style={{ margin: 0, color: 'var(--text-highlight)', fontSize: '1.4rem', fontWeight: '800' }}>📋 Post New RFQ</h2>
                                <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: 'var(--text-secondary)', lineHeight: 1 }}>✕</button>
                            </div>
                            <form onSubmit={handleCreateSubmit} style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Item Type</label>
                                        <select style={inputStyle} value={formData.item_type} onChange={e => setFormData({ ...formData, item_type: e.target.value })}>
                                            <option value="Product">Product</option>
                                            <option value="Service">Service</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Category</label>
                                        <select style={inputStyle} value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                            <option>Cement</option><option>Steel</option><option>Bricks</option>
                                            <option>Sand</option><option>Electrical</option><option>Plumbing</option>
                                            <option>Architecture</option><option>Labor</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>RFQ Title</label>
                                    <input type="text" required placeholder="e.g. 50 Tons of Ultratech Cement for new site" style={inputStyle} value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Quantity</label>
                                        <input type="number" required min="1" style={inputStyle} value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) })} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Unit</label>
                                        <input type="text" required placeholder="Tons, Pieces, SqFt" style={inputStyle} value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Required By Date</label>
                                    <input type="date" required style={{ ...inputStyle, colorScheme: 'dark' }} value={formData.required_by} onChange={e => setFormData({ ...formData, required_by: e.target.value })} />
                                </div>

                                <div style={{ borderTop: '1px solid var(--surface-border)', paddingTop: '1.5rem' }}>
                                    <h3 style={{ color: 'var(--text-highlight)', margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: '700' }}>📍 Delivery Details</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Link to Project Site (Optional)</label>
                                            <select style={inputStyle} value={formData.site_id} onChange={handleSiteChange}>
                                                <option value="">-- No Project Site --</option>
                                                {sites.map(s => (<option key={s.site_id} value={s.site_id}>{s.site_name} - {s.city}</option>))}
                                            </select>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--primary-color)', margin: '0.4rem 0 0' }}>Selecting a site auto-fills the delivery address.</p>
                                        </div>
                                        <input type="text" required placeholder="Street Address" style={inputStyle} value={formData.delivery_address} onChange={e => setFormData({ ...formData, delivery_address: e.target.value })} />
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <input type="text" required placeholder="City" style={inputStyle} value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                                            <input type="text" required placeholder="State" style={inputStyle} value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value })} />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Description / Requirements</label>
                                    <textarea rows="3" required placeholder="Specify grade, brand preference, delivery terms..." style={{ ...inputStyle, resize: 'vertical' }} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}></textarea>
                                </div>

                                <button type="submit" className="btn" style={{ width: '100%', padding: '1rem', fontSize: '1.05rem', fontWeight: '800', boxShadow: '0 4px 15px var(--accent-glow)' }}>
                                    🚀 Publish RFQ
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* View Bids Modal */}
                {selectedRfq && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
                        <div className="glass-panel" style={{ width: '100%', maxWidth: '780px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '20px', padding: 0 }}>
                            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'var(--surface-color)', backdropFilter: 'var(--glass-blur)', zIndex: 1 }}>
                                <div>
                                    <h2 style={{ margin: '0 0 0.2rem', color: 'var(--text-highlight)', fontSize: '1.3rem', fontWeight: '800' }}>{selectedRfq.title}</h2>
                                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Bids for {selectedRfq.quantity} {selectedRfq.unit}</p>
                                </div>
                                <button onClick={() => setSelectedRfq(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: 'var(--text-secondary)', lineHeight: 1 }}>✕</button>
                            </div>

                            <div style={{ padding: '1.5rem 2rem' }}>
                                {loadingBids ? (
                                    <div className="glass-panel skeleton-pulse" style={{ height: '150px', borderRadius: '12px' }}></div>
                                ) : bids.length === 0 ? (
                                    <div className="empty-state">
                                        <span style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⏳</span>
                                        <p style={{ margin: 0 }}>No bids received yet. Vendors in your area will be notified automatically.</p>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {bids.map(bid => (
                                            <div key={bid.bid_id} className="glass-panel" style={{ padding: '1.5rem', borderRadius: '14px', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ flex: 1, minWidth: '200px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.5rem' }}>
                                                        <h4 style={{ margin: 0, color: 'var(--text-highlight)', fontSize: '1.1rem', fontWeight: '700' }}>{bid.vendor_name}</h4>
                                                        {bid.qc_score >= 80 && (
                                                            <span style={{ fontSize: '0.72rem', fontWeight: '700', padding: '0.2rem 0.6rem', borderRadius: '20px', background: 'rgba(255,215,0,0.1)', color: '#ffd700', border: '1px solid rgba(255,215,0,0.3)', letterSpacing: '0.5px' }}>
                                                                ⭐ TOP QC
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p style={{ margin: '0 0 0.3rem', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                                                        Delivers in: <strong style={{ color: 'var(--text-primary)' }}>{bid.delivery_days} days</strong>
                                                    </p>
                                                    {bid.note && <p style={{ margin: '0 0 0.3rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic' }}>"{bid.note}"</p>}
                                                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.78rem' }}>Bid placed: {bid.bid_date}</p>
                                                </div>

                                                <div style={{ textAlign: 'center', padding: '1rem 1.5rem', background: 'rgba(46,160,67,0.06)', borderRadius: '12px', border: '1px solid rgba(46,160,67,0.2)', minWidth: '160px' }}>
                                                    <p style={{ margin: '0 0 0.2rem', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>Total Bid Value</p>
                                                    <p style={{ margin: '0 0 0.2rem', color: '#3fb950', fontSize: '1.8rem', fontWeight: '800' }}>₹{parseFloat(bid.total_price).toLocaleString('en-IN')}</p>
                                                    <p style={{ margin: '0 0 1rem', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>₹{parseFloat(bid.unit_price).toLocaleString('en-IN')} / {selectedRfq.unit}</p>
                                                    {selectedRfq.status === 'Open' ? (
                                                        <button onClick={() => acceptBid(bid.bid_id)} className="btn" style={{ width: '100%', fontSize: '0.9rem', padding: '0.6rem 1rem', boxShadow: '0 4px 10px var(--accent-glow)' }}>
                                                            Accept & Order
                                                        </button>
                                                    ) : (
                                                        <span style={{ ...statusColor(bid.status), padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700' }}>
                                                            {bid.status}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default CustomerRFQ;
