import React, { useState, useEffect } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'https://con-eco-app-w78g.onrender.com';

function AdminStaffManagement() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'Employee'
  });
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem('user_role');
    if (role !== 'Super Admin') {
      navigate('/admin/dashboard');
      return;
    }
    fetchStaff();
  }, [navigate]);

  const fetchStaff = async () => {
    try {
      const resp = await fetch(`${API}/api/admin/staff`, { credentials: 'include' });
      const data = await resp.json();
      if (data.status === 'success') {
        setStaff(data.staff);
      } else {
        setError(data.message || 'Failed to fetch staff');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const resp = await fetch(`${API}/api/admin/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include'
      });
      const data = await resp.json();
      if (data.status === 'success') {
        alert(data.message);
        setShowForm(false);
        setFormData({ name: '', email: '', phone: '', password: '', role: 'Employee' });
        fetchStaff();
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Network error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this staff member?")) return;
    try {
      const resp = await fetch(`${API}/api/admin/staff/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await resp.json();
      if (data.status === 'success') {
        alert(data.message);
        fetchStaff();
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Network error');
    }
  };

  return (
    <div className="dashboard-layout">
      <AdminSidebar />
      <main style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '2rem', color: 'var(--text-highlight)', margin: 0 }}>Staff Management</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Manage Super Admins, Admins, and Employees.</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="btn">
            {showForm ? 'Cancel' : 'Add New Staff'}
          </button>
        </div>

        <hr style={{ borderColor: 'var(--surface-border)', marginBottom: '1.5rem' }} />

        {showForm && (
          <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
            <h3 style={{ color: 'var(--text-highlight)', marginBottom: '1.5rem' }}>Create Staff Account</h3>
            <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
              <div>
                <label className="input-label">Full Name</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  required 
                />
              </div>
              <div>
                <label className="input-label">Email</label>
                <input 
                  type="email" 
                  className="input-field" 
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  required 
                />
              </div>
              <div>
                <label className="input-label">Phone</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  required 
                />
              </div>
              <div>
                <label className="input-label">Password</label>
                <input 
                  type="password" 
                  className="input-field" 
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  required 
                />
              </div>
              <div>
                <label className="input-label">Role</label>
                <select 
                  className="input-field" 
                  style={{ background: '#0d1117' }}
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                >
                  <option value="Admin">Admin (Management)</option>
                  <option value="Employee">Employee (Operations)</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button type="submit" className="btn" style={{ width: '100%', height: '45px' }}>Create Account</button>
              </div>
            </form>
          </div>
        )}

        {loading ? <p>Loading staff...</p> : (
          <div className="glass-panel" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--surface-border)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '1rem' }}>Name</th>
                  <th style={{ padding: '1rem' }}>Role</th>
                  <th style={{ padding: '1rem' }}>Email</th>
                  <th style={{ padding: '1rem' }}>Phone</th>
                  <th style={{ padding: '1rem' }}>Joined</th>
                  <th style={{ padding: '1rem' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {staff.map(member => (
                  <tr key={member.user_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '1rem' }}>{member.name}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        fontSize: '0.8rem',
                        background: member.role === 'Super Admin' ? 'rgba(210, 109, 14, 0.2)' : 
                                   member.role === 'Admin' ? 'rgba(35, 134, 54, 0.2)' : 'rgba(52, 152, 219, 0.2)',
                        color: member.role === 'Super Admin' ? '#d26d0e' : 
                               member.role === 'Admin' ? '#3fb950' : '#3498db'
                      }}>
                        {member.role}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>{member.email}</td>
                    <td style={{ padding: '1rem' }}>{member.phone}</td>
                    <td style={{ padding: '1rem' }}>{member.date}</td>
                    <td style={{ padding: '1rem' }}>
                      {member.role !== 'Super Admin' && (
                        <button onClick={() => handleDelete(member.user_id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                          Delete
                        </button>
                      )}
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

export default AdminStaffManagement;
