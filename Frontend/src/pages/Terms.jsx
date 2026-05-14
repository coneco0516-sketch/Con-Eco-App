import React from 'react';

function Terms() {
  return (
    <div style={{ maxWidth: '800px', margin: '3rem auto', padding: '0 1rem' }}>
      <h2 style={{ fontSize: '2.5rem', color: 'var(--text-highlight)', marginBottom: '1rem', textAlign: 'center', fontWeight: '800' }}>Terms and Conditions</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '3rem', textAlign: 'center', fontSize: '1.1rem', letterSpacing: '0.5px' }}>Last Updated: May 2026</p>
      
      <div className="glass-panel" style={{ padding: '3rem', border: '1px solid var(--surface-border)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
        <section style={{ marginBottom: '2.5rem' }}>
          <h3 style={{ color: 'var(--primary-color)', marginBottom: '1.2rem', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <span style={{ opacity: 0.5 }}>01.</span> About the Service
          </h3>
          <p style={{ color: 'var(--text-primary)', marginBottom: '1.5rem', lineHeight: '1.8', opacity: 0.9 }}>
            Con Eco (coneco.store) is an information-aggregator platform. We provide a digital marketplace for users to view daily market rates for construction materials provided by local dealers in Gokak and surrounding areas.
          </p>
        </section>
        
        <section style={{ marginBottom: '2.5rem' }}>
          <h3 style={{ color: 'var(--primary-color)', marginBottom: '1.2rem', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <span style={{ opacity: 0.5 }}>02.</span> No Guarantee on Pricing
          </h3>
          <p style={{ color: 'var(--text-primary)', marginBottom: '1.5rem', lineHeight: '1.8', opacity: 0.9 }}>
            Prices listed on Con Eco are provided by third-party dealers and are subject to change without notice due to market volatility. Con Eco does not guarantee the accuracy of any price at the time of purchase. The final price is determined solely between the buyer and the dealer.
          </p>
        </section>
        
        <section style={{ marginBottom: '2.5rem' }}>
          <h3 style={{ color: 'var(--primary-color)', marginBottom: '1.2rem', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <span style={{ opacity: 0.5 }}>03.</span> Limitation of Liability
          </h3>
          <div style={{ color: 'var(--text-primary)', marginBottom: '1.5rem', lineHeight: '1.8', opacity: 0.9 }}>
            <p style={{ marginBottom: '1.2rem' }}>Con Eco is not a seller, manufacturer, or distributor of construction materials. We are not responsible for:</p>
            <ul style={{ paddingLeft: '1.2rem', listStyleType: 'none' }}>
              <li style={{ marginBottom: '0.8rem', position: 'relative', paddingLeft: '1.5rem' }}>
                <span style={{ position: 'absolute', left: 0, color: 'var(--primary-color)' }}>•</span> Discrepancies in material quality or quantity.
              </li>
              <li style={{ marginBottom: '0.8rem', position: 'relative', paddingLeft: '1.5rem' }}>
                <span style={{ position: 'absolute', left: 0, color: 'var(--primary-color)' }}>•</span> Delays in delivery or supply-chain issues.
              </li>
              <li style={{ marginBottom: '0.8rem', position: 'relative', paddingLeft: '1.5rem' }}>
                <span style={{ position: 'absolute', left: 0, color: 'var(--primary-color)' }}>•</span> Financial losses resulting from price fluctuations.
              </li>
            </ul>
          </div>
        </section>
        
        <section style={{ marginBottom: '2.5rem' }}>
          <h3 style={{ color: 'var(--primary-color)', marginBottom: '1.2rem', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <span style={{ opacity: 0.5 }}>04.</span> User Conduct
          </h3>
          <p style={{ color: 'var(--text-primary)', marginBottom: '1.5rem', lineHeight: '1.8', opacity: 0.9 }}>
            Users agree to use the "Request Quote" feature for legitimate business inquiries only. Misuse of the platform or providing false information may lead to a permanent ban.
          </p>
        </section>
        
        <section>
          <h3 style={{ color: 'var(--primary-color)', marginBottom: '1.2rem', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <span style={{ opacity: 0.5 }}>05.</span> Governing Law
          </h3>
          <p style={{ color: 'var(--text-primary)', lineHeight: '1.8', opacity: 0.9 }}>
            These terms are governed by the laws of India, and any disputes shall be subject to the exclusive jurisdiction of the courts in Belagavi, Karnataka.
          </p>
        </section>
      </div>
    </div>
  );
}

export default Terms;


