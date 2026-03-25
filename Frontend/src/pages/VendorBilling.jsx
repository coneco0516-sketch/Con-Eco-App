import React, { useEffect, useState } from 'react';
import VendorSidebar from '../components/VendorSidebar';

// Dynamically load the Razorpay checkout script
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (document.getElementById('razorpay-script')) return resolve(true);
    const script = document.createElement('script');
    script.id = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function VendorBilling() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(null); // invoice_id being paid
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/vendor/invoices', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.invoices) setInvoices(data.invoices);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handlePay = async (invoice) => {
    setPaying(invoice.invoice_id);
    setMessage('');

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      alert('Failed to load Razorpay SDK');
      setPaying(null);
      return;
    }

    const amountPaise = Math.round(invoice.amount * 100);

    const res = await fetch('/api/payment/create_order', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount_paise: amountPaise })
    });
    const orderData = await res.json();

    if (orderData.status !== 'success') {
      alert('Error creating payment order');
      setPaying(null);
      return;
    }

    const options = {
      key: orderData.key_id,
      amount: amountPaise,
      currency: 'INR',
      name: 'ConEco Platform',
      description: `Weekly Commission (Invoice #${invoice.invoice_id})`,
      order_id: orderData.order_id,
      handler: async function (response) {
        const verifyRes = await fetch('/api/payment/verify_invoice', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            invoice_id: invoice.invoice_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature
          })
        });
        const verifyData = await verifyRes.json();
        if (verifyData.status === 'success') {
          setMessage('✅ Payment successful. Your account status has been restored.');
          setInvoices(invoices.map(i => i.invoice_id === invoice.invoice_id ? { ...i, status: 'Paid' } : i));
        } else {
          setMessage('❌ Verification failed: ' + verifyData.detail);
        }
        setPaying(null);
      },
      theme: { color: '#2ea043' },
      modal: { ondismiss: () => setPaying(null) }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  return (
    <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
      <VendorSidebar />
      <main style={{ flex: 1 }}>
        <h2 style={{ fontSize: '2rem', color: 'white', marginTop: 0 }}>Platform Commissions</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>View and pay your weekly COD order commissions.</p>
        
        {message && (
          <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1.5rem', background: 'rgba(46, 160, 67, 0.15)', color: 'white', textAlign: 'center' }}>
            {message}
          </div>
        )}

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          {loading ? <p>Loading invoices...</p> : invoices.length === 0 ? <p>No invoices found.</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-secondary)' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--surface-border)' }}>
                  <th style={{ padding: '1rem' }}>Invoice ID</th>
                  <th style={{ padding: '1rem' }}>Period</th>
                  <th style={{ padding: '1rem' }}>Amount</th>
                  <th style={{ padding: '1rem' }}>Due Date</th>
                  <th style={{ padding: '1rem' }}>Status</th>
                  <th style={{ padding: '1rem' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.invoice_id} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                    <td style={{ padding: '1rem', color: 'white' }}>#{inv.invoice_id}</td>
                    <td style={{ padding: '1rem' }}>{inv.start} - {inv.end}</td>
                    <td style={{ padding: '1rem', color: 'var(--primary-color)', fontWeight: 'bold' }}>₹{inv.amount}</td>
                    <td style={{ padding: '1rem' }}>{inv.due}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ 
                        padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem',
                        background: inv.status === 'Paid' ? 'rgba(46, 160, 67, 0.2)' : 'rgba(231, 76, 60, 0.2)',
                        color: inv.status === 'Paid' ? '#3fb950' : '#f85149'
                      }}>
                        {inv.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {inv.status === 'Unpaid' && (
                        <button 
                          onClick={() => handlePay(inv)} 
                          disabled={paying}
                          className="btn" 
                          style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }}
                        >
                          {paying === inv.invoice_id ? 'Wait...' : 'Pay Now'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ marginTop: '2rem', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255, 215, 0, 0.2)', background: 'rgba(255, 255, 255, 0.03)' }}>
          <h4 style={{ color: '#ffd700', marginBottom: '10px' }}>Platform Commission Policy</h4>
          <ul style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
            <li>Total platform commission of 5% is calculated weekly on all completed COD orders.</li>
            <li>Invoices must be paid within 3 days of generation to avoid penalties.</li>
            <li><strong>Miss 1 Payment:</strong> Account verification status is revoked.</li>
            <li><strong>Miss 2 Payments:</strong> Account is permanently blocked from the platform.</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

export default VendorBilling;
