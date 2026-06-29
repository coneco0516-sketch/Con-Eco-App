import React, { useState, useEffect } from 'react';
import AddressCard from './AddressCard';
import AddressFormModal from './AddressFormModal';

const API = import.meta.env.VITE_API_URL || 'https://api.coneco.store';

function AddressBook({ role }) {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${API}/api/addresses/`, { credentials: 'include' });
      const data = await resp.json();
      if (data.status === 'success') {
        setAddresses(data.addresses || []);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to fetch addresses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleSave = async (formData) => {
    const isEdit = !!formData.address_id;
    const url = isEdit ? `${API}/api/addresses/${formData.address_id}` : `${API}/api/addresses/`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const resp = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include'
      });
      const data = await resp.json();
      if (data.status === 'success') {
        setIsModalOpen(false);
        fetchAddresses();
      } else {
        alert('Error saving address: ' + data.message);
      }
    } catch (err) {
      alert('Network error.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    try {
      const resp = await fetch(`${API}/api/addresses/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await resp.json();
      if (data.status === 'success') {
        fetchAddresses();
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Error deleting address.');
    }
  };

  const handleSetDefault = async (id) => {
    try {
      const resp = await fetch(`${API}/api/addresses/${id}/set_default`, {
        method: 'POST',
        credentials: 'include'
      });
      const data = await resp.json();
      if (data.status === 'success') {
        fetchAddresses();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openAddModal = () => {
    setEditingAddress(null);
    setIsModalOpen(true);
  };

  const openEditModal = (addr) => {
    setEditingAddress(addr);
    setIsModalOpen(true);
  };

  return (
    <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ margin: 0, color: 'var(--text-highlight)' }}>
          {role === 'Vendor' ? 'Business Addresses' : 'My Addresses'}
        </h3>
        <button onClick={openAddModal} className="btn" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
          + Add New Address
        </button>
      </div>

      {error && <p style={{ color: 'var(--danger-color)' }}>{error}</p>}
      
      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Loading addresses...</p>
      ) : addresses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>No addresses saved yet.</p>
          <button onClick={openAddModal} className="btn">Add Your First Address</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {addresses.map(addr => (
            <AddressCard 
              key={addr.address_id}
              address={addr}
              onEdit={openEditModal}
              onDelete={handleDelete}
              onSetDefault={handleSetDefault}
            />
          ))}
        </div>
      )}

      <AddressFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        address={editingAddress}
        role={role}
      />
    </div>
  );
}

export default AddressBook;
