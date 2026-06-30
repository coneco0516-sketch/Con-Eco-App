import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';

const API = import.meta.env.VITE_API_URL || 'https://api.coneco.store';

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
      setError("You must accept the Privacy Policy and Terms and Conditions to register.");
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

    // Remove any trailing slashes from API URL to prevent //api/... errors
    const baseApi = API.endsWith('/') ? API.slice(0, -1) : API;
    
    // Safety: If API URL matches current host, use relative path to prevent CORS confusion
    const fetchUrl = (baseApi && baseApi.includes(window.location.hostname)) 
      ? `/api/auth/google` 
      : `${baseApi}/api/auth/google`;

    console.log("Attempting Google Registration at:", fetchUrl);

    try {
      const response = await fetch(fetchUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          credential: credentialResponse.credential,
          role: finalRole
        }),
        credentials: 'include'
      });
      
      // Check if response is actually JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Non-JSON response from server:", text);
        throw new Error(`Server returned non-JSON response (${response.status})`);
      }

      const data = await response.json();
      if (data.status === 'success') {
        localStorage.setItem('is_logged_in', 'true');
        localStorage.setItem('user_role', data.role);
        
        // Success redirect matching App.jsx routes
        if (data.role === 'Admin') navigate('/admin');
        else if (data.role === 'Vendor') navigate('/vendor');
        else navigate('/customer');
        
        window.location.reload(); // Refresh to update navbar state
      } else {
        setError(data.message || "Google registration failed.");
      }
    } catch (err) {
      console.error("Google Auth Fetch Error:", err);
      setError(`Registration error: ${err.message || 'Check your internet connection'}`);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '0.8rem 1rem',
    borderRadius: '8px',
    background: 'var(--input-bg)',
    border: '1px solid var(--surface-border)',
    color: 'var(--text-highlight)',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    outline: 'none'
  };

  return (
    <div className="auth-container glass-panel" style={{ maxWidth: '640px', margin: '2rem auto', padding: '2.5rem' }}>
      <h2 className="auth-title" style={{ margin: '0 0 0.5rem 0', fontWeight: '800' }}>Create Account</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.8rem', fontSize: '0.95rem' }}>Join ConEco to digitize and scale your transactions</p>
      
      {error && (
        <div style={{ padding: '0.8rem 1rem', marginBottom: '1.5rem', borderRadius: '8px', background: 'rgba(248,81,73,0.12)', color: '#f85149', border: '1px solid rgba(248,81,73,0.25)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}
      
      <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', textAlign: 'left' }}>
        
        {/* COMMON FIELDS */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 240px' }}>
            <label className="input-label" style={{ fontWeight: '600', display: 'block', marginBottom: '0.4rem' }}>Full Name</label>
            <input type="text" name="name" onChange={handleChange} required style={inputStyle} />
          </div>
          <div style={{ flex: '1 1 240px' }}>
            <label className="input-label" style={{ fontWeight: '600', display: 'block', marginBottom: '0.4rem' }}>Phone Number</label>
            <input type="tel" name="phone" placeholder="10-digit mobile" onChange={handleChange} required style={inputStyle} />
          </div>
        </div>

        <div>
          <label className="input-label" style={{ fontWeight: '600', display: 'block', marginBottom: '0.4rem' }}>Email Address</label>
          <input type="email" name="email" placeholder="name@example.com" onChange={handleChange} required style={inputStyle} />
        </div>

        <div>
          <label className="input-label" style={{ fontWeight: '600', display: 'block', marginBottom: '0.4rem' }}>Account Role</label>
          <select name="role" onChange={handleChange} required style={{ ...inputStyle, cursor: 'pointer' }}>
            <option value="">Select account type</option>
            <option value="customer">Customer (Buy materials & hire contractors)</option>
            <option value="vendor">Vendor (Sell materials & list services)</option>
          </select>
        </div>

        {/* VENDOR SECTION */}
        {formData.role === 'vendor' && (
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--surface-border)', animation: 'fadeIn var(--transition-speed) ease-out' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1.2rem', color: 'var(--primary-color)', fontSize: '1.05rem', fontWeight: '700' }}>🏢 Vendor Details</h3>
            
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 200px' }}>
                <label className="input-label" style={{ fontWeight: '600', display: 'block', marginBottom: '0.4rem' }}>Company / Firm Name</label>
                <input type="text" name="company" onChange={handleChange} required style={inputStyle} />
              </div>
              <div style={{ flex: '1 1 200px' }}>
                <label className="input-label" style={{ fontWeight: '600', display: 'block', marginBottom: '0.4rem' }}>GST Number</label>
                <input type="text" name="gst" placeholder="15-character GSTIN" onChange={handleChange} required style={inputStyle} />
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <label className="input-label" style={{ fontWeight: '600', display: 'block', marginBottom: '0.4rem' }}>Business Address</label>
              <input type="text" name="address" onChange={handleChange} required style={inputStyle} />
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 200px' }}>
                <label className="input-label" style={{ fontWeight: '600', display: 'block', marginBottom: '0.4rem' }}>City</label>
                <input type="text" name="vendorCity" onChange={handleChange} required style={inputStyle} />
              </div>
              <div style={{ flex: '1 1 200px' }}>
                <label className="input-label" style={{ fontWeight: '600', display: 'block', marginBottom: '0.4rem' }}>State</label>
                <input type="text" name="vendorState" onChange={handleChange} required style={inputStyle} />
              </div>
            </div>
          </div>
        )}

        {/* CUSTOMER SECTION */}
        {formData.role === 'customer' && (
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--surface-border)', animation: 'fadeIn var(--transition-speed) ease-out' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1.2rem', color: 'var(--primary-color)', fontSize: '1.05rem', fontWeight: '700' }}>📍 Customer Location</h3>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 200px' }}>
                <label className="input-label" style={{ fontWeight: '600', display: 'block', marginBottom: '0.4rem' }}>City</label>
                <input type="text" name="customerCity" onChange={handleChange} required style={inputStyle} />
              </div>
              <div style={{ flex: '1 1 200px' }}>
                <label className="input-label" style={{ fontWeight: '600', display: 'block', marginBottom: '0.4rem' }}>State</label>
                <input type="text" name="customerState" onChange={handleChange} required style={inputStyle} />
              </div>
            </div>
          </div>
        )}

        {/* PASSWORDS */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 240px', position: 'relative' }}>
            <label className="input-label" style={{ fontWeight: '600', display: 'block', marginBottom: '0.4rem' }}>Password</label>
            <input type={showPassword ? "text" : "password"} name="password" onChange={handleChange} required style={{ ...inputStyle, paddingRight: '2.5rem' }} />
            <button type="button" onClick={handleTogglePassword} style={{ position: 'absolute', right: '12px', top: '35px', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.7, fontSize: '1.2rem', padding: 0 }}>
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          <div style={{ flex: '1 1 240px', position: 'relative' }}>
            <label className="input-label" style={{ fontWeight: '600', display: 'block', marginBottom: '0.4rem' }}>Confirm Password</label>
            <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" onChange={handleChange} required style={{ ...inputStyle, paddingRight: '2.5rem' }} />
            <button type="button" onClick={handleToggleConfirmPassword} style={{ position: 'absolute', right: '12px', top: '35px', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.7, fontSize: '1.2rem', padding: 0 }}>
              {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
        </div>

        {/* TERMS */}
        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-start', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
          <input 
            type="checkbox" 
            id="acceptTerms" 
            checked={acceptedTerms} 
            onChange={(e) => setAcceptedTerms(e.target.checked)} 
            required 
            style={{ width: 'auto', marginTop: '0.25rem', cursor: 'pointer' }}
          />
          <label htmlFor="acceptTerms" style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', cursor: 'pointer', lineHeight: '1.5' }}>
            I have read and agree to ConEco's <Link to="/privacy" target="_blank" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: '600' }}>Privacy Policy</Link> and <Link to="/terms" target="_blank" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: '600' }}>Terms & Conditions</Link>.
          </label>
        </div>

        <button 
          type="submit" 
          className="btn" 
          disabled={loading} 
          style={{ marginTop: '0.5rem', padding: '0.9rem', fontSize: '1rem', fontWeight: '800', width: '100%' }}
        >
          {loading ? 'Registering...' : 'Register'}
        </button>

        {/* SOCIAL REGISTER */}
        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '10px' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--surface-border)' }}></div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600' }}>OR REGISTER WITH</div>
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
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center', maxWidth: '85%', margin: 0, lineHeight: '1.4' }}>
              Note: Vendors registering via Google can complete their company name, GST, and business addresses inside their Profile Settings after activation.
            </p>
          )}
        </div>
      </form>
      
      <p style={{ marginTop: '2rem', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 0 }}>
        Already have an account? <Link to="/login" style={{ color: 'var(--primary-color)', fontWeight: '600', textDecoration: 'none' }}>Login here</Link>
      </p>
    </div>
  );
}

export default Register;
