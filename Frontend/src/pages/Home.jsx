import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem('is_logged_in');
  const userRole = localStorage.getItem('user_role');

  useEffect(() => {
    if (isLoggedIn) {
      if (userRole === 'Admin') navigate('/admin/dashboard');
      else if (userRole === 'Vendor') navigate('/vendor');
      else if (userRole === 'Customer') navigate('/customer');
      else navigate('/login');
    }
  }, [isLoggedIn, userRole, navigate]);

  return (
    <div style={{ maxWidth: '1200px', margin: 'var(--container-margin, 0 auto)', padding: 'var(--container-padding, 2rem 1rem 6rem)' }}>
      
      {/* Hero Section */}
      <div style={{ textAlign: 'center', marginBottom: 'clamp(3rem, 10vw, 6rem)' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.8rem', marginBottom: '2rem', padding: '0.5rem 1.2rem', background: 'rgba(46, 160, 67, 0.1)', border: '1px solid rgba(46, 160, 67, 0.2)', borderRadius: '30px' }}>
          <span style={{ fontSize: '1.2rem' }}>🚀</span>
          <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--primary-color)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Next-Gen B2B Sourcing</span>
        </div>
        
        <h1 style={{ 
          fontSize: 'clamp(2.2rem, 7vw, 4.5rem)', 
          fontWeight: '800', 
          color: 'var(--text-highlight)', 
          lineHeight: '1.15',
          marginBottom: '1.5rem', 
          background: 'linear-gradient(135deg, var(--text-highlight) 30%, var(--primary-color) 100%)', 
          WebkitBackgroundClip: 'text', 
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-1px'
        }}>
          Direct Sourcing for Construction Materials & Services
        </h1>
        
        <p style={{ 
          fontSize: 'clamp(1rem, 2.5vw, 1.3rem)', 
          color: 'var(--text-secondary)', 
          maxWidth: '800px', 
          margin: '0 auto 3.5rem', 
          lineHeight: '1.6' 
        }}>
          ConEco bridges construction project managers and builders with regional manufacturers, aggregate vendors, and technical site service providers. Cut middleman margins entirely.
        </p>
        
        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/register" className="btn" style={{ fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', padding: '1rem 2.5rem', borderRadius: '8px', boxShadow: '0 8px 20px var(--accent-glow)' }}>
            Get Started Free
          </Link>
          <Link to="/login" className="btn" style={{ fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', padding: '1rem 2.5rem', borderRadius: '8px', background: 'transparent', border: '1px solid var(--surface-border)', color: 'var(--text-highlight)' }}>
            Log In
          </Link>
        </div>
      </div>

      {/* Feature Grid Section */}
      <div style={{ marginBottom: 'clamp(3rem, 10vw, 6rem)' }}>
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', color: 'var(--text-highlight)', marginBottom: '3rem' }}>
          Engineered for B2B Procurements
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
          
          <div className="glass-panel" style={{ padding: 'clamp(1.5rem, 5vw, 2.5rem)', borderRadius: '16px', border: '1px solid var(--surface-border)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔄</div>
            <h3 style={{ color: 'var(--text-highlight)', fontSize: '1.4rem', margin: '0 0 0.8rem 0' }}>Reverse Auction RFQ Engine</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0, fontSize: '0.95rem' }}>
              Create bulk requests for concrete, structural steel, aggregates, or custom services and get instant competitive bids from localized verified vendors.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: 'clamp(1.5rem, 5vw, 2.5rem)', borderRadius: '16px', border: '1px solid var(--surface-border)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏗️</div>
            <h3 style={{ color: 'var(--text-highlight)', fontSize: '1.4rem', margin: '0 0 0.8rem 0' }}>Location-Aware Sourcing</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0, fontSize: '0.95rem' }}>
              Orders are dynamically routed to nearby suppliers, reducing transit times and logistics overheads. Build project site profiles to automate tax matching.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: 'clamp(1.5rem, 5vw, 2.5rem)', borderRadius: '16px', border: '1px solid var(--surface-border)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛡️</div>
            <h3 style={{ color: 'var(--text-highlight)', fontSize: '1.4rem', margin: '0 0 0.8rem 0' }}>QC Verified Network</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0, fontSize: '0.95rem' }}>
              We enforce strict compliance controls. Every registered vendor goes through quality checks and physical address verification by platform admins.
            </p>
          </div>

        </div>
      </div>

      {/* How it Works Section */}
      <div className="glass-panel" style={{ padding: 'clamp(2rem, 8vw, 4rem) clamp(1.5rem, 6vw, 3rem)', borderRadius: '24px', textAlign: 'center', border: '1px solid var(--surface-border)' }}>
        <h2 style={{ color: 'var(--text-highlight)', fontSize: 'clamp(1.8rem, 5vw, 2.2rem)', marginBottom: '3rem' }}>How it works</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2.5rem' }}>
          <div>
            <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--primary-color)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold', margin: '0 auto 1.2rem' }}>1</div>
            <h4 style={{ color: 'var(--text-highlight)', margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>Create Account</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0, lineHeight: '1.5' }}>Register as a Customer (Builder/Architect) or Vendor (Supplier/Provider).</p>
          </div>

          <div>
            <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--primary-color)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold', margin: '0 auto 1.2rem' }}>2</div>
            <h4 style={{ color: 'var(--text-highlight)', margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>Submit Sourcing Request</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0, lineHeight: '1.5' }}>Browse list catalogues directly or create RFQs to get customized wholesale bids.</p>
          </div>

          <div>
            <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--primary-color)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold', margin: '0 auto 1.2rem' }}>3</div>
            <h4 style={{ color: 'var(--text-highlight)', margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>Fulfill & Settlement</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0, lineHeight: '1.5' }}>Approve pricing, choose secure Cash on Delivery (COD), and receive delivery at your project site.</p>
          </div>
        </div>
      </div>
      
    </div>
  );
}

export default Home;
