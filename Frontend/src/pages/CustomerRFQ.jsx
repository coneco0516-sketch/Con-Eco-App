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

    // Form State
    const [formData, setFormData] = useState({
        item_type: 'Product',
        category: 'Cement',
        title: '',
        description: '',
        quantity: 1,
        unit: 'Tons',
        required_by: '',
        site_id: '',
        delivery_address: '',
        city: '',
        state: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

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
            setFormData({
                ...formData,
                site_id: siteId,
                delivery_address: site.site_address || '',
                city: site.city || '',
                state: site.state || ''
            });
        } else {
            setFormData({
                ...formData,
                site_id: '',
                delivery_address: '',
                city: '',
                state: ''
            });
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
                setFormData({
                    item_type: 'Product', category: 'Cement', title: '', description: '',
                    quantity: 1, unit: 'Tons', required_by: '', site_id: '',
                    delivery_address: '', city: '', state: ''
                });
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
        if (!window.confirm("Are you sure you want to accept this bid? It will automatically generate an order.")) return;
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

    if (loading) return (
        <div className="dashboard-layout">
            <CustomerSidebar />
            <main style={{ flex: 1, padding: '2rem' }} className="text-center text-white">Loading RFQs...</main>
        </div>
    );

    return (
        <div className="dashboard-layout">
            <CustomerSidebar />
            <main style={{ flex: 1, padding: '2rem' }}>
                <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
                    <button className="btn" onClick={() => navigate('/customer')} style={{ marginBottom: '1rem', background: 'var(--surface-border)', color: 'var(--text-highlight)' }}>
                        ← Back to Dashboard
                    </button>
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2">Reverse Auction (RFQ)</h1>
                            <p className="text-gray-400">Request bulk pricing and let verified vendors bid for your order.</p>
                        </div>
                        <button 
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-emerald-500/20 transition-all duration-300"
                        >
                            + Post New RFQ
                        </button>
                    </div>

            {rfqs.length === 0 ? (
                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-10 text-center border border-white/10">
                    <h3 className="text-xl font-semibold text-white mb-2">No Active RFQs</h3>
                    <p className="text-gray-400">Create your first Request for Quotation to start receiving competitive bids.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {rfqs.map(rfq => (
                        <div key={rfq.rfq_id} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
                            <div className="flex justify-between items-start mb-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                    rfq.status === 'Open' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                    rfq.status === 'Awarded' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                    'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                                }`}>
                                    {rfq.status}
                                </span>
                                <span className="text-gray-400 text-sm">{rfq.created_at_fmt}</span>
                            </div>
                            
                            <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">{rfq.title}</h3>
                            <div className="space-y-2 mb-6">
                                <p className="text-gray-300 text-sm flex items-center gap-2">
                                    📦 {rfq.quantity} {rfq.unit} of {rfq.category}
                                </p>
                                <p className="text-gray-300 text-sm flex items-center gap-2">
                                    ⏱️ Required by: {rfq.required_by_fmt}
                                </p>
                                <p className="text-gray-300 text-sm flex items-center gap-2">
                                    📍 {rfq.city}, {rfq.state}
                                </p>
                            </div>

                            <button 
                                onClick={() => viewBids(rfq)}
                                className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors flex justify-center items-center gap-2"
                            >
                                View {rfq.bid_count} Bids
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center sticky top-0 bg-gray-900 z-10">
                            <h2 className="text-2xl font-bold text-white">Post New RFQ</h2>
                            <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-white text-2xl">
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleCreateSubmit} className="p-6 space-y-6">
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Item Type</label>
                                    <select 
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                                        value={formData.item_type}
                                        onChange={e => setFormData({...formData, item_type: e.target.value})}
                                    >
                                        <option value="Product">Product</option>
                                        <option value="Service">Service</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
                                    <select 
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                                        value={formData.category}
                                        onChange={e => setFormData({...formData, category: e.target.value})}
                                    >
                                        <option value="Cement">Cement</option>
                                        <option value="Steel">Steel</option>
                                        <option value="Bricks">Bricks</option>
                                        <option value="Sand">Sand</option>
                                        <option value="Electrical">Electrical</option>
                                        <option value="Plumbing">Plumbing</option>
                                        <option value="Architecture">Architecture</option>
                                        <option value="Labor">Labor</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">RFQ Title</label>
                                <input 
                                    type="text" required
                                    placeholder="e.g. 50 Tons of Ultratech Cement for new site"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                                    value={formData.title}
                                    onChange={e => setFormData({...formData, title: e.target.value})}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Quantity</label>
                                    <input 
                                        type="number" required min="1"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                                        value={formData.quantity}
                                        onChange={e => setFormData({...formData, quantity: parseInt(e.target.value)})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Unit</label>
                                    <input 
                                        type="text" required placeholder="Tons, Pieces, SqFt"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                                        value={formData.unit}
                                        onChange={e => setFormData({...formData, unit: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Required By Date</label>
                                <input 
                                    type="date" required
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 [color-scheme:dark]"
                                    value={formData.required_by}
                                    onChange={e => setFormData({...formData, required_by: e.target.value})}
                                />
                            </div>

                            <div className="border-t border-white/10 pt-6">
                                <h3 className="text-lg font-semibold text-white mb-4">Delivery / Execution Details</h3>
                                
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Link to Project Site (Optional)</label>
                                    <select 
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                                        value={formData.site_id}
                                        onChange={handleSiteChange}
                                    >
                                        <option value="">-- No Project Site --</option>
                                        {sites.map(s => (
                                            <option key={s.site_id} value={s.site_id}>{s.site_name} - {s.city}</option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-emerald-400 mt-2">Selecting a site auto-fills the delivery address.</p>
                                </div>

                                <div className="space-y-4">
                                    <input 
                                        type="text" required placeholder="Street Address"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                                        value={formData.delivery_address}
                                        onChange={e => setFormData({...formData, delivery_address: e.target.value})}
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <input 
                                            type="text" required placeholder="City"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                                            value={formData.city}
                                            onChange={e => setFormData({...formData, city: e.target.value})}
                                        />
                                        <input 
                                            type="text" required placeholder="State"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                                            value={formData.state}
                                            onChange={e => setFormData({...formData, state: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Detailed Description / Instructions</label>
                                <textarea 
                                    rows="3" required
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                                    value={formData.description}
                                    onChange={e => setFormData({...formData, description: e.target.value})}
                                ></textarea>
                            </div>

                            <button type="submit" className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/20 transition-all">
                                Publish RFQ
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {selectedRfq && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center sticky top-0 bg-gray-900 z-10">
                            <div>
                                <h2 className="text-2xl font-bold text-white">{selectedRfq.title}</h2>
                                <p className="text-gray-400 text-sm mt-1">Bids received for {selectedRfq.quantity} {selectedRfq.unit}</p>
                            </div>
                            <button onClick={() => setSelectedRfq(null)} className="text-gray-400 hover:text-white text-2xl">
                                ✕
                            </button>
                        </div>
                        
                        <div className="p-6">
                            {loadingBids ? (
                                <div className="text-center text-white py-10">Loading bids...</div>
                            ) : bids.length === 0 ? (
                                <div className="text-center py-10">
                                    <p className="text-gray-400 text-lg">No bids received yet.</p>
                                    <p className="text-sm text-gray-500 mt-2">Vendors matching your category and city will be notified automatically.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {bids.map(bid => (
                                        <div key={bid.bid_id} className="bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h4 className="text-xl font-bold text-white">{bid.vendor_name}</h4>
                                                    {bid.qc_score >= 80 && (
                                                        <span className="bg-amber-500/20 text-amber-400 text-xs px-2 py-1 rounded border border-amber-500/30 flex items-center gap-1">
                                                            Top Rated QC
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-gray-300 text-sm mb-1">Delivers in: <span className="text-white font-medium">{bid.delivery_days} days</span></p>
                                                {bid.note && <p className="text-gray-400 text-sm italic">"{bid.note}"</p>}
                                                <p className="text-gray-500 text-xs mt-2">Bid placed on {bid.bid_date}</p>
                                            </div>
                                            
                                            <div className="text-left md:text-right w-full md:w-auto bg-black/20 p-4 rounded-lg">
                                                <p className="text-sm text-gray-400 mb-1">Total Bid Value</p>
                                                <p className="text-3xl font-bold text-emerald-400 mb-3">₹{parseFloat(bid.total_price).toLocaleString('en-IN')}</p>
                                                <p className="text-xs text-gray-500 mb-4">₹{parseFloat(bid.unit_price).toLocaleString('en-IN')} / {selectedRfq.unit}</p>
                                                
                                                {selectedRfq.status === 'Open' ? (
                                                    <button 
                                                        onClick={() => acceptBid(bid.bid_id)}
                                                        className="w-full md:w-auto px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors"
                                                    >
                                                        Accept Bid & Order
                                                    </button>
                                                ) : (
                                                    <span className={`px-4 py-2 rounded-lg font-medium ${bid.status === 'Accepted' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
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
                </div>
            </main>
        </div>
    );
};

export default CustomerRFQ;
