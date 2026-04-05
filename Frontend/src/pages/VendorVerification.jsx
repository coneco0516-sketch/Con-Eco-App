import React, { useEffect, useState } from 'react';
import AdminSidebar from '../components/AdminSidebar';

function VendorVerification() {
  const [vendors, setVendors] = useState([]);
  const [qcScores, setQcScores] = useState({});
  const [editingVendor, setEditingVendor] = useState(null);

  const loadVendors = () => {
    fetch('/api/admin/vendors', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setVendors(data.vendors);
          // Initialize QC scores from vendor data
          const scores = {};
          data.vendors.forEach(v => {
            scores[v.vendor_id] = v.qc_score || 0;
          });
          setQcScores(scores);
        }
      })
      .catch(err => console.error("Error loading vendors:", err));
  };

  useEffect(() => {
    loadVendors();
  }, []);

  const updateStatus = (id, newStatus) => {
    fetch('/api/admin/vendors/update_status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: newStatus }),
      credentials: 'include'
    })
    .then(res => res.json())
    .then(data => {
      if (data.status === 'success') loadVendors();
      else alert("Error: " + data.message);
    });
  };

  const updateQC = (vendorId, status) => {
    const qcScore = parseInt(qcScores[vendorId]) || 0;
    
    fetch('/api/admin/vendors/update_qc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        vendor_id: vendorId, 
        verification_status: status,
        qc_score: qcScore 
      }),
      credentials: 'include'
    })
    .then(res => res.json())
    .then(data => {
      if (data.status === 'success') {
        alert(data.message);
        setEditingVendor(null);
        loadVendors();
      } else {
        alert("Error: " + data.detail);
      }
    })
    .catch(err => alert("Network error: " + err.message));
  };

  return (
    <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
      <AdminSidebar />
      <main className="verification" style={{ flex: 1 }}>
        <h2 style={{ fontSize: '2rem', color: 'white', marginTop: 0 }}>Vendor QC Verification</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Approve vendors and set QC scores (0-100). Only verified vendors' products will be shown to customers.</p>
        <hr style={{ borderColor: 'var(--surface-border)', marginBottom: '1.5rem' }} />
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
          {vendors.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>No vendors found.</p> : null}
          {vendors.map(vendor => {
            const isPending = vendor.verification_status === 'Pending';
            const isEditing = editingVendor === vendor.vendor_id;
            const qcScore = qcScores[vendor.vendor_id] ?? 0;
            
            return (
              <div key={vendor.vendor_id} className="vendor-card glass-panel" style={{ padding: '15px', width: '300px' }}>
                <h3 style={{ color: 'white', margin: '0 0 10px 0' }}>{vendor.company_name}</h3>
                <p><strong>Owner:</strong> <span style={{ color: 'var(--text-primary)' }}>{vendor.name}</span></p>
                <p><strong>Email:</strong> <span style={{ color: 'var(--text-primary)' }}>{vendor.email}</span></p>
                <p><strong>Phone:</strong> <span style={{ color: 'var(--text-primary)' }}>{vendor.phone}</span></p>
                
                <div style={{ margin: '15px 0', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                  <p style={{ margin: '5px 0' }}>
                    <strong>Status:</strong> 
                    <span style={{ 
                      marginLeft: '8px',
                      color: isPending ? '#d4a20b' : (vendor.verification_status === 'Verified' ? '#238636' : '#f85149'),
                      fontWeight: 'bold'
                    }}>{vendor.verification_status}</span>
                  </p>
                  <p style={{ margin: '5px 0' }}>
                    <strong>QC Score:</strong>
                    {isEditing ? (
                      <input 
                        type="number" 
                        min="0" 
                        max="100" 
                        value={qcScore}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '') {
                            setQcScores({...qcScores, [vendor.vendor_id]: ''});
                          } else {
                            const num = Math.min(100, Math.max(0, parseInt(val) || 0));
                            setQcScores({...qcScores, [vendor.vendor_id]: num});
                          }
                        }}
                        style={{
                          marginLeft: '8px',
                          padding: '5px',
                          background: '#0d1117',
                          color: 'white',
                          border: '1px solid #30363d',
                          borderRadius: '4px',
                          width: '60px'
                        }}
                      />
                    ) : (
                      <span style={{ marginLeft: '8px', color: 'var(--primary-color)', fontWeight: 'bold' }}>{qcScore}/100</span>
                    )}
                  </p>
                </div>

                {isEditing ? (
                  <div className="actions" style={{ marginTop: '15px', display: 'flex', gap: '10px', flexDirection: 'column' }}>
                    <button 
                      className="btn" 
                      style={{ background: '#238636' }} 
                      onClick={() => updateQC(vendor.vendor_id, 'Verified')}
                    >
                      ✓ Approve & Verify
                    </button>
                    <button 
                      className="btn" 
                      style={{ background: '#f85149' }} 
                      onClick={() => updateQC(vendor.vendor_id, 'Rejected')}
                    >
                      ✗ Reject
                    </button>
                    <button 
                      className="btn" 
                      style={{ background: '#666' }} 
                      onClick={() => setEditingVendor(null)}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="actions" style={{ marginTop: '15px' }}>
                    <button 
                      className="btn" 
                      style={{ background: isPending ? '#0969da' : '#666', width: '100%' }} 
                      onClick={() => setEditingVendor(vendor.vendor_id)}
                    >
                      {isPending ? 'Review QC' : 'Edit QC'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

export default VendorVerification;
