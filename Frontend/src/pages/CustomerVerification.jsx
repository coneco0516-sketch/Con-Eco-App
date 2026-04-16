import React, { useEffect, useState } from 'react';
import AdminSidebar from '../components/AdminSidebar';

const API = process.env.REACT_APP_API_URL || '';

function CustomerVerification() {
  const [customers, setCustomers] = useState([]);

  const loadCustomers = () => {
    fetch(`${API}/api/admin/customers`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setCustomers(data.customers);
        }
      })
      .catch(err => console.error("Error loading customers:", err));
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const updateStatus = (id, newStatus) => {
    fetch(`${API}/api/admin/customers/update_status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: newStatus }),
      credentials: 'include'
    })
    .then(res => res.json())
    .then(data => {
      if (data.status === 'success') loadCustomers();
      else alert("Error: " + data.message);
    });
  };

  return (
    <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
      <AdminSidebar />
      <main className="verification" style={{ flex: 1 }}>
        <h2 style={{ fontSize: '2rem', color: 'var(--text-highlight)', marginTop: 0 }}>Customer List</h2>
        <hr style={{ borderColor: 'var(--surface-border)', marginBottom: '1.5rem' }} />
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
          {customers.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>No customers found.</p> : null}
          {customers.map(cust => {
            const isPending = cust.verification_status === 'Pending';
            return (
              <div key={cust.customer_id} className="customer-card glass-panel" style={{ padding: '15px', width: '250px' }}>
                <h3 style={{ color: 'var(--text-highlight)', margin: '0 0 10px 0' }}>{cust.name}</h3>
                <p><strong>Email:</strong> <span style={{ color: 'var(--text-primary)' }}>{cust.email}</span></p>
                <p><strong>Status:</strong> <span style={{ color: isPending ? '#d4a20b' : '#238636' }}>{cust.verification_status}</span></p>
                <div className="actions" style={{ marginTop: '15px' }}>
                  {isPending ? (
                    <button className="btn" style={{ background: '#2ea043' }} onClick={() => updateStatus(cust.customer_id, 'Verified')}>Verify</button>
                  ) : (
                    <button className="btn danger" onClick={() => updateStatus(cust.customer_id, 'Blocked')}>Block</button>
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

export default CustomerVerification;
