import React, { useState, useEffect } from 'react';
import VendorSidebar from '../components/VendorSidebar';

function Catalogue() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newItem, setNewItem] = useState({ type: 'product', name: '', description: '', price: '', image_url: '', unit: '' });
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);

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
    setUploading(true);
    let finalImageUrl = newItem.image_url;

    // If a file is selected, upload it first
    if (imageFile) {
      const uploadData = new FormData();
      uploadData.append('file', imageFile);
      try {
        const upResp = await fetch('/api/vendor/upload_image', {
          method: 'POST',
          body: uploadData,
          credentials: 'include'
        });
        const upResult = await upResp.json();
        if (upResult.status === 'success') {
          finalImageUrl = upResult.image_url;
        } else {
          alert("Image upload failed: " + (upResult.detail || "Unknown error"));
          setUploading(false);
          return;
        }
      } catch (err) {
        alert("Upload error: " + err.message);
        setUploading(false);
        return;
      }
    }

    const formData = new FormData();
    formData.append('item_type', newItem.type);
    formData.append('name', newItem.name);
    formData.append('description', newItem.description);
    formData.append('price', newItem.price);
    formData.append('image_url', finalImageUrl || '');
    formData.append('unit', newItem.unit || '');

    try {
      const resp = await fetch('/api/vendor/catalogue', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        alert("Error adding item: " + (errData.detail || resp.statusText));
        return;
      }
      const data = await resp.json();
      if (data.status === 'success') {
        setShowModal(false);
        setNewItem({ type: 'product', name: '', description: '', price: '', image_url: '', unit: '' });
        setImageFile(null);
        fetchCatalogue();
      } else {
        alert("Error: " + (data.message || "Unknown error"));
      }
    } catch (err) {
      alert("Network error: " + err.message);
    } finally {
      setUploading(false);
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
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', zIndex: 999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div className="glass-panel" style={{ width: '400px', padding: '2rem', boxShadow: '0 0 20px rgba(0,0,0,0.5)' }}>
              <h3 style={{ color: 'white', marginBottom: '1.5rem' }}>Add New Item</h3>
              <form onSubmit={handleAddItem} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div>
                  <label className="input-label">Item Type</label>
                  <select className="input-field" value={newItem.type} onChange={(e) => setNewItem({...newItem, type: e.target.value})}>
                    <option value="product">Product</option>
                    <option value="service">Service</option>
                  </select>
                </div>
                <div>
                  <label className="input-label">Item Name</label>
                  <input type="text" placeholder="e.g. Quality Cement" className="input-field" required value={newItem.name} onChange={(e) => setNewItem({...newItem, name: e.target.value})} />
                </div>
                <div>
                  <label className="input-label">Description</label>
                  <textarea placeholder="Provide details..." className="input-field" required value={newItem.description} onChange={(e) => setNewItem({...newItem, description: e.target.value})} />
                </div>
                <div>
                  <label className="input-label">Price (₹)</label>
                  <input type="number" placeholder="0.00" className="input-field" required value={newItem.price} onChange={(e) => setNewItem({...newItem, price: e.target.value})} />
                </div>
                <div>
                  <label className="input-label">Unit</label>
                  <input type="text" placeholder="e.g. per bag, per ton, per sq.ft" className="input-field" required value={newItem.unit} onChange={(e) => setNewItem({...newItem, unit: e.target.value})} />
                </div>
                <div>
                  <label className="input-label">Image URL (Optional)</label>
                  <input type="url" placeholder="https://example.com/image.jpg" className="input-field" value={newItem.image_url} onChange={(e) => setNewItem({...newItem, image_url: e.target.value})} disabled={!!imageFile} />
                </div>
                <div>
                  <label className="input-label">Or Upload Photo</label>
                  <input type="file" accept="image/*" className="input-field" onChange={(e) => setImageFile(e.target.files[0])} style={{ padding: '0.4rem' }} />
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button type="submit" className="btn" style={{ flex: 1 }} disabled={uploading}>
                    {uploading ? 'Processing...' : 'Add Item'}
                  </button>
                  <button type="button" className="btn danger" onClick={() => { setShowModal(false); setImageFile(null); }} style={{ flex: 1 }}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {loading ? (
          <p>Loading catalogue...</p>
        ) : items.length > 0 ? (
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            {items.map(i => (
              <div key={i.id} className="glass-panel" style={{ padding: '1.5rem', flex: '1 1 250px', display: 'flex', flexDirection: 'column' }}>
                {i.image_url ? (
                  <img src={i.image_url} alt={i.name} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '4px', marginBottom: '1rem' }} />
                ) : (
                  <div style={{ width: '100%', height: '150px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>No Image</div>
                )}
                <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>{i.name}</h3>
                <p style={{ color: 'var(--primary-color)', fontWeight: 'bold', marginBottom: '0.5rem' }}>₹{i.price} <span style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>{i.unit ? `/ ${i.unit}` : ''}</span></p>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', flex: 1 }}>{i.description}</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Type: <span style={{textTransform: 'capitalize'}}>{i.type}</span></p>
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
