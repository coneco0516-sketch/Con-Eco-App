import React, { useState, useEffect } from 'react';
import CustomerSidebar from '../components/CustomerSidebar';

function MyBookedServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/customer/my_services', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.services) setServices(data.services);
        setLoading(false);
      })
      .catch(err => setLoading(false));
  }, []);

  return (
    <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
      <CustomerSidebar />
      <main style={{ flex: 1 }}>
        <h2 style={{ fontSize: '2rem', color: 'white', marginTop: 0 }}>My Booked Services</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>View the services you have requested.</p>
        <hr style={{ borderColor: 'var(--surface-border)', marginBottom: '1.5rem' }} />
        
        {loading ? (
          <p>Loading booked services...</p>
        ) : services.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {services.map(s => (
              <div key={s.order_id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ color: 'white', margin: '0 0 0.5rem 0' }}>{s.item_name} (Booking #{s.order_id})</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 0.25rem 0' }}>Vendor: {s.vendor_name}</p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 0.5rem 0' }}>Booked on: {s.date}</p>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: '#ffd700', border: '1px solid #ffd700', padding: '2px 6px', borderRadius: '4px' }}>
                      {s.payment_method}
                    </span>
                    <span style={{ 
                      fontSize: '0.8rem', 
                      background: s.payment_status === 'Completed' ? 'rgba(35, 134, 54, 0.2)' : 'rgba(210, 109, 14, 0.2)', 
                      color: s.payment_status === 'Completed' ? '#3fb950' : '#d26d0e',
                      padding: '2px 6px', 
                      borderRadius: '4px'
                    }}>
                      Payment: {s.payment_status}
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ color: 'var(--primary-color)', fontWeight: 'bold', fontSize: '1.2rem', margin: '0 0 0.5rem 0' }}>₹{s.amount}</p>
                  <span style={{ 
                    padding: '4px 12px', 
                    borderRadius: '4px', 
                    fontSize: '0.85rem', 
                    fontWeight: 'bold',
                    background: s.status === 'Pending' ? 'rgba(210, 109, 14, 0.2)' : 'rgba(35, 134, 54, 0.4)', 
                    color: s.status === 'Pending' ? '#d26d0e' : 'white',
                    border: `1px solid ${s.status === 'Pending' ? '#d26d0e' : 'var(--primary-color)'}`
                  }}>
                    {s.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
            <h3 style={{ color: 'var(--text-secondary)' }}>No booked services found.</h3>
          </div>
        )}
      </main>
    </div>
  );
}

export default MyBookedServices;
