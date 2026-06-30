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
    
    // Bidding Modal State
    const [showBidModal, setShowBidModal] = useState(false);
    const [selectedRfq, setSelectedRfq] = useState(null);
    const [bidData, setBidData] = useState({
        unit_price: '',
        delivery_days: '',
        note: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

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
                body: JSON.stringify({
                    rfq_id: selectedRfq.rfq_id,
                    unit_price: parseFloat(bidData.unit_price),
                    delivery_days: parseInt(bidData.delivery_days),
                    note: bidData.note
                })
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

    if (loading) return (
        <div className="dashboard-layout">
            <VendorSidebar />
            <main style={{ flex: 1, padding: '2rem' }} className="text-center text-white">Loading RFQ Board...</main>
        </div>
    );

    return (
        <div className="dashboard-layout">
            <VendorSidebar />
            <main style={{ flex: 1, padding: '2rem' }}>
                <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
                    <button className="btn" onClick={() => navigate('/vendor')} style={{ marginBottom: '1rem', background: 'var(--surface-border)', color: 'var(--text-highlight)' }}>
                        ← Back to Dashboard
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">RFQ Board</h1>
                        <p className="text-gray-400">View wholesale requests matching your category and location, and submit competitive bids.</p>
                    </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10">
                <button 
                    onClick={() => setActiveTab('available')}
                    className={`pb-4 px-6 font-semibold text-lg transition-colors relative ${activeTab === 'available' ? 'text-emerald-400' : 'text-gray-400 hover:text-white'}`}
                >
                    Available RFQs
                    {activeTab === 'available' && <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-500 rounded-t-md" />}
                </button>
                <button 
                    onClick={() => setActiveTab('bids')}
                    className={`pb-4 px-6 font-semibold text-lg transition-colors relative ${activeTab === 'bids' ? 'text-emerald-400' : 'text-gray-400 hover:text-white'}`}
                >
                    My Bids
                    {activeTab === 'bids' && <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-500 rounded-t-md" />}
                </button>
            </div>

            {/* Content: Available RFQs */}
            {activeTab === 'available' && (
                <div className="space-y-6">
                    {rfqs.length === 0 ? (
                        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-10 text-center border border-white/10">
                            <h3 className="text-xl font-semibold text-white mb-2">No Matching RFQs</h3>
                            <p className="text-gray-400">There are currently no open requests in your city that match your product categories.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {rfqs.map(rfq => (
                                <div key={rfq.rfq_id} className="bg-gray-900 border border-white/10 rounded-2xl p-6 shadow-xl">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-xl font-bold text-white line-clamp-1 flex-1">{rfq.title}</h3>
                                        <span className="text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-lg ml-4">
                                            {rfq.category}
                                        </span>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4 mb-6 bg-white/5 rounded-xl p-4">
                                        <div>
                                            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Requirement</p>
                                            <p className="text-white font-semibold text-lg">{rfq.quantity} {rfq.unit}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Required By</p>
                                            <p className="text-white font-medium flex items-center gap-1">
                                                ⏱️ {rfq.required_by_fmt}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="mb-6">
                                        <p className="text-gray-400 text-sm mb-2 font-medium">Description</p>
                                        <p className="text-gray-300 text-sm line-clamp-3 bg-black/20 p-3 rounded-lg border border-white/5">{rfq.description}</p>
                                    </div>
                                    
                                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                                        <div className="text-gray-400 text-sm flex items-center gap-2">
                                            📍 Delivery: <span className="text-white">{rfq.cust_city}, {rfq.cust_state}</span>
                                        </div>
                                        <button 
                                            onClick={() => openBidModal(rfq)}
                                            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                                        >
                                            Submit Bid
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Content: My Bids */}
            {activeTab === 'bids' && (
                <div className="space-y-6">
                    {myBids.length === 0 ? (
                        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-10 text-center border border-white/10">
                            <h3 className="text-xl font-semibold text-white mb-2">No Bids Submitted</h3>
                            <p className="text-gray-400">You have not submitted any bids yet.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/10 text-gray-400 text-sm uppercase tracking-wider">
                                        <th className="p-4">RFQ Details</th>
                                        <th className="p-4">My Bid (₹)</th>
                                        <th className="p-4">Delivery</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {myBids.map(bid => (
                                        <tr key={bid.bid_id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="p-4">
                                                <p className="text-white font-semibold line-clamp-1">{bid.title}</p>
                                                <p className="text-gray-400 text-xs mt-1">{bid.quantity} {bid.unit} • {bid.category}</p>
                                            </td>
                                            <td className="p-4">
                                                <p className="text-emerald-400 font-bold">₹{parseFloat(bid.total_price).toLocaleString('en-IN')}</p>
                                                <p className="text-gray-500 text-xs mt-1">₹{parseFloat(bid.unit_price).toLocaleString('en-IN')}/{bid.unit}</p>
                                            </td>
                                            <td className="p-4">
                                                <p className="text-white">{bid.delivery_days} days</p>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                                    bid.status === 'Pending' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                                    bid.status === 'Accepted' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                                    'bg-red-500/20 text-red-400 border border-red-500/30'
                                                }`}>
                                                    {bid.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-gray-400 text-sm">
                                                {bid.bid_date}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Bid Modal */}
            {showBidModal && selectedRfq && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-gray-900">
                            <h2 className="text-xl font-bold text-white">Submit Your Bid</h2>
                            <button onClick={() => setShowBidModal(false)} className="text-gray-400 hover:text-white transition-colors text-2xl">
                                ✕
                            </button>
                        </div>
                        
                        <div className="p-6 bg-black/20">
                            <p className="text-sm text-gray-400 mb-1">Requesting</p>
                            <p className="text-lg text-white font-semibold mb-4">{selectedRfq.quantity} {selectedRfq.unit} of {selectedRfq.category}</p>
                            
                            <form onSubmit={handleBidSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        Unit Price (₹ per {selectedRfq.unit})
                                    </label>
                                    <input 
                                        type="number" required step="0.01" min="1"
                                        className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                        placeholder="e.g. 500"
                                        value={bidData.unit_price}
                                        onChange={e => setBidData({...bidData, unit_price: e.target.value})}
                                    />
                                    {bidData.unit_price && (
                                        <p className="text-emerald-400 text-sm mt-2">
                                            Total Bid: ₹{(parseFloat(bidData.unit_price) * selectedRfq.quantity).toLocaleString('en-IN')}
                                        </p>
                                    )}
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        Delivery Time (Days)
                                    </label>
                                    <input 
                                        type="number" required min="1"
                                        className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                        placeholder="e.g. 3"
                                        value={bidData.delivery_days}
                                        onChange={e => setBidData({...bidData, delivery_days: e.target.value})}
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        Notes to Customer (Optional)
                                    </label>
                                    <textarea 
                                        rows="2"
                                        className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                        placeholder="Any specific brands, terms, etc."
                                        value={bidData.note}
                                        onChange={e => setBidData({...bidData, note: e.target.value})}
                                    ></textarea>
                                </div>
                                
                                <button type="submit" className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/20 transition-all mt-4">
                                    Place Bid
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
                </div>
            </main>
        </div>
    );
};

export default VendorRFQBoard;
