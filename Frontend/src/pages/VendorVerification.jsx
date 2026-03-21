import React, { useEffect, useState } from 'react';
import AdminSidebar from '../components/AdminSidebar';

function VendorVerification() {
  const [vendors, setVendors] = useState([]);

  const loadVendors = () => {
    fetch('/api/admin/vendors', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setVendors(data.vendors);
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

  return (
    <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
      <AdminSidebar />
      <main className="verification" style={{ flex: 1 }}>
        <h2 style={{ fontSize: '2rem', color: 'white', marginTop: 0 }}>Vendor Requests</h2>
        <hr style={{ borderColor: 'var(--surface-border)', marginBottom: '1.5rem' }} />
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
          {vendors.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>No vendors found.</p> : null}
          {vendors.map(vendor => {
            const isPending = vendor.verification_status === 'Pending';
            return (
              <div key={vendor.vendor_id} className="vendor-card glass-panel" style={{ padding: '15px', width: '250px' }}>
                <h3 style={{ color: 'white', margin: '0 0 10px 0' }}>{vendor.company_name}</h3>
                <p><strong>Owner:</strong> <span style={{ color: 'var(--text-primary)' }}>{vendor.name}</span></p>
                <p><strong>Email:</strong> <span style={{ color: 'var(--text-primary)' }}>{vendor.email}</span></p>
                <p><strong>Status:</strong> <span style={{ color: isPending ? '#d4a20b' : '#238636' }}>{vendor.verification_status}</span></p>
                <div className="actions" style={{ marginTop: '15px' }}>
                  {isPending ? (
                    <button className="btn" style={{ background: '#238636' }} onClick={() => updateStatus(vendor.vendor_id, 'Verified')}>Approve</button>
                  ) : (
                    <button className="btn danger" onClick={() => updateStatus(vendor.vendor_id, 'Pending')}>Revoke</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

export default VendorVerification;
