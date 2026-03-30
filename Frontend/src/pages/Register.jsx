import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Register() {
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '', role: '',
    company: '', gst: '', address: '', vendorCity: '', vendorState: '',
    customerCity: '', customerState: ''
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    if (!acceptedTerms) {
      setError("You must accept the Privacy Policy and Terms of Services to register.");
      return;
    }

    setLoading(true);

    let finalRole = formData.role.charAt(0).toUpperCase() + formData.role.slice(1);

    let bodyData = {
      full_name: formData.name,
      email: formData.email,
      phone_number: formData.phone,
      password: formData.password,
      role: finalRole,
      company_name: formData.role === 'vendor' ? formData.company : null,
      gst_number: formData.role === 'vendor' ? formData.gst : null,
      address: formData.role === 'vendor' ? formData.address : null,
      city: formData.role === 'vendor' ? formData.vendorCity : (formData.role === 'customer' ? formData.customerCity : null),
      state: formData.role === 'vendor' ? formData.vendorState : (formData.role === 'customer' ? formData.customerState : null),
    };

    try {
      const resp = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });
      const data = await resp.json();
      
      if (data.status === 'success') {
        // Store registration info for verification page
        localStorage.setItem('pending_email', formData.email);
        localStorage.setItem('pending_email_verification', 'true');
        navigate('/verify-email-sent', { state: { email: formData.email } });
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('A network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container glass-panel" style={{ maxWidth: '600px', margin: '2rem auto' }}>
      <h2 className="auth-title">Create Account</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Join ConEco to get started</p>
      
      {error && <p style={{ color: 'var(--danger-color)', marginBottom: '1rem', background: 'rgba(248,81,73,0.1)', padding:'0.5rem', borderRadius:'4px' }}>{error}</p>}
      
      <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', textAlign: 'left' }}>
        
        {/* COMMON FIELDS */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <label className="input-label">Full Name</label>
            <input type="text" name="name" onChange={handleChange} required className="input-field" />
          </div>
          <div style={{ flex: 1 }}>
            <label className="input-label">Phone No</label>
            <input type="tel" name="phone" onChange={handleChange} required className="input-field" />
          </div>
        </div>

        <div>
          <label className="input-label">Email Address</label>
          <input type="email" name="email" onChange={handleChange} required className="input-field" />
        </div>

        <div>
          <label className="input-label">Account Role</label>
          <select name="role" onChange={handleChange} required className="input-field" style={{ background: 'rgba(0,0,0,0.5)' }}>
            <option value="">Select a role</option>
            <option value="customer">Customer</option>
            <option value="vendor">Vendor</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {/* VENDOR SECTION */}
        {formData.role === 'vendor' && (
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--primary-color)' }}>Vendor Details</h3>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ flex: 1 }}><label className="input-label">Company Name</label><input type="text" name="company" onChange={handleChange} required className="input-field" /></div>
              <div style={{ flex: 1 }}><label className="input-label">GST Number</label><input type="text" name="gst" onChange={handleChange} required className="input-field" /></div>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label className="input-label">Address</label><input type="text" name="address" onChange={handleChange} required className="input-field" />
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}><label className="input-label">City</label><input type="text" name="vendorCity" onChange={handleChange} required className="input-field" /></div>
              <div style={{ flex: 1 }}><label className="input-label">State</label><input type="text" name="vendorState" onChange={handleChange} required className="input-field" /></div>
            </div>
          </div>
        )}

        {/* CUSTOMER SECTION */}
        {formData.role === 'customer' && (
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--primary-color)' }}>Customer Details</h3>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}><label className="input-label">City</label><input type="text" name="customerCity" onChange={handleChange} required className="input-field" /></div>
              <div style={{ flex: 1 }}><label className="input-label">State</label><input type="text" name="customerState" onChange={handleChange} required className="input-field" /></div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <label className="input-label">Password</label>
            <input type="password" name="password" onChange={handleChange} required className="input-field" />
          </div>
          <div style={{ flex: 1 }}>
            <label className="input-label">Confirm Password</label>
            <input type="password" name="confirmPassword" onChange={handleChange} required className="input-field" />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-start', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
          <input 
            type="checkbox" 
            id="acceptTerms" 
            checked={acceptedTerms} 
            onChange={(e) => setAcceptedTerms(e.target.checked)} 
            required 
            style={{ width: 'auto', marginTop: '0.3rem', cursor: 'pointer' }}
          />
          <label htmlFor="acceptTerms" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', cursor: 'pointer', lineHeight: '1.4' }}>
            I have read <Link to="/privacy" style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>Privacy Policy</Link> and <Link to="/terms" style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>Terms of Services</Link> and accept all the policies and Terms
          </label>
        </div>

        <button type="submit" className="btn" disabled={loading} style={{ marginTop: '0.5rem' }}>
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
      <p style={{ marginTop: '1.5rem', color: 'var(--text-secondary)' }}>Already have an account? <Link to="/login" style={{ color: 'var(--primary-color)' }}>Login here</Link></p>
    </div>
  );
}

export default Register;
