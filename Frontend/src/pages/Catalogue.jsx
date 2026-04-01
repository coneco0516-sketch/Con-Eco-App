import React, { useState, useEffect } from 'react';
import VendorSidebar from '../components/VendorSidebar';

function Catalogue() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [newItem, setNewItem] = useState({ type: 'product', name: '', description: '', price: '', category: 'General', image_url: '', unit: '', brand: '', specifications: '', delivery_time: '' });
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

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

  const openAddModal = () => {
    setEditingItem(null);
    setNewItem({ type: 'product', name: '', description: '', price: '', category: 'General', image_url: '', unit: '', brand: '', specifications: '', delivery_time: '' });
    setImageFile(null);
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setNewItem({
      type: item.type,
      name: item.name,
      description: item.description || '',
      price: item.price,
      category: item.category || 'General',
      image_url: item.image_url || '',
      unit: item.unit || '',
      brand: item.brand || '',
      specifications: item.specifications || '',
      delivery_time: item.delivery_time || ''
    });
    setImageFile(null);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
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
    formData.append('category', newItem.category);
    formData.append('image_url', finalImageUrl || '');
    formData.append('unit', newItem.unit || '');
    formData.append('brand', newItem.brand || '');
    formData.append('specifications', newItem.specifications || '');
    formData.append('delivery_time', newItem.delivery_time || '');

    // If editing, add item_id and use PUT
    if (editingItem) {
      formData.append('item_id', editingItem.id);
    }

    try {
      const resp = await fetch('/api/vendor/catalogue', {
        method: editingItem ? 'PUT' : 'POST',
        body: formData,
        credentials: 'include'
      });
      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        alert("Error: " + (errData.detail || resp.statusText));
        return;
      }
      const data = await resp.json();
      if (data.status === 'success') {
        setShowModal(false);
        setEditingItem(null);
        setNewItem({ type: 'product', name: '', description: '', price: '', category: 'General', image_url: '', unit: '', brand: '', specifications: '', delivery_time: '' });
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

  const handleDelete = async (item) => {
    try {
      const resp = await fetch(`/api/vendor/catalogue?id=${item.id}&type=${item.type}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await resp.json();
      if (data.status === 'success') {
        setDeleteConfirm(null);
        fetchCatalogue();
      } else {
        alert("Error deleting item");
      }
    } catch {
      alert("Network error");
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
          <button className="btn" onClick={openAddModal} style={{ background: 'var(--primary-color)', height: 'fit-content' }}>+ Add New Item</button>
        </div>
        <hr style={{ borderColor: 'var(--surface-border)', marginBottom: '1.5rem' }} />
        
        {/* Add / Edit Modal */}
        {showModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', zIndex: 999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div className="glass-panel" style={{ width: '440px', maxWidth: '90vw', padding: '2rem', boxShadow: '0 0 20px rgba(0,0,0,0.5)', maxHeight: '90vh', overflowY: 'auto' }}>
              <h3 style={{ color: 'white', marginBottom: '1.5rem', marginTop: 0 }}>
                {editingItem ? '✏️ Edit Item' : '➕ Add New Item'}
              </h3>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div>
                  <label className="input-label">Item Type</label>
                  <select 
                    className="input-field" 
                    value={newItem.type} 
                    onChange={(e) => {
                      const newType = e.target.value;
                      setNewItem({
                        ...newItem, 
                        type: newType,
                        category: newType === 'product' ? 'Cement' : 'Labor'
                      });
                    }}
                    disabled={!!editingItem}
                    style={editingItem ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                  >
                    <option value="product">Product</option>
                    <option value="service">Service</option>
                  </select>
                  {editingItem && <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', margin: '4px 0 0' }}>Type cannot be changed after creation</p>}
                </div>
                <div>
                  <label className="input-label">Category</label>
                  <select 
                    className="input-field" 
                    value={newItem.category} 
                    onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                    required
                  >
                    {newItem.type === 'product' ? (
                      <>
                        <option value="General">General/Other</option>
                        <option value="Cement">Cement</option>
                        <option value="Steel">Steel & Rebars</option>
                        <option value="Bricks">Bricks & Blocks</option>
                        <option value="Sand">Sand & Aggregates</option>
                        <option value="Electrical">Electricals</option>
                        <option value="Plumbing">Plumbing</option>
                      </>
                    ) : (
                      <>
                        <option value="General">General/Other</option>
                        <option value="Labor">General Labor</option>
                        <option value="Plumbing">Plumbing Services</option>
                        <option value="Electrical">Electrical Work</option>
                        <option value="Architecture">Architecture & Design</option>
                      </>
                    )}
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
                {newItem.type === 'product' && (
                  <div>
                    <label className="input-label">Brand (Optional)</label>
                    <input type="text" placeholder="e.g. UltraTech, Tata" className="input-field" value={newItem.brand} onChange={(e) => setNewItem({...newItem, brand: e.target.value})} />
                  </div>
                )}
                <div>
                  <label className="input-label">Specifications / Features (Optional)</label>
                  <textarea placeholder="e.g. 50kg bag, ISI mark, highly durable..." className="input-field" value={newItem.specifications} onChange={(e) => setNewItem({...newItem, specifications: e.target.value})} />
                </div>
                <div>
                  <label className="input-label">Delivery Time / Availability (Optional)</label>
                  <input type="text" placeholder="e.g. 2-3 business days, Same Day" className="input-field" value={newItem.delivery_time} onChange={(e) => setNewItem({...newItem, delivery_time: e.target.value})} />
                </div>
                <div>
                  <label className="input-label">Image URL (Optional)</label>
                  <input type="text" placeholder="https://example.com/image.jpg" className="input-field" value={newItem.image_url} onChange={(e) => setNewItem({...newItem, image_url: e.target.value})} disabled={!!imageFile} />
                </div>
                <div>
                  <label className="input-label">Or Upload Photo</label>
                  <input type="file" accept="image/*" className="input-field" onChange={(e) => setImageFile(e.target.files[0])} style={{ padding: '0.4rem' }} />
                  {editingItem && newItem.image_url && !imageFile && (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', margin: '4px 0 0' }}>Current image will be kept unless you upload a new one</p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button type="submit" className="btn" style={{ flex: 1 }} disabled={uploading}>
                    {uploading ? 'Processing...' : editingItem ? 'Save Changes' : 'Add Item'}
                  </button>
                  <button type="button" className="btn danger" onClick={() => { setShowModal(false); setEditingItem(null); setImageFile(null); }} style={{ flex: 1 }}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', zIndex: 999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div className="glass-panel" style={{ width: '400px', padding: '2rem', textAlign: 'center' }}>
              <h3 style={{ color: 'white', marginTop: 0 }}>Delete Item?</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                Are you sure you want to delete <strong style={{ color: 'white' }}>"{deleteConfirm.name}"</strong>? This action cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn danger" onClick={() => handleDelete(deleteConfirm)} style={{ flex: 1 }}>Yes, Delete</button>
                <button className="btn" onClick={() => setDeleteConfirm(null)} style={{ flex: 1, background: 'transparent', border: '1px solid var(--surface-border)' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}
        
        {loading ? (
          <p>Loading catalogue...</p>
        ) : items.length > 0 ? (
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            {items.map(i => (
              <div key={`${i.type}-${i.id}`} className="glass-panel" style={{ padding: '1.5rem', flex: '1 1 280px', maxWidth: '350px', display: 'flex', flexDirection: 'column' }}>
                {i.image_url ? (
                  <img src={i.image_url} alt={i.name} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '4px', marginBottom: '1rem' }} />
                ) : (
                  <div style={{ width: '100%', height: '150px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>No Image</div>
                )}
                <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>{i.name}</h3>
                <p style={{ color: 'var(--primary-color)', fontWeight: 'bold', marginBottom: '0.5rem' }}>₹{i.price} <span style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>{i.unit ? `/ ${i.unit}` : ''}</span></p>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', flex: 1 }}>{i.description}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>Type: <span style={{textTransform: 'capitalize'}}>{i.type}</span></p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--primary-color)', margin: 0 }}>Category: {i.category}</p>
                </div>
                
                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    className="btn" 
                    onClick={() => openEditModal(i)} 
                    style={{ flex: 1, background: '#3498db', fontSize: '0.85rem', padding: '6px 12px' }}
                  >
                    ✏️ Edit
                  </button>
                  <button 
                    className="btn danger" 
                    onClick={() => setDeleteConfirm(i)} 
                    style={{ flex: 1, fontSize: '0.85rem', padding: '6px 12px' }}
                  >
                    🗑️ Delete
                  </button>
                </div>
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
