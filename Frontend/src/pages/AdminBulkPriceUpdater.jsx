import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';

const API = process.env.REACT_APP_API_URL || '';

function AdminBulkPriceUpdater() {
  const [vendors, setVendors] = useState([]);
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // State to track price inputs locally before saving
  const [priceInputs, setPriceInputs] = useState({});
  const [savingStatus, setSavingStatus] = useState({}); // { productId: 'saving' | 'success' | 'error' }

  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem('user_role');
    if (role !== 'Admin') {
      navigate('/login');
      return;
    }

    // Fetch vendors for dropdown
    fetch(`${API}/api/admin/vendors`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setVendors(data.vendors || []);
        } else {
          setError(data.message || 'Failed to fetch vendors');
        }
      })
      .catch(err => setError('Network error fetching vendors.'));
  }, [navigate]);

  useEffect(() => {
    if (!selectedVendorId) {
      setProducts([]);
      return;
    }

    setLoading(true);
    setError(null);
    fetch(`${API}/api/admin/vendors/${selectedVendorId}/products`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setLoading(false);
        if (data.status === 'success') {
          setProducts(data.products || []);
          // Initialize price inputs
          const inputs = {};
          (data.products || []).forEach(p => {
            inputs[p.product_id] = p.price;
          });
          setPriceInputs(inputs);
        } else {
          setError(data.message || 'Failed to fetch products for vendor');
        }
      })
      .catch(err => {
        setLoading(false);
        setError('Network error fetching products.');
      });
  }, [selectedVendorId]);

  const handlePriceChange = (productId, newPrice) => {
    setPriceInputs(prev => ({ ...prev, [productId]: newPrice }));
  };

  const handleSavePrice = async (productId) => {
    const priceToSave = parseFloat(priceInputs[productId]);
    if (isNaN(priceToSave) || priceToSave < 0) {
      alert('Please enter a valid positive price.');
      return;
    }

    setSavingStatus(prev => ({ ...prev, [productId]: 'saving' }));

    try {
      const res = await fetch(`${API}/api/admin/products/${productId}/price`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ price: priceToSave })
      });
      const data = await res.json();
      
      if (data.status === 'success') {
        setSavingStatus(prev => ({ ...prev, [productId]: 'success' }));
        // Update local products state with new price and a fake 'just now' timestamp, 
        // or just let it be until they refresh. We can do a quick local update:
        setProducts(prev => prev.map(p => 
          p.product_id === productId ? { ...p, price: priceToSave, updated_at: 'Just Now' } : p
        ));
        
        // Clear success message after 2s
        setTimeout(() => {
          setSavingStatus(prev => ({ ...prev, [productId]: null }));
        }, 2000);
      } else {
        setSavingStatus(prev => ({ ...prev, [productId]: 'error' }));
        alert(data.message || 'Failed to save price');
      }
    } catch (err) {
      setSavingStatus(prev => ({ ...prev, [productId]: 'error' }));
      alert('Network error saving price.');
    }
  };

  // Allow pressing Enter to save
  const handleKeyDown = (e, productId) => {
    if (e.key === 'Enter') {
      handleSavePrice(productId);
      
      // Move focus to next input if possible
      const formElements = Array.from(document.querySelectorAll('.price-input'));
      const index = formElements.indexOf(e.target);
      if (index > -1 && index < formElements.length - 1) {
        formElements[index + 1].focus();
      }
    }
  };

  return (
    <div className="dashboard-layout">
      <AdminSidebar />
      <main style={{ flex: 1 }}>
        <h2 style={{ fontSize: '2rem', color: 'var(--text-highlight)', marginTop: 0 }}>Vendor Bulk Price Updater</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Select a vendor to view their complete catalogue and update prices rapidly. Press Enter or click Save to apply changes instantly.
        </p>

        {error && <div style={{ color: 'var(--danger-color)', marginBottom: '1rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>{error}</div>}

        <div className="glass-panel" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Select Vendor</label>
          <select 
            value={selectedVendorId} 
            onChange={(e) => setSelectedVendorId(e.target.value)}
            style={{ width: '100%', maxWidth: '400px', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--surface-border)', background: 'var(--bg-color)', color: 'var(--text-primary)' }}
          >
            <option value="">-- Choose a Vendor --</option>
            {vendors.map(v => (
              <option key={v.vendor_id} value={v.vendor_id}>
                {v.company_name} ({v.name}) - Status: {v.verification_status}
              </option>
            ))}
          </select>
        </div>

        {loading && <p>Loading products...</p>}

        {!loading && selectedVendorId && products.length === 0 && (
          <p style={{ color: 'var(--text-secondary)' }}>This vendor has no products.</p>
        )}

        {!loading && products.length > 0 && (
          <div className="glass-panel" style={{ overflowX: 'auto', padding: '1rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--surface-border)' }}>
                  <th style={{ padding: '1rem' }}>Category</th>
                  <th style={{ padding: '1rem' }}>Brand</th>
                  <th style={{ padding: '1rem' }}>Product Name</th>
                  <th style={{ padding: '1rem' }}>Last Updated</th>
                  <th style={{ padding: '1rem', minWidth: '150px' }}>Price (₹)</th>
                  <th style={{ padding: '1rem' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.product_id} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                    <td style={{ padding: '1rem' }}>{product.category}</td>
                    <td style={{ padding: '1rem' }}>{product.brand || '-'}</td>
                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>{product.name}</td>
                    <td style={{ padding: '1rem', color: product.updated_at === 'Just Now' ? '#3fb950' : 'var(--text-secondary)' }}>
                      {product.updated_at || 'Never'}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <input 
                        type="number" 
                        className="price-input"
                        value={priceInputs[product.product_id] !== undefined ? priceInputs[product.product_id] : ''}
                        onChange={(e) => handlePriceChange(product.product_id, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, product.product_id)}
                        style={{ 
                          width: '100px', 
                          padding: '0.5rem', 
                          borderRadius: '4px', 
                          border: '1px solid var(--surface-border)', 
                          background: 'var(--bg-color)', 
                          color: 'var(--text-primary)',
                          textAlign: 'right'
                        }}
                        step="0.01"
                      />
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <button 
                        onClick={() => handleSavePrice(product.product_id)}
                        disabled={savingStatus[product.product_id] === 'saving'}
                        style={{
                          background: savingStatus[product.product_id] === 'success' ? '#2ea043' : 'var(--primary-color)',
                          color: 'white',
                          border: 'none',
                          padding: '0.5rem 1rem',
                          borderRadius: '4px',
                          cursor: savingStatus[product.product_id] === 'saving' ? 'not-allowed' : 'pointer',
                          fontWeight: 'bold',
                          transition: 'background 0.2s'
                        }}
                      >
                        {savingStatus[product.product_id] === 'saving' ? 'Saving...' : 
                         savingStatus[product.product_id] === 'success' ? 'Saved! ✓' : 'Save'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminBulkPriceUpdater;
