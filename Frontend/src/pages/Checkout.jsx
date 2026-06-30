import React, { useEffect, useState } from 'react';
import CustomerSidebar from '../components/CustomerSidebar';
import AddressSelector from '../components/AddressSelector';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'https://api.coneco.store';

function Checkout() {
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [baseTotal, setBaseTotal] = useState(0);
  const [gstTotal, setGstTotal] = useState(0);
  const [commissionTotal, setCommissionTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const [address, setAddress] = useState('');
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [ackDelivery, setAckDelivery] = useState(false);
  const [creditInfo, setCreditInfo] = useState(null);
  const [platformSettings, setPlatformSettings] = useState({});
  const [billType, setBillType] = useState('Non-GST');
  const [sites, setSites] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API}/api/customer/cart`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.items) setCart(data.items);
        if (data.total) setTotal(data.total);
        if (data.base_total !== undefined) setBaseTotal(data.base_total);
        if (data.gst_total !== undefined) setGstTotal(data.gst_total);
        if (data.commission_total !== undefined) setCommissionTotal(data.commission_total);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetch(`${API}/api/customer/credit_summary`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') setCreditInfo(data.summary);
      })
      .catch(err => console.error('Error fetching credit info:', err));

    fetch(`${API}/api/admin/platform_settings`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') setPlatformSettings(data.settings);
      })
      .catch(err => console.error('Error fetching platform settings:', err));

    fetch(`${API}/api/customer/sites`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') setSites(data.sites);
      })
      .catch(err => console.error('Error fetching sites:', err));

  }, []);

  const [paymentMethod, setPaymentMethod] = useState('COD');

  const handlePayment = async () => {
    if (cart.length === 0) return;
    if (!address.trim()) {
      setError('Please select or enter a delivery address.');
      return;
    }

    if (!ackDelivery) {
      setError('Please acknowledge the delivery charges notice before proceeding.');
      return;
    }

    setPaying(true);
    setError('');

    if (paymentMethod === 'COD') {
        try {
            const res = await fetch(`${API}/api/payment/place_order_offline`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            delivery_address: address,
            payment_method: paymentMethod,
            bill_type: billType,
            site_id: selectedSiteId ? parseInt(selectedSiteId) : null
          })
        });
        const data = await res.json();
        if (data.status === 'success') {
          navigate('/customer/order-success');
        } else {
          setError(data.detail || 'Failed to place order.');
          setPaying(false);
        }
      } catch (err) {
        setError('Connection error. Please try again.');
        setPaying(false);
      }
      return;
    }

    if (paymentMethod === 'PayLater') {
      try {
        const res = await fetch(`${API}/api/payment/place_order_pay_later`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            delivery_address: address,
            bill_type: billType,
            site_id: selectedSiteId ? parseInt(selectedSiteId) : null
          })
        });
        const data = await res.json();
        if (data.status === 'success') {
          navigate('/customer/order-success');
        } else {
          setError(data.detail || 'Failed to place credit order.');
          setPaying(false);
        }
      } catch (err) {
        setError('Connection error. Please try again.');
        setPaying(false);
      }
      return;
    }
  };

  const updateQuantity = async (cartId, newQuantity) => {
    if (newQuantity < 0) return;
    
    const prevCart = [...cart];
    const prevTotal = total;
    
    setCart(prev => {
      const next = prev.map(item => 
        item.cart_id === cartId ? { ...item, quantity: newQuantity } : item
      );
      return next;
    });

    try {
      const resp = await fetch(`${API}/api/customer/cart`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart_id: cartId, quantity: newQuantity }),
        credentials: 'include'
      });
      const data = await resp.json();
      if (data.status !== 'success') {
        setCart(prevCart);
        setTotal(prevTotal);
      } else {
        fetch(`${API}/api/customer/cart`, { credentials: 'include' })
          .then(res => res.json())
          .then(data => {
            if (data.total) setTotal(data.total);
            if (data.base_total !== undefined) setBaseTotal(data.base_total);
            if (data.gst_total !== undefined) setGstTotal(data.gst_total);
            if (data.commission_total !== undefined) setCommissionTotal(data.commission_total);
          });
      }
    } catch (err) {
      setCart(prevCart);
      setTotal(prevTotal);
      console.error('Update quantity error:', err);
    }
  };

  const paymentOptions = [
    { id: 'COD', label: 'Cash on Delivery', icon: '💵' },
  ];

  if (platformSettings.enable_pay_later !== false && creditInfo && parseFloat(creditInfo.credit_limit) > 0) {
    const available = parseFloat(creditInfo.credit_available);
    const isSuspended = creditInfo.credit_status === 'Suspended';
    const insufficient = available < total;
    
    paymentOptions.push({
      id: 'PayLater',
      label: 'Pay Later (Credit)',
      icon: '⏳',
      disabled: isSuspended || insufficient,
      subtitle: isSuspended ? `Suspended until ${creditInfo.suspended_until}` : 
                insufficient ? `Insufficient Limit (₹${available.toFixed(0)})` :
                `Available: ₹${available.toFixed(0)}`
    });
  }

  return (
    <div className="dashboard-layout">
      <CustomerSidebar />
      <main style={{ flex: 1, padding: '2rem', minWidth: 0 }}>
        
        {/* Page Title */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '2rem', color: 'var(--text-highlight)', margin: 0, fontWeight: '800' }}>Secure Checkout</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>Review your order and select a settlement method.</p>
        </div>
        <hr style={{ borderColor: 'var(--surface-border)', marginBottom: '2rem' }} />

        {error && (
          <div style={{ 
            padding: '1rem 1.5rem', 
            marginBottom: '1.5rem', 
            borderRadius: '8px', 
            background: 'rgba(248, 81, 73, 0.15)', 
            color: '#f85149', 
            border: '1px solid rgba(248, 81, 73, 0.3)',
            fontWeight: '600',
            fontSize: '0.95rem'
          }}>
            ⚠️ {error}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="glass-panel" style={{ padding: '2rem', borderRadius: '16px' }}>
              <div className="skeleton-pulse" style={{ height: '40px', width: '30%', marginBottom: '1.5rem', borderRadius: '6px' }}></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div className="skeleton-pulse" style={{ height: '60px', borderRadius: '8px' }}></div>
                <div className="skeleton-pulse" style={{ height: '60px', borderRadius: '8px' }}></div>
              </div>
            </div>
          </div>
        ) : cart.length === 0 ? (
          <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center', borderRadius: '16px' }}>
            <span style={{ fontSize: '4rem', display: 'block', marginBottom: '1.5rem' }}>🛒</span>
            <h3 style={{ color: 'var(--text-highlight)', fontSize: '1.3rem', margin: '0 0 0.5rem 0', fontWeight: '700' }}>Your Cart is Empty</h3>
            <p style={{ color: 'var(--text-secondary)', margin: '0 0 2rem 0' }}>Please add products or services to your cart before proceeding to checkout.</p>
            <button onClick={() => navigate('/customer/products')} className="btn" style={{ background: 'var(--primary-color)', padding: '0.8rem 2rem', fontWeight: '600', borderRadius: '8px' }}>Shop Materials</button>
          </div>
        ) : (
          
          /* Checkout Split Layout */
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
            
            {/* Left Panel: Shipping, Bill and Payment Info */}
            <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', gap: '2rem', minWidth: 0 }}>
              
              {/* Delivery Site Address */}
              <div className="glass-panel" style={{ padding: '2rem', borderRadius: '16px' }}>
                <h3 style={{ color: 'var(--text-highlight)', margin: '0 0 1.2rem 0', fontSize: '1.2rem', fontWeight: '700', borderBottom: '1px solid var(--surface-border)', paddingBottom: '0.8rem' }}>
                  📍 Delivery Site Location
                </h3>
                
                <AddressSelector 
                  selectedAddressId={selectedAddressId}
                  onSelect={setSelectedAddressId}
                  onAddressStringChange={setAddress}
                />

                {/* Delivery charges disclaimer */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginTop: '1.2rem', background: 'rgba(255,215,0,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,215,0,0.15)' }}>
                  <input
                    type="checkbox"
                    id="ackDelivery"
                    checked={ackDelivery}
                    onChange={(e) => setAckDelivery(e.target.checked)}
                    style={{ marginTop: '0.2rem', cursor: 'pointer', width: '18px', height: '18px', accentColor: '#ffd700' }}
                  />
                  <label htmlFor="ackDelivery" style={{ color: '#ffd700', fontSize: '0.85rem', lineHeight: '1.5', cursor: 'pointer', fontWeight: '500' }}>
                    <strong>Delivery Charges Disclaimer:</strong> I acknowledge that delivery charges are not included in the quote subtotal and must be settled with the vendor directly post-delivery.
                  </label>
                </div>
              </div>

              {/* Optional Project Site Tagging */}
              <div className="glass-panel" style={{ padding: '2rem', borderRadius: '16px' }}>
                <h3 style={{ color: 'var(--text-highlight)', margin: '0 0 1.2rem 0', fontSize: '1.2rem', fontWeight: '700', borderBottom: '1px solid var(--surface-border)', paddingBottom: '0.8rem' }}>
                  📂 Tag to Project Site
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem', marginTop: 0 }}>Associating order to a site automatically tracks costs against that site's assigned budget.</p>
                <select 
                  className="input-field" 
                  value={selectedSiteId} 
                  onChange={(e) => setSelectedSiteId(e.target.value)}
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--surface-border)', color: 'var(--text-highlight)', boxSizing: 'border-box' }}
                >
                  <option value="">-- No Project Site (Untagged) --</option>
                  {sites.map(site => (
                    <option key={site.site_id} value={site.site_id}>{site.site_name}</option>
                  ))}
                </select>
              </div>

              {/* Bill Type Selector */}
              <div className="glass-panel" style={{ padding: '2rem', borderRadius: '16px' }}>
                <h3 style={{ color: 'var(--text-highlight)', margin: '0 0 1.2rem 0', fontSize: '1.2rem', fontWeight: '700', borderBottom: '1px solid var(--surface-border)', paddingBottom: '0.8rem' }}>
                  🧾 Invoice Billing Type
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                  {['Non-GST', 'GST'].map(type => {
                    const isGstDisabled = type === 'GST' && !cart.some(item => item.gst_number);
                    return (
                      <div key={type}
                        onClick={() => !isGstDisabled && setBillType(type)}
                        style={{
                          padding: '1.2rem 1rem', 
                          borderRadius: '10px',
                          border: `2px solid ${billType === type ? 'var(--primary-color)' : 'var(--surface-border)'}`,
                          background: billType === type ? 'rgba(46,160,67,0.03)' : 'rgba(255,255,255,0.01)',
                          cursor: isGstDisabled ? 'not-allowed' : 'pointer',
                          textAlign: 'center',
                          opacity: isGstDisabled ? 0.4 : 1,
                          transition: 'all 0.2s ease',
                          boxShadow: billType === type ? '0 4px 12px rgba(46,160,67,0.08)' : 'none'
                        }}
                      >
                        <span style={{ fontSize: '1.6rem', display: 'block', marginBottom: '0.4rem' }}>{type === 'GST' ? '🏢' : '🧾'}</span>
                        <p style={{ color: 'var(--text-highlight)', margin: '0 0 0.2rem 0', fontWeight: '700', fontSize: '0.95rem' }}>
                          {type === 'GST' ? 'GST Invoice' : 'Retail Invoice'}
                        </p>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                          {type === 'GST' ? 'Claim input credit' : 'Simple standard purchase'}
                        </p>
                        {isGstDisabled && <p style={{ fontSize: '0.7rem', color: 'var(--danger-color)', marginTop: '0.5rem', fontWeight: 'bold' }}>Vendor not GST-registered</p>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Payment Settlement Methods */}
              <div className="glass-panel" style={{ padding: '2rem', borderRadius: '16px' }}>
                <h3 style={{ color: 'var(--text-highlight)', margin: '0 0 1.2rem 0', fontSize: '1.2rem', fontWeight: '700', borderBottom: '1px solid var(--surface-border)', paddingBottom: '0.8rem' }}>
                  💳 Settlement Payment Method
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                  {paymentOptions.map((opt) => (
                    <div
                      key={opt.id}
                      onClick={() => !opt.disabled && setPaymentMethod(opt.id)}
                      style={{
                        padding: '1.2rem 1rem',
                        borderRadius: '10px',
                        border: `2px solid ${opt.disabled ? 'rgba(248,81,73,0.2)' : paymentMethod === opt.id ? 'var(--primary-color)' : 'var(--surface-border)'}`,
                        background: opt.disabled ? 'rgba(248,81,73,0.02)' : paymentMethod === opt.id ? 'rgba(46, 160, 67, 0.03)' : 'rgba(255, 255, 255, 0.01)',
                        cursor: opt.disabled ? 'not-allowed' : 'pointer',
                        opacity: opt.disabled ? 0.45 : 1,
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.4rem',
                        textAlign: 'center',
                        boxShadow: paymentMethod === opt.id ? '0 4px 12px rgba(46,160,67,0.08)' : 'none'
                      }}
                    >
                      <span style={{ fontSize: '1.6rem' }}>{opt.icon}</span>
                      <span style={{ color: opt.disabled ? 'var(--text-secondary)' : paymentMethod === opt.id ? 'white' : 'var(--text-highlight)', fontSize: '0.95rem', fontWeight: '700' }}>{opt.label}</span>
                      {opt.subtitle && (
                        <span style={{ fontSize: '0.72rem', color: opt.disabled ? '#f85149' : 'var(--primary-color)', fontWeight: '600' }}>
                          {opt.subtitle}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Panel: Order Item Detail Summaries and Pay Action */}
            <div style={{ flex: '1 1 320px', position: 'sticky', top: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: 0 }}>
              
              <div className="glass-panel" style={{ padding: '2rem', borderRadius: '16px' }}>
                <h3 style={{ color: 'var(--text-highlight)', margin: '0 0 1.2rem 0', fontSize: '1.2rem', fontWeight: '700', borderBottom: '1px solid var(--surface-border)', paddingBottom: '0.8rem' }}>
                  🛒 Order Summary
                </h3>

                {/* Items list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '200px', overflowY: 'auto', marginBottom: '1.5rem', paddingRight: '0.3rem' }}>
                  {cart.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.8rem', paddingBottom: '0.8rem', borderBottom: '1px solid var(--surface-border)' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ color: 'var(--text-highlight)', display: 'block', fontSize: '0.92rem', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>₹{item.price} × {item.quantity}</span>
                      </div>
                      
                      {/* Quantity Up/Down */}
                      <div className="quantity-selector" style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid var(--surface-border)', borderRadius: '6px', height: '30px' }}>
                        <button 
                          className="quantity-btn"
                          style={{ border: 'none', background: 'none', color: 'var(--text-highlight)', cursor: 'pointer', padding: '0 0.5rem', fontSize: '0.9rem' }}
                          onClick={() => updateQuantity(item.cart_id, item.quantity - 1)}
                        >
                          −
                        </button>
                        <input 
                          className="quantity-input"
                          type="number" 
                          min="0" 
                          value={item.quantity} 
                          style={{ border: 'none', background: 'none', color: 'var(--text-highlight)', textAlign: 'center', width: '30px', fontSize: '0.85rem', fontWeight: 'bold' }}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '') {
                              setCart(prev => prev.map(i => 
                                i.cart_id === item.cart_id ? { ...i, quantity: '' } : i
                              ));
                            } else {
                              const parsed = parseInt(val);
                              if (!isNaN(parsed)) updateQuantity(item.cart_id, parsed);
                            }
                          }}
                          onBlur={(e) => {
                            const val = parseInt(e.target.value);
                            if (isNaN(val) || val < 1) updateQuantity(item.cart_id, 1);
                          }}
                        />
                        <button 
                          className="quantity-btn"
                          style={{ border: 'none', background: 'none', color: 'var(--text-highlight)', cursor: 'pointer', padding: '0 0.5rem', fontSize: '0.9rem' }}
                          onClick={() => updateQuantity(item.cart_id, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Subtotals Breakup */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Subtotal (Base)</span>
                    <span style={{ color: 'var(--text-highlight)', fontWeight: '600' }}>₹{baseTotal.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: gstTotal > 0 ? '#3498db' : 'var(--text-secondary)' }}>
                      GST (18%)
                      {gstTotal === 0 && (
                        <span style={{ fontSize: '0.72rem', marginLeft: '6px', color: '#ffd700' }}>
                          (N/A)
                        </span>
                      )}
                    </span>
                    <span style={{ color: gstTotal > 0 ? '#3498db' : 'var(--text-secondary)', fontWeight: '600' }}>
                      {gstTotal > 0 ? `₹${gstTotal.toFixed(2)}` : '₹0.00'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#ffd700' }}>Platform Fee</span>
                    <span style={{ color: '#ffd700', fontWeight: '600' }}>₹{commissionTotal.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--surface-border)', paddingTop: '0.8rem', marginTop: '0.3rem', fontSize: '1.2rem', fontWeight: '800' }}>
                    <span style={{ color: 'var(--text-highlight)' }}>Total Due</span>
                    <span style={{ color: 'var(--primary-color)' }}>₹{total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Checkout Submit CTA */}
                <button
                  onClick={handlePayment}
                  disabled={paying}
                  className="btn"
                  style={{ width: '100%', fontSize: '1.05rem', padding: '0.9rem', fontWeight: '700', borderRadius: '8px', cursor: 'pointer', background: 'var(--primary-color)' }}
                >
                  {paying ? 'Processing...' : (
                    paymentMethod === 'COD' ? 'Place Order (COD) 💵' :
                    paymentMethod === 'PayLater' ? 'Place Credit Order ⏳' :
                      `Settle ₹${total.toFixed(2)} Now`
                  )}
                </button>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: '1rem', textAlign: 'center', lineHeight: '1.4', margin: '1rem 0 0 0' }}>
                  {paymentMethod === 'COD' ? '🤝 Pay cash or UPI directly to the vendor agent upon delivery.' :
                   paymentMethod === 'PayLater' ? '📅 Pay interest-free within invoice cycles set by platform admins.' :
                      '🔒 Transactions secured via encrypted platform gateway.'}
                </p>
              </div>

            </div>

          </div>
        )}
      </main>
    </div>
  );
}

export default Checkout;
