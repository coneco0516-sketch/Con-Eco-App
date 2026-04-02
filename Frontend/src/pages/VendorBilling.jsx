import React, { useEffect, useState } from 'react';
import VendorSidebar from '../components/VendorSidebar';

function VendorBilling() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(null); // invoice_id being paid
  const [downloading, setDownloading] = useState(null); // invoice_id downloading GST invoice
  const [message, setMessage] = useState('');

  const fetchInvoices = () => {
    setLoading(true);
    fetch('/api/vendor/invoices', { credentials: 'include' })
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

  // -------------------------------------------------------------------------
  // Pay commission invoice via Razorpay
  // -------------------------------------------------------------------------
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

    // The amount vendor pays = base commission + 18% GST
    const GST_RATE = 0.18;
    const baseAmount = parseFloat(invoice.amount);
    const gstAmount = +(baseAmount * GST_RATE).toFixed(2);
    const totalWithGST = +(baseAmount + gstAmount).toFixed(2);
    const amountPaise = Math.round(totalWithGST * 100);

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
      description: `Weekly Commission + 18% GST (Invoice #${invoice.invoice_id})`,
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
          setMessage('✅ Commission paid! Download your GST Invoice below to claim ITC.');
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

  // -------------------------------------------------------------------------
  // Download GST Invoice PDF (only available after payment)
  // -------------------------------------------------------------------------
  const handleDownloadGSTInvoice = async (invoiceId) => {
    setDownloading(invoiceId);
    try {
      const response = await fetch(`/api/invoice/commission_gst/${invoiceId}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Server Error' }));
        throw new Error(errorData.detail || 'Download failed');
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/pdf')) {
        throw new Error('Server did not return a valid PDF. Please try again.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `GSTInvoice_ConEco_Commission_${invoiceId}.pdf`;
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

  // -------------------------------------------------------------------------
  // GST Calculation helper (for display)
  // -------------------------------------------------------------------------
  const calcGST = (amount) => {
    const base = parseFloat(amount) || 0;
    const gst = +(base * 0.18).toFixed(2);
    return { base, gst, total: +(base + gst).toFixed(2) };
  };

  return (
    <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
      <VendorSidebar />
      <main style={{ flex: 1 }}>
        <h2 style={{ fontSize: '2rem', color: 'white', marginTop: 0 }}>Platform Commission Billing</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          View and pay your weekly platform commissions. After payment, download the GST Invoice to claim Input Tax Credit (ITC).
        </p>

        {/* GST Notice Banner */}
        <div style={{
          background: 'rgba(52, 152, 219, 0.1)',
          border: '1px solid rgba(52, 152, 219, 0.4)',
          borderRadius: '8px',
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem'
        }}>
          <span style={{ fontSize: '1.3rem' }}>🧾</span>
          <div>
            <p style={{ color: '#3498db', fontWeight: 'bold', margin: '0 0 4px 0', fontSize: '0.95rem' }}>
              GST on Platform Commission (18%)
            </p>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.85rem', lineHeight: '1.5' }}>
              As all vendors on ConEco are GST-registered, <strong style={{ color: 'white' }}>18% GST (CGST 9% + SGST 9%)</strong> is
              charged on the 5% platform commission. After you pay, a proper <strong style={{ color: 'white' }}>GST Tax Invoice</strong> is
              generated which you can use to claim <strong style={{ color: 'white' }}>Input Tax Credit (ITC)</strong> in your GST returns.
            </p>
          </div>
        </div>

        {message && (
          <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1.5rem', background: 'rgba(46, 160, 67, 0.15)', color: 'white', textAlign: 'center' }}>
            {message}
          </div>
        )}

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          {loading ? (
            <p style={{ color: 'var(--text-secondary)' }}>Loading invoices...</p>
          ) : invoices.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>No commission invoices found. They are generated every Monday.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-secondary)' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--surface-border)' }}>
                  <th style={{ padding: '1rem' }}>Invoice #</th>
                  <th style={{ padding: '1rem' }}>Period</th>
                  <th style={{ padding: '1rem' }}>Commission</th>
                  <th style={{ padding: '1rem' }}>GST @18%</th>
                  <th style={{ padding: '1rem' }}>Total Payable</th>
                  <th style={{ padding: '1rem' }}>Due Date</th>
                  <th style={{ padding: '1rem' }}>Status</th>
                  <th style={{ padding: '1rem' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => {
                  const gstCalc = calcGST(inv.amount);
                  return (
                    <tr key={inv.invoice_id} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                      <td style={{ padding: '1rem', color: 'white', fontWeight: 'bold' }}>#{inv.invoice_id}</td>
                      <td style={{ padding: '1rem', fontSize: '0.85rem' }}>{inv.start} – {inv.end}</td>
                      <td style={{ padding: '1rem' }}>₹{parseFloat(inv.amount).toFixed(2)}</td>
                      <td style={{ padding: '1rem', color: '#f1c40f' }}>₹{gstCalc.gst.toFixed(2)}</td>
                      <td style={{ padding: '1rem', color: 'var(--primary-color)', fontWeight: 'bold', fontSize: '1rem' }}>
                        ₹{gstCalc.total.toFixed(2)}
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
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {inv.status === 'Unpaid' && (
                            <button
                              onClick={() => handlePay(inv)}
                              disabled={!!paying}
                              className="btn"
                              style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                            >
                              {paying === inv.invoice_id ? '⏳ Wait...' : '💳 Pay Now'}
                            </button>
                          )}
                          {inv.status === 'Paid' && (
                            <button
                              onClick={() => handleDownloadGSTInvoice(inv.invoice_id)}
                              disabled={downloading === inv.invoice_id}
                              className="btn"
                              style={{
                                padding: '0.4rem 1rem',
                                fontSize: '0.85rem',
                                background: 'rgba(52, 152, 219, 0.2)',
                                color: '#3498db',
                                border: '1px solid #3498db',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {downloading === inv.invoice_id ? '⏳ Generating...' : '🧾 Download GST Invoice'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Policy Box */}
        <div style={{
          marginTop: '2rem', padding: '1.5rem', borderRadius: '8px',
          border: '1px solid rgba(255, 215, 0, 0.2)', background: 'rgba(255, 255, 255, 0.03)'
        }}>
          <h4 style={{ color: '#ffd700', marginBottom: '10px' }}>Commission &amp; GST Policy</h4>
          <ul style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.8', margin: 0, paddingLeft: '1.2rem' }}>
            <li>Platform charges a <strong style={{ color: 'white' }}>5% commission</strong> on all completed COD orders, calculated weekly.</li>
            <li><strong style={{ color: 'white' }}>18% GST</strong> (CGST 9% + SGST 9%) is levied on the commission as per Indian tax law.</li>
            <li>A proper <strong style={{ color: 'white' }}>GST Tax Invoice</strong> (SAC 998314) is provided after payment for ITC claims.</li>
            <li>Commission invoices must be paid within <strong style={{ color: 'white' }}>3 days</strong> of generation to avoid penalties.</li>
            <li><strong style={{ color: '#f85149' }}>Miss 1 Payment:</strong> Account verification status is revoked.</li>
            <li><strong style={{ color: '#f85149' }}>Miss 2 Payments:</strong> Account is permanently blocked from the platform.</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

export default VendorBilling;
