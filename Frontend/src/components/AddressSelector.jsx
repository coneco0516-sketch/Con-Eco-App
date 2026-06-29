import React, { useState, useEffect } from 'react';
import AddressFormModal from './AddressFormModal';

const API = import.meta.env.VITE_API_URL || 'https://api.coneco.store';

function AddressSelector({ selectedAddressId, onSelect, onAddressStringChange }) {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${API}/api/addresses/`, { credentials: 'include' });
      const data = await resp.json();
      if (data.status === 'success') {
        const addrs = data.addresses || [];
        setAddresses(addrs);
        
        // Auto-select the default or first address if nothing is selected
        if (!selectedAddressId && addrs.length > 0) {
          const defaultAddr = addrs.find(a => a.is_default) || addrs[0];
          handleSelect(defaultAddr);
        }
      }
    } catch (err) {
      console.error('Error fetching addresses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const formatAddressString = (addr) => {
    const parts = [
      addr.full_name,
      addr.line1,
      addr.line2,
      `${addr.city}, ${addr.state}`,
      `Pincode: ${addr.pincode}`,
      addr.phone ? `Phone: ${addr.phone}` : ''
    ];
    return parts.filter(Boolean).join(', ');
  };

  const handleSelect = (addr) => {
    onSelect(addr.address_id);
    onAddressStringChange(formatAddressString(addr));
  };

  const handleSaveNew = async (formData) => {
    try {
      const resp = await fetch(`${API}/api/addresses/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include'
      });
      const data = await resp.json();
      if (data.status === 'success') {
        setIsModalOpen(false);
        await fetchAddresses();
      } else {
        alert('Error saving address: ' + data.message);
      }
    } catch (err) {
      alert('Network error.');
    }
  };

  const getIcon = (label) => {
    switch (label?.toLowerCase()) {
      case 'home': return '🏠';
      case 'office': return '🏢';
      case 'site': return '🏗️';
      default: return '📍';
    }
  };

  if (loading) {
    return <div style={{ color: 'var(--text-secondary)' }}>Loading saved addresses...</div>;
  }

  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {addresses.map(addr => {
          const isSelected = selectedAddressId === addr.address_id;
          return (
            <div 
              key={addr.address_id}
              onClick={() => handleSelect(addr)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1rem',
                padding: '1rem',
                borderRadius: '8px',
                border: `2px solid ${isSelected ? 'var(--primary-color)' : 'var(--surface-border)'}`,
                background: isSelected ? 'rgba(46,160,67,0.05)' : 'rgba(255,255,255,0.02)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ 
                width: '20px', height: '20px', 
                borderRadius: '50%', 
                border: `2px solid ${isSelected ? 'var(--primary-color)' : 'var(--text-secondary)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginTop: '4px'
              }}>
                {isSelected && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary-color)' }}></div>}
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '1.1rem' }}>{getIcon(addr.label)}</span>
                  <strong style={{ color: 'var(--text-highlight)' }}>{addr.label || 'Other'}</strong>
                  {addr.is_default && (
                    <span style={{ fontSize: '0.65rem', background: 'var(--surface-border)', padding: '2px 6px', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                      Default
                    </span>
                  )}
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.4' }}>
                  {addr.full_name && <strong>{addr.full_name} </strong>}
                  {addr.line1}, {addr.line2 && `${addr.line2}, `} 
                  {addr.city}, {addr.state} - {addr.pincode}
                  {addr.phone && <div style={{ marginTop: '0.25rem' }}>📞 {addr.phone}</div>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button 
        type="button"
        onClick={() => setIsModalOpen(true)}
        style={{
          marginTop: '1rem',
          background: 'none',
          border: '1px dashed var(--primary-color)',
          color: 'var(--primary-color)',
          padding: '0.75rem',
          width: '100%',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '0.95rem',
          fontWeight: 'bold'
        }}
      >
        + Add a New Address
      </button>

      <AddressFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveNew}
        address={null}
        role="Customer"
      />
    </div>
  );
}

export default AddressSelector;
