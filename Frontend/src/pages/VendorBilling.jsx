import React, { useEffect, useState } from 'react';
import VendorSidebar from '../components/VendorSidebar';

const API = import.meta.env.VITE_API_URL || 'https://con-eco-app-w78g.onrender.com';

function VendorBilling() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(null); // invoice_id being paid
  const [downloading, setDownloading] = useState(null); // invoice_id downloading receipt
  const [message, setMessage] = useState('');

  const [settings, setSettings] = useState({ 
    product_commission_pct: 3.0,
    service_commission_pct: 3.0
  });

  const fetchInvoices = () => {
    setLoading(true);
    fetch(`${API}/api/auth/commission-rates`)
      .then(res => res.json())
      .then(sData => {
        if (sData.status === 'success') {
          setSettings({ 
            product_commission_pct: sData.product_commission_pct,
            service_commission_pct: sData.service_commission_pct
          });
        }
        return fetch(`${API}/api/vendor/invoices`, { credentials: 'include' });
      })
      .then(res => res.json())
      .then(data => {
        if (data.invoices) setInvoices(data.invoices);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const loadRazorpayScript = () => new Promise((resolve) => {
    if (document.getElementById('razorpay-script')) return resolve(true);
    const script = document.createElement('script');
    script.id = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

  const handlePay = async (invoice) => {
    setPaying(invoice.invoice_id);
    setMessage('');

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      alert('Failed to load Razorpay SDK');
      setPaying(null);
      return;
    }

    // Amount = base commission (dynamic) - No GST added
    const amountVal = parseFloat(invoice.amount);
    const amountPaise = Math.round(amountVal * 100);

    const res = await fetch(`${API}/api/payment/create_order`, {
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
      description: `Platform Commission Payment (Receipt #${invoice.invoice_id})`,
      order_id: orderData.order_id,
      handler: async function (response) {
        const verifyRes = await fetch(`${API}/api/payment/verify_invoice`, {
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
          setMessage('✅ Commission paid successfully! You can download your receipt below.');
          setInvoices(prev => prev.map(i =>
            i.invoice_id === invoice.invoice_id ? { ...i, status: 'Paid' } : i
          ));
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

  const handleDownloadReceipt = async (invoiceId) => {
    setDownloading(invoiceId);
    try {
      const response = await fetch(`${API}/api/invoice/commission_gst/${invoiceId}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Server Error' }));
        throw new Error(errorData.detail || 'Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CommissionReceipt_ConEco_${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="dashboard-layout">
      <VendorSidebar />
      <main style={{ flex: 1 }}>
        <h2 style={{ fontSize: '2rem', color: 'var(--text-highlight)', marginTop: 0 }}>Commission Billing</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          View and pay your weekly platform commissions (Product: {settings.product_commission_pct}%, Service: {settings.service_commission_pct}%).
        </p>

        {message && (
          <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1.5rem', background: 'rgba(46, 160, 67, 0.15)', color: 'var(--text-highlight)', textAlign: 'center' }}>
            {message}
          </div>
        )}

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          {loading ? (
            <p style={{ color: 'var(--text-secondary)' }}>Loading billings...</p>
          ) : invoices.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>No commission billings found. They are generated every Monday.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-secondary)' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--surface-border)' }}>
                  <th style={{ padding: '1rem' }}>ID</th>
                  <th style={{ padding: '1rem' }}>Period</th>
                  <th style={{ padding: '1rem' }}>Commission Amount</th>
                  <th style={{ padding: '1rem' }}>Due Date</th>
                  <th style={{ padding: '1rem' }}>Status</th>
                  <th style={{ padding: '1rem' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.invoice_id} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                    <td style={{ padding: '1rem', color: 'var(--text-highlight)', fontWeight: 'bold' }}>#{inv.invoice_id}</td>
                    <td style={{ padding: '1rem', fontSize: '0.85rem' }}>{inv.start} – {inv.end}</td>
                    <td style={{ padding: '1rem', color: 'var(--primary-color)', fontWeight: 'bold', fontSize: '1.1rem' }}>
                      ₹{parseFloat(inv.amount).toFixed(2)}
                    </td>
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
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {inv.status === 'Unpaid' && (
                          <button
                            onClick={() => handlePay(inv)}
                            disabled={!!paying}
                            className="btn"
                            style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
                          >
                            {paying === inv.invoice_id ? '⏳ Wait...' : '💳 Pay Now'}
                          </button>
                        )}
                        {inv.status === 'Paid' && (
                          <button
                            onClick={() => handleDownloadReceipt(inv.invoice_id)}
                            disabled={downloading === inv.invoice_id}
                            className="btn"
                            style={{
                              padding: '0.4rem 1rem',
                              fontSize: '0.85rem',
                              background: 'rgba(52, 152, 219, 0.2)',
                              color: '#3498db',
                              border: '1px solid #3498db'
                            }}
                          >
                            {downloading === inv.invoice_id ? '⏳ generating...' : '🧾 Download Receipt'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={{
          marginTop: '2rem', padding: '1.5rem', borderRadius: '8px',
          border: '1px solid rgba(255, 215, 0, 0.2)', background: 'rgba(255, 255, 255, 0.03)'
        }}>
          <h4 style={{ color: '#ffd700', marginBottom: '10px' }}>Platform Billing Policy</h4>
          <ul style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.8', margin: 0, paddingLeft: '1.2rem' }}>
            <li>The platform charges a commission of <strong style={{ color: 'var(--text-highlight)' }}>{settings.product_commission_pct}% for products</strong> and <strong style={{ color: 'var(--text-highlight)' }}>{settings.service_commission_pct}% for services</strong> on all completed offline (COD/Direct) orders.</li>
            <li>Invoices are generated every Monday for the previous week's collection and must be paid within <strong style={{ color: 'var(--text-highlight)' }}>3 days</strong>.</li>
            <li><strong style={{ color: '#f85149' }}>Penalty - Strike 1:</strong> Verification status will be revoked.</li>
            <li><strong style={{ color: '#f85149' }}>Penalty - Strike 2:</strong> Permanent account suspension.</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

export default VendorBilling;
