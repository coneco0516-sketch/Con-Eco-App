import React from 'react';

function AddressCard({ address, onEdit, onDelete, onSetDefault }) {
  const getIcon = (label) => {
    switch (label?.toLowerCase()) {
      case 'home': return '🏠';
      case 'office': return '🏢';
      case 'site': return '🏗️';
      case 'warehouse': return '🏭';
      case 'pickup point': return '📦';
      default: return '📌';
    }
  };

  return (
    <div style={{
      padding: '1.25rem',
      borderRadius: '8px',
      border: `2px solid ${address.is_default ? 'var(--primary-color)' : 'var(--surface-border)'}`,
      background: address.is_default ? 'rgba(46,160,67,0.05)' : 'rgba(255,255,255,0.02)',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.2rem' }}>{getIcon(address.label)}</span>
          <strong style={{ color: 'var(--text-highlight)' }}>{address.label || 'Other'}</strong>
        </div>
        {address.is_default && (
          <span style={{ 
            fontSize: '0.75rem', 
            background: 'var(--primary-color)', 
            color: 'white', 
            padding: '2px 6px', 
            borderRadius: '4px',
            fontWeight: 'bold'
          }}>
            Default
          </span>
        )}
      </div>

      <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.4' }}>
        {address.full_name && <div><strong>{address.full_name}</strong> {address.phone && `| 📞 ${address.phone}`}</div>}
        <div>{address.line1}</div>
        {address.line2 && <div>{address.line2}</div>}
        <div>{address.city}, {address.state} — {address.pincode}</div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', borderTop: '1px solid var(--surface-border)', paddingTop: '0.75rem' }}>
        <button 
          onClick={() => onEdit(address)} 
          style={{ background: 'none', border: 'none', color: '#3498db', cursor: 'pointer', fontSize: '0.85rem' }}
        >
          ✏️ Edit
        </button>
        <button 
          onClick={() => onDelete(address.address_id)} 
          style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: '0.85rem' }}
        >
          🗑️ Delete
        </button>
        {!address.is_default && (
          <button 
            onClick={() => onSetDefault(address.address_id)} 
            style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontSize: '0.85rem', marginLeft: 'auto' }}
          >
            ☑ Set Default
          </button>
        )}
      </div>
    </div>
  );
}

export default AddressCard;
