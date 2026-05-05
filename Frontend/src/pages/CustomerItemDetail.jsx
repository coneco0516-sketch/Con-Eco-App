import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CustomerSidebar from '../components/CustomerSidebar';

const API = import.meta.env.VITE_API_URL || '';

function CustomerItemDetail() {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [quantity, setQuantity] = useState(1);
  const [reviewsData, setReviewsData] = useState({ stats: { average_rating: 0, total_reviews: 0 }, reviews: [] });
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  const isProduct = type.toLowerCase() === 'product';
  const endpoint = isProduct ? `${API}/api/customer/products` : `${API}/api/customer/services`;

  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkData, setBulkData] = useState({ address: '', city: '', state: '', message: '' });
  const [submittingBulk, setSubmittingBulk] = useState(false);

  const fetchReviews = () => {
    // Reviews are fetched optionally from public or authenticated.
    fetch(`${API}/api/customer/reviews/${type.toLowerCase()}/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setReviewsData({ stats: data.stats, reviews: data.reviews });
        }
      })
      .catch(err => console.error(err));
  };

  const [commRate, setCommRate] = useState(3.0);

  useEffect(() => {
    fetch(endpoint, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.items) {
          const foundItem = data.items.find(i => String(i.item_id) === String(id));
          setItem(foundItem);
        }
        if (data.commission_rate !== undefined) setCommRate(data.commission_rate);
        setLoading(false);
      })
      .catch(err => setLoading(false));

    fetchReviews();
  }, [endpoint, id, type]);

  const handleAction = async () => {
    try {
      const resp = await fetch(`${API}/api/customer/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_type: isProduct ? 'Product' : 'Service',
          item_id: item.item_id,
          quantity: Math.max(1, parseInt(quantity) || 1)
        }),
        credentials: 'include'
      });
      const data = await resp.json();
      if (data.status === 'success') {
        setMessage({ type: 'success', text: isProduct ? 'Added to cart!' : 'Service added to cart! Proceed to checkout.' });
        setTimeout(() => setMessage({ type: '', text: '' }), 2000);
      } else {
        setMessage({ type: 'error', text: 'Failed to process request' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error' });
    }
  };

  const sendBulkRequest = async (e) => {
    e.preventDefault();
    if (!bulkData.address || !bulkData.city || !bulkData.state) {
      setMessage({ type: 'error', text: 'Please fill all address fields.' });
      return;
    }
    setSubmittingBulk(true);
    try {
      const resp = await fetch(`${API}/api/customer/bulk-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_type: isProduct ? 'Product' : 'Service',
          item_id: item.item_id,
          quantity: Math.max(1, parseInt(quantity) || 1),
          message: bulkData.message,
          address: bulkData.address,
          city: bulkData.city,
          state: bulkData.state
        }),
        credentials: 'include'
      });
      const data = await resp.json();
      if (data.status === 'success') {
        setMessage({ type: 'success', text: 'Bulk request sent! Check your orders for updates.' });
        setShowBulkModal(false);
        setBulkData({ address: '', city: '', state: '', message: '' });
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to send request' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error sending bulk request' });
    }
    setSubmittingBulk(false);
  };

  const submitReview = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      const resp = await fetch(`${API}/api/customer/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_type: isProduct ? 'Product' : 'Service',
          item_id: item.item_id,
          rating: Number(reviewForm.rating),
          comment: reviewForm.comment
        }),
        credentials: 'include'
      });
      const data = await resp.json();
      if (resp.ok && data.status === 'success') {
        setMessage({ type: 'success', text: 'Review submitted successfully!' });
        setReviewForm({ rating: 5, comment: '' });
        fetchReviews();
      } else {
        setMessage({ type: 'error', text: data.detail || data.message || 'Failed to submit review. Please ensure you are logged in.' });
      }
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch {
      setMessage({ type: 'error', text: 'Network error submitting review' });
    }
    setSubmittingReview(false);
  };

  return (
    <div className="dashboard-layout">
      <CustomerSidebar />
      <main style={{ flex: 1 }}>
        <button
          onClick={() => navigate(-1)}
          className="btn"
          style={{ background: 'transparent', border: '1px solid var(--surface-border)', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}
        >
          &larr; Back
        </button>

        {message.text && (
          <div style={{ padding: '1rem', marginBottom: '1rem', borderRadius: '4px', background: message.type === 'success' ? 'rgba(36, 134, 54, 0.3)' : 'rgba(248, 81, 73, 0.3)', color: message.type === 'success' ? '#238636' : '#f85149' }}>
            {message.text}
          </div>
        )}

        {loading ? (
          <p>Loading details...</p>
        ) : item ? (
          <>
            <div className="glass-panel" style={{ padding: '2rem', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
              {/* Image Section */}
              <div style={{ flex: '1 1 400px' }}>
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://placehold.co/800x600?text=" + encodeURIComponent(item.name);
                    }}
                    style={{ width: '100%', borderRadius: '8px', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '300px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                    No Image Available
                  </div>
                )}
              </div>

              {/* Details Section */}
              <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column' }}>
                <h1 style={{ color: 'var(--text-highlight)', marginTop: 0, marginBottom: '0.5rem', fontSize: '2.5rem' }}>{item.name}</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                  <p style={{ color: 'var(--primary-color)', fontSize: '1.2rem', margin: 0 }}>
                    Provider: <span style={{ color: 'var(--text-highlight)' }}>{item.vendor_name}</span>
                  </p>
                  {reviewsData.stats.total_reviews > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,215,0,0.1)', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
                      <span style={{ color: '#ffd700', fontSize: '1.1rem', marginRight: '0.3rem' }}>★</span>
                      <span style={{ color: 'var(--text-highlight)', fontWeight: 'bold' }}>{reviewsData.stats.average_rating}</span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginLeft: '0.4rem' }}>({reviewsData.stats.total_reviews} reviews)</span>
                    </div>
                  )}
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                  <h3 style={{ color: 'var(--text-secondary)', marginTop: 0 }}>Pricing Details</h3>
                  <p style={{ fontSize: '1.2rem', margin: '0.5rem 0' }}>Base: ₹{item.price} {item.unit ? `/ ${item.unit}` : ''}</p>
                  <p style={{ color: '#ffd700', margin: '0.5rem 0' }}>Est. Commission: ₹{(item.price * parseFloat(commRate) / 100).toFixed(2)} ({commRate}%)</p>
                  <p style={{ color: 'var(--primary-color)', fontWeight: 'bold', fontSize: '1.5rem', margin: '1rem 0 0 0', borderTop: '1px solid var(--surface-border)', paddingTop: '1rem' }}>
                    Est. Total: ₹{(parseFloat(item.price) * (1 + parseFloat(commRate) / 100)).toFixed(2)} (+ applicable taxes)
                  </p>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ color: 'var(--text-highlight)', marginBottom: '0.5rem' }}>Description</h3>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                    {item.description || 'No description provided.'}
                  </p>

                  {item.specifications && (
                    <div style={{ marginTop: '1.5rem' }}>
                      <h3 style={{ color: 'var(--text-highlight)', marginBottom: '0.5rem' }}>Specifications / Features</h3>
                      <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                        {item.specifications}
                      </p>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
                    {item.category && (
                      <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                        <strong>Category:</strong> <span style={{ background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px', marginLeft: '0.5rem' }}>{item.category}</span>
                      </p>
                    )}
                    {item.brand && (
                      <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                        <strong>Brand:</strong> <span style={{ background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px', marginLeft: '0.5rem' }}>{item.brand}</span>
                      </p>
                    )}
                    {item.delivery_time && (
                      <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                        <strong>Delivery / Availability:</strong> <span style={{ background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px', marginLeft: '0.5rem' }}>{item.delivery_time}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: 'auto', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <label className="input-label" style={{ marginBottom: 0 }}>Quantity</label>
                    <div className="quantity-selector" style={{ width: '130px' }}>
                      <button 
                        className="quantity-btn"
                        onClick={() => {
                          const currentQty = parseInt(quantity) || 1;
                          setQuantity(Math.max(1, currentQty - 1));
                        }}
                      >
                        −
                      </button>
                      <input 
                        className="quantity-input"
                        type="number" 
                        min="0" 
                        value={quantity} 
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '') {
                            setQuantity('');
                          } else {
                            const parsed = parseInt(val);
                            if (!isNaN(parsed)) setQuantity(parsed);
                          }
                        }}
                        onBlur={() => {
                          if (quantity === '' || parseInt(quantity) < 1) {
                            setQuantity(1);
                          }
                        }}
                      />
                      <button 
                        className="quantity-btn"
                        onClick={() => {
                          const currentQty = parseInt(quantity) || 0;
                          setQuantity(currentQty + 1);
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div style={{ flex: 1, display: 'flex', gap: '1rem' }}>
                    <button
                      onClick={handleAction}
                      className="btn"
                      style={{ background: '#238636', flex: 1, padding: '1rem', fontSize: '1.1rem' }}
                    >
                      {isProduct ? 'Add to Cart' : 'Book Service'}
                    </button>
                    {isProduct && (
                      <button
                        onClick={() => setShowBulkModal(true)}
                        className="btn"
                        style={{ background: 'transparent', border: '1px solid var(--primary-color)', color: 'var(--primary-color)', flex: 1, padding: '1rem', fontSize: '1.1rem' }}
                      >
                        Request Bulk Price
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bulk Modal */}
            {showBulkModal && (
              <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(10px)' }}>
                <div className="glass-panel" style={{ width: '90%', maxWidth: '500px', padding: '2.5rem', position: 'relative' }}>
                  <button onClick={() => setShowBulkModal(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: 'var(--text-highlight)', cursor: 'pointer', fontSize: '1.5rem' }}>×</button>
                  <h2 style={{ color: 'var(--text-highlight)', marginTop: 0, marginBottom: '1rem' }}>Bulk Negotiation</h2>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Send a request to the vendor for a customized bulk price for {quantity} units.</p>
                  
                  <form onSubmit={sendBulkRequest} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    <div>
                      <label className="input-label">Delivery Address</label>
                      <input 
                        type="text" 
                        className="input-field" 
                        placeholder="Site location / Street" 
                        value={bulkData.address} 
                        onChange={e => setBulkData({...bulkData, address: e.target.value})}
                        required
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <label className="input-label">City</label>
                        <input 
                          type="text" 
                          className="input-field" 
                          placeholder="City" 
                          value={bulkData.city} 
                          onChange={e => setBulkData({...bulkData, city: e.target.value})}
                          required
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label className="input-label">State</label>
                        <input 
                          type="text" 
                          className="input-field" 
                          placeholder="State" 
                          value={bulkData.state} 
                          onChange={e => setBulkData({...bulkData, state: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="input-label">Meassage (Optional)</label>
                      <textarea 
                        className="input-field" 
                        placeholder="Mention your target price or requirements..." 
                        rows="3"
                        value={bulkData.message}
                        onChange={e => setBulkData({...bulkData, message: e.target.value})}
                      ></textarea>
                    </div>
                    <button type="submit" disabled={submittingBulk} className="btn" style={{ background: 'var(--primary-color)', padding: '1rem', fontSize: '1.1rem', marginTop: '1rem' }}>
                      {submittingBulk ? 'Sending Request...' : 'Send Request to Vendor'}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Reviews Section */}
            <div className="glass-panel" style={{ padding: '2rem', marginTop: '2rem' }}>
              <h2 style={{ color: 'var(--text-highlight)', marginTop: 0, marginBottom: '1.5rem', borderBottom: '1px solid var(--surface-border)', paddingBottom: '1rem' }}>
                Customer Reviews
              </h2>

              {reviewsData.reviews.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
                  {reviewsData.reviews.map(review => (
                    <div key={review.review_id} style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <strong style={{ color: 'var(--text-highlight)' }}>{review.customer_name}</strong>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{review.date}</span>
                      </div>
                      <div style={{ color: '#ffd700', marginBottom: '0.8rem', fontSize: '1.1rem' }}>
                        {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                      </div>
                      <p style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                        {review.comment}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontStyle: 'italic' }}>
                  No reviews yet. Be the first to review this {item.type.toLowerCase()}!
                </p>
              )}

              {/* Write a Review Form */}
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                <h3 style={{ color: 'var(--text-highlight)', marginTop: 0, marginBottom: '1rem' }}>Write a Review</h3>
                <form onSubmit={submitReview} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <label style={{ color: 'var(--text-secondary)', fontWeight: 'bold' }}>Rating:</label>
                    <select
                      className="input-field"
                      value={reviewForm.rating}
                      onChange={e => setReviewForm({ ...reviewForm, rating: e.target.value })}
                      style={{ width: '150px' }}
                    >
                      <option value="5">★★★★★ (5)</option>
                      <option value="4">★★★★☆ (4)</option>
                      <option value="3">★★★☆☆ (3)</option>
                      <option value="2">★★☆☆☆ (2)</option>
                      <option value="1">★☆☆☆☆ (1)</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ color: 'var(--text-secondary)', fontWeight: 'bold' }}>Your Experience:</label>
                    <textarea
                      className="input-field"
                      placeholder="Share your thoughts about this item..."
                      rows="4"
                      value={reviewForm.comment}
                      onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })}
                      required
                    ></textarea>
                  </div>
                  <button type="submit" className="btn" disabled={submittingReview} style={{ background: 'var(--primary-color)', alignSelf: 'flex-start', padding: '0.8rem 2rem' }}>
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              </div>
            </div>
          </>
        ) : (
          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
            <h3 style={{ color: 'var(--text-secondary)' }}>Item not found.</h3>
          </div>
        )}
      </main>
    </div>
  );
}

export default CustomerItemDetail;
