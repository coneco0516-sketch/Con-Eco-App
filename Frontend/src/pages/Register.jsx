import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';


const API = process.env.REACT_APP_API_URL || '';

function Register() {
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '', role: '',
    company: '', gst: '', address: '', vendorCity: '', vendorState: '',
    customerCity: '', customerState: ''
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleTogglePassword = () => {
    setShowPassword(true);
    setTimeout(() => setShowPassword(false), 5000);
  };

  const handleToggleConfirmPassword = () => {
    setShowConfirmPassword(true);
    setTimeout(() => setShowConfirmPassword(false), 5000);
  };

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

    // Phone validation (10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(formData.phone)) {
      setError("Phone number must be exactly 10 digits.");
      return;
    }

    // Email validation — strict: valid local part, domain, and TLD of 2-3 chars only
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,3}$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address (e.g. name@example.com).");
      return;
    }

    // Password validation (min 8 characters, uppercase, lowercase, number, special character)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      setError("Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character.");
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
      const resp = await fetch(`${API}/api/auth/register`, {
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

  const handleGoogleSuccess = async (credentialResponse) => {
    if (!formData.role) {
      setError("Please select an Account Role first before using Google Registration!");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);
    setError(null);

    const finalRole = formData.role.charAt(0).toUpperCase() + formData.role.slice(1);

    try {
      const response = await fetch(`${API}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          credential: credentialResponse.credential,
          role: finalRole
        }),
        credentials: 'include'
      });
      
      const data = await response.json();
      if (data.status === 'success') {
        localStorage.setItem('is_logged_in', 'true');
        localStorage.setItem('user_role', data.role);
        
        // Success redirect
        if (data.role === 'Admin') navigate('/admin-dashboard');
        else if (data.role === 'Vendor') navigate('/vendor-dashboard');
        else navigate('/catalogue');
        
        window.location.reload(); // Refresh to update navbar state
      } else {
        setError(data.message || "Google registration failed.");
      }
    } catch (err) {
      setError("A network error occurred during Google registration.");
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
          <div style={{ flex: 1, position: 'relative' }}>
            <label className="input-label">Password</label>
            <input type={showPassword ? "text" : "password"} name="password" onChange={handleChange} required className="input-field" style={{ paddingRight: '2.5rem' }} />
            <button type="button" onClick={handleTogglePassword} style={{ position: 'absolute', right: '10px', top: '38px', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.7, fontSize: '1.2rem', padding: 0 }}>
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          <div style={{ flex: 1, position: 'relative' }}>
            <label className="input-label">Confirm Password</label>
            <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" onChange={handleChange} required className="input-field" style={{ paddingRight: '2.5rem' }} />
            <button type="button" onClick={handleToggleConfirmPassword} style={{ position: 'absolute', right: '10px', top: '38px', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.7, fontSize: '1.2rem', padding: 0 }}>
              {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
            </button>
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

        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '10px' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--surface-border)' }}></div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>OR REGISTER WITH</div>
            <div style={{ flex: 1, height: '1px', background: 'var(--surface-border)' }}></div>
          </div>
          
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError("Google Registration Failed")}
            theme="filled_blue"
            shape="pill"
            text="continue_with"
          />
          
          {formData.role === 'vendor' && (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center', maxWidth: '80%' }}>
              Note: Vendors registering via Google can complete their business details (GST, Company Name) in their profile settings after login.
            </p>
          )}
        </div>
      </form>
      <p style={{ marginTop: '1.5rem', color: 'var(--text-secondary)' }}>Already have an account? <Link to="/login" style={{ color: 'var(--primary-color)' }}>Login here</Link></p>
    </div>
  );
}

export default Register;
