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

    if (loading) return (
        <div className="dashboard-layout">
            <AdminSidebar />
            <main style={{ flex: 1, padding: '2rem' }} className="text-center text-white">Loading RFQ Monitor...</main>
        </div>
    );

    return (
        <div className="dashboard-layout">
            <AdminSidebar />
            <main style={{ flex: 1, padding: '2rem' }}>
                <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
                    <button className="btn" onClick={() => navigate('/admin/dashboard')} style={{ marginBottom: '1rem', background: 'var(--surface-border)', color: 'var(--text-highlight)' }}>
                        ← Back to Dashboard
                    </button>
                    <div className="flex items-center gap-4 border-b border-white/10 pb-6">
                        <div className="p-4 bg-emerald-500/20 rounded-xl border border-emerald-500/30 text-3xl">
                            🖥️
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white">Global RFQ Monitor</h1>
                            <p className="text-gray-400">Monitor all reverse auctions across the platform.</p>
                        </div>
                    </div>

            {rfqs.length === 0 ? (
                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-10 text-center border border-white/10">
                    <h3 className="text-xl font-semibold text-white mb-2">No RFQs Active</h3>
                    <p className="text-gray-400">There are no reverse auctions happening at the moment.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {rfqs.map(rfq => (
                        <div key={rfq.rfq_id} className="bg-gray-900 border border-white/10 rounded-2xl p-6 hover:bg-white/5 transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                    rfq.status === 'Open' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                    rfq.status === 'Awarded' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                    'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                                }`}>
                                    {rfq.status}
                                </span>
                                <span className="text-gray-400 text-xs">{rfq.created_at_fmt}</span>
                            </div>

                            <h3 className="text-xl font-bold text-white mb-4 line-clamp-2">{rfq.title}</h3>

                            <div className="space-y-3 mb-6 p-4 bg-black/20 rounded-xl border border-white/5">
                                <p className="text-gray-300 text-sm flex items-center gap-2">
                                    👤 <span className="font-semibold">{rfq.customer_name}</span>
                                </p>
                                <p className="text-gray-300 text-sm flex items-center gap-2">
                                    📍 {rfq.city}, {rfq.state}
                                </p>
                                <p className="text-gray-300 text-sm flex items-center gap-2">
                                    ⏱️ Req: {rfq.required_by_fmt}
                                </p>
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t border-white/10">
                                <div>
                                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Requirement</p>
                                    <p className="text-white font-semibold">{rfq.quantity} {rfq.unit} of {rfq.category}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Total Bids</p>
                                    <p className="text-emerald-400 font-bold text-xl">{rfq.bid_count}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
                </div>
            </main>
        </div>
    );
};

export default AdminRFQMonitor;
