import React, { useState, useEffect } from 'react';

const API = import.meta.env.VITE_API_URL || 'https://api.coneco.store';

function AddressFormModal({ isOpen, onClose, onSave, address, role }) {
  const [formData, setFormData] = useState({
    label: 'Home',
    full_name: '',
    phone: '',
    pincode: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    is_default: false
  });
  const [loading, setLoading] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (address) {
        setFormData(address);
      } else {
        setFormData({
          label: role === 'Vendor' ? 'Warehouse' : 'Home',
          full_name: '',
          phone: '',
          pincode: '',
          line1: '',
          line2: '',
          city: '',
          state: '',
          is_default: false
        });
      }
    }
  }, [isOpen, address, role]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePincodeBlur = async () => {
    if (formData.pincode.length === 6) {
      setPincodeLoading(true);
      try {
        const resp = await fetch(`${API}/api/addresses/pincode/${formData.pincode}`);
        const data = await resp.json();
        if (data.status === 'success') {
          setFormData(prev => ({
            ...prev,
            city: data.city || prev.city,
            state: data.state || prev.state
          }));
        }
      } catch (err) {
        console.error("Failed to fetch pincode details", err);
      } finally {
        setPincodeLoading(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSave(formData);
    setLoading(false);
  };

  const labels = role === 'Vendor' 
    ? ['Warehouse', 'Office', 'Pickup Point', 'Other']
    : ['Home', 'Office', 'Site', 'Other'];

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
        <h3 style={{ marginTop: 0, color: 'var(--text-highlight)' }}>
          {address ? 'Edit Address' : 'Add New Address'}
        </h3>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div>
            <label className="input-label">Address Label</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {labels.map(l => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setFormData({...formData, label: l})}
                  style={{
                    padding: '0.4rem 0.8rem',
                    borderRadius: '20px',
                    border: `1px solid ${formData.label === l ? 'var(--primary-color)' : 'var(--surface-border)'}`,
                    background: formData.label === l ? 'rgba(46,160,67,0.2)' : 'transparent',
                    color: formData.label === l ? 'white' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label className="input-label">Contact Person (Optional)</label>
              <input type="text" name="full_name" value={formData.full_name || ''} onChange={handleChange} className="input-field" placeholder="Full Name" />
            </div>
            <div style={{ flex: 1 }}>
              <label className="input-label">Phone (Optional)</label>
              <input type="tel" name="phone" value={formData.phone || ''} onChange={handleChange} className="input-field" placeholder="10-digit number" />
            </div>
          </div>

          <div>
            <label className="input-label">Pincode *</label>
            <input 
              type="text" 
              name="pincode" 
              value={formData.pincode} 
              onChange={handleChange} 
              onBlur={handlePincodeBlur}
              className="input-field" 
              placeholder="6-digit pincode"
              required 
              maxLength="6"
            />
            {pincodeLoading && <span style={{ fontSize: '0.75rem', color: '#3498db' }}>Fetching city/state...</span>}
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label className="input-label">City *</label>
              <input type="text" name="city" value={formData.city} onChange={handleChange} className="input-field" required />
            </div>
            <div style={{ flex: 1 }}>
              <label className="input-label">State *</label>
              <input type="text" name="state" value={formData.state} onChange={handleChange} className="input-field" required />
            </div>
          </div>

          <div>
            <label className="input-label">Flat, House no., Building, Company, Apartment *</label>
            <input type="text" name="line1" value={formData.line1} onChange={handleChange} className="input-field" required />
          </div>

          <div>
            <label className="input-label">Area, Street, Sector, Village (Optional)</label>
            <input type="text" name="line2" value={formData.line2 || ''} onChange={handleChange} className="input-field" />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-highlight)', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={formData.is_default}
              onChange={(e) => setFormData({...formData, is_default: e.target.checked})}
            />
            Make this my default address
          </label>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button type="submit" disabled={loading} className="btn" style={{ flex: 1 }}>
              {loading ? 'Saving...' : 'Save Address'}
            </button>
            <button type="button" onClick={onClose} disabled={loading} className="btn danger" style={{ background: 'transparent', border: '1px solid var(--surface-border)' }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddressFormModal;
