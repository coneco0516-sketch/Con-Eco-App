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
              <div key={s.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ color: 'white' }}>Service Booking #{s.id}</h4>
                  <p style={{ color: 'var(--text-secondary)' }}>Vendor: {s.vendor_name}</p>
                  <p style={{ color: 'var(--text-secondary)' }}>{new Date(s.scheduled_date).toLocaleDateString()}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>₹{s.price}</p>
                  <p style={{ color: '#238636' }}>{s.status}</p>
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
