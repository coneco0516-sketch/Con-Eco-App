import React, { useEffect, useState } from 'react';
import AdminSidebar from '../components/AdminSidebar';

const API = import.meta.env.VITE_API_URL || 'https://con-eco-app-w78g.onrender.com';

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
    <div className="dashboard-layout">
      <AdminSidebar />
      <main className="verification" style={{ flex: 1 }}>
        <h2 style={{ fontSize: '2rem', color: 'var(--text-highlight)', marginTop: 0 }}>Customer List</h2>
        <hr style={{ borderColor: 'var(--surface-border)', marginBottom: '1.5rem' }} />
        
        <div className="dashboard-stats-grid">
          {customers.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>No customers found.</p> : null}
          {customers.map(cust => {
            const isPending = cust.verification_status === 'Pending';
            return (
              <div key={cust.customer_id} className="customer-card glass-panel" style={{ padding: '15px',  }}>
                <h3 style={{ color: 'var(--text-highlight)', margin: '0 0 10px 0' }}>{cust.name}</h3>
                <p><strong>Email:</strong> <span style={{ color: 'var(--text-primary)' }}>{cust.email}</span></p>
                <p><strong>Status:</strong> <span style={{ color: isPending ? '#d4a20b' : '#238636' }}>{cust.verification_status}</span></p>
                  <div style={{ marginTop: '15px', borderTop: '1px solid var(--surface-border)', paddingTop: '10px' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>Credit Limit (₹)</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input 
                        type="number" 
                        defaultValue={cust.credit_limit} 
                        id={`limit-${cust.customer_id}`}
                        className="input-field" 
                        style={{ padding: '5px', fontSize: '0.9rem', width: '100px' }} 
                      />
                      <button 
                        className="btn" 
                        style={{ padding: '5px 10px', fontSize: '0.8rem' }}
                        onClick={() => {
                          const limit = document.getElementById(`limit-${cust.customer_id}`).value;
                          fetch(`${API}/api/admin/customers/${cust.customer_id}/credit`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ credit_limit: parseFloat(limit) }),
                            credentials: 'include'
                          })
                          .then(res => res.json())
                          .then(data => {
                            if (data.status === 'success') alert("Credit limit updated!");
                            else alert("Error: " + data.message);
                          });
                        }}
                      >
                        Update
                      </button>
                    </div>
                  </div>
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
