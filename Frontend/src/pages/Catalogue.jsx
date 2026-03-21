import React, { useState, useEffect } from 'react';
import VendorSidebar from '../components/VendorSidebar';

function Catalogue() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newItem, setNewItem] = useState({ type: 'product', name: '', description: '', price: '' });

  useEffect(() => {
    fetchCatalogue();
  }, []);

  const fetchCatalogue = () => {
    setLoading(true);
    fetch('/api/vendor/catalogue', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.items) setItems(data.items);
        setLoading(false);
      })
      .catch(err => setLoading(false));
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('item_type', newItem.type);
    formData.append('name', newItem.name);
    formData.append('description', newItem.description);
    formData.append('price', newItem.price);

    try {
      const resp = await fetch('/api/vendor/catalogue', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      const data = await resp.json();
      if (data.status === 'success') {
        setShowModal(false);
        setNewItem({ type: 'product', name: '', description: '', price: '' });
        fetchCatalogue();
      } else {
        alert("Error: " + data.message);
      }
    } catch (err) {
      alert("Network error occurred.");
    }
  };

  return (
    <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
      <VendorSidebar />
      <main style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '2rem', color: 'white', marginTop: 0 }}>My Catalogue</h2>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>View and manage the items you have listed.</p>
          </div>
          <button className="btn" onClick={() => setShowModal(true)} style={{ background: 'var(--primary-color)', height: 'fit-content' }}>+ Add New Item</button>
        </div>
        <hr style={{ borderColor: 'var(--surface-border)', marginBottom: '1.5rem' }} />
        
        {showModal && (
          <div className="glass-panel" style={{ position: 'fixed', top: '20%', left: '30%', width: '400px', zIndex: 1000, padding: '2rem', boxShadow: '0 0 20px rgba(0,0,0,0.5)' }}>
            <h3 style={{ color: 'white', marginBottom: '1rem' }}>Add New Item</h3>
            <form onSubmit={handleAddItem} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <select className="input-field" value={newItem.type} onChange={(e) => setNewItem({...newItem, type: e.target.value})}>
                <option value="product">Product</option>
                <option value="service">Service</option>
              </select>
              <input type="text" placeholder="Name" className="input-field" required value={newItem.name} onChange={(e) => setNewItem({...newItem, name: e.target.value})} />
              <textarea placeholder="Description" className="input-field" required value={newItem.description} onChange={(e) => setNewItem({...newItem, description: e.target.value})} />
              <input type="number" placeholder="Price" className="input-field" required value={newItem.price} onChange={(e) => setNewItem({...newItem, price: e.target.value})} />
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn">Add to Catalogue</button>
                <button type="button" className="btn danger" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        )}
        
        {loading ? (
          <p>Loading catalogue...</p>
        ) : items.length > 0 ? (
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            {items.map(i => (
              <div key={i.id} className="glass-panel" style={{ padding: '1.5rem', flex: '1 1 250px' }}>
                <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>{i.name}</h3>
                <p style={{ color: 'var(--primary-color)', fontWeight: 'bold', marginBottom: '1rem' }}>₹{i.price}</p>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Type: {i.type}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
            <h3 style={{ color: 'var(--text-secondary)' }}>You have no items in your catalogue.</h3>
          </div>
        )}
      </main>
    </div>
  );
}

export default Catalogue;
