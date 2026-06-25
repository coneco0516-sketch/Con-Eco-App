import React from 'react';

function About() {
  return (
    <div style={{ maxWidth: '800px', margin: 'var(--container-margin, 2rem auto)', padding: 'var(--container-padding, 0 2rem)' }}>
      <h2 style={{ fontSize: '2.5rem', color: 'var(--text-highlight)', borderBottom: '1px solid var(--surface-border)', paddingBottom: '1rem' }}>About Us</h2>
      <p style={{ color: 'var(--text-secondary)' }}>Learn more about our mission, vision, and values</p>

      <section className="glass-panel" style={{ padding: '2rem', marginTop: '2rem', textAlign: 'center' }}>
        <h3 style={{ color: 'var(--primary-color)', marginTop: 0 }}>Project Overview</h3>
        <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', marginTop: '1rem', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--surface-border)' }}>
          <video style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} controls>
            <source src="/project_overview.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </section>

      <section className="glass-panel" style={{ padding: 'clamp(1.5rem, 5vw, 2.5rem)', marginTop: '2rem' }}>
        <h3 style={{ color: 'var(--primary-color)', marginTop: 0, textAlign: 'center', fontSize: '1.5rem' }}>Meet Our Team</h3>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          marginTop: '2rem'
        }}>
          {/* Card 1: Hriday Demashetti */}
          <a href="/portfolio/index.html" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '380px' }}>
            <div className="glass-panel" style={{ 
              textAlign: 'center', 
              padding: '2.5rem 2rem', 
              flex: 1,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.03)',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden'
            }} onMouseEnter={(e) => { 
              e.currentTarget.style.transform = 'translateY(-8px)'; 
              e.currentTarget.style.borderColor = 'var(--primary-color)';
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(46, 160, 67, 0.2)';
            }} onMouseLeave={(e) => { 
              e.currentTarget.style.transform = 'translateY(0)'; 
              e.currentTarget.style.borderColor = 'var(--surface-border)';
              e.currentTarget.style.boxShadow = 'none';
            }}>
              <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                <img src="/Project_Head.jpg" alt="Project Head" style={{ width: '130px', height: '130px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary-color)', padding: '4px', background: 'var(--bg-color)' }} />
              </div>
              <h4 style={{ color: 'var(--text-highlight)', margin: '0 0 0.5rem', fontSize: '1.2rem', fontWeight: '700' }}>Hriday Demashetti</h4>
              <p style={{ color: 'var(--primary-color)', fontWeight: '700', margin: '0 0 1rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Project Head</p>
              <div style={{ width: '40px', height: '2px', background: 'var(--surface-border)', marginBottom: '1rem' }}></div>
              <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem', lineHeight: '1.5' }}>2AG22CV006<br/>Civil Engineering Student</p>
            </div>
          </a>
        </div>
      </section>

      <section className="glass-panel" style={{ padding: 'clamp(1.5rem, 5vw, 2.5rem)', marginTop: '2rem' }}>
        <h3 style={{ color: 'var(--primary-color)', marginTop: 0, textAlign: 'center', fontSize: '1.5rem' }}>Official Recognition</h3>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
          <div className="glass-panel" style={{ 
            maxWidth: '500px',
            padding: '2.5rem 2rem',
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--surface-border)',
            borderRadius: '24px',
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'default'
          }} onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-8px)';
            e.currentTarget.style.borderColor = 'var(--primary-color)';
            e.currentTarget.style.boxShadow = '0 20px 40px rgba(46, 160, 67, 0.12)';
          }} onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'var(--surface-border)';
            e.currentTarget.style.boxShadow = 'none';
          }}>
            {/* Decorative Background Element */}
            <div style={{
              position: 'absolute',
              top: '-20%',
              right: '-10%',
              width: '150px',
              height: '150px',
              background: 'radial-gradient(circle, rgba(46, 160, 67, 0.1) 0%, transparent 70%)',
              zIndex: 0
            }}></div>

            <div style={{ 
              width: '90px', 
              height: '90px', 
              margin: '0 auto 2rem', 
              background: 'linear-gradient(135deg, #1a365d, #2b6cb0)', 
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.5rem',
              color: 'white',
              boxShadow: '0 8px 25px rgba(26, 54, 93, 0.3)',
              position: 'relative',
              zIndex: 1
            }}>
              ⚖️
            </div>

            <h4 style={{ color: 'var(--text-highlight)', margin: '0 0 0.5rem', fontSize: '1.6rem', fontWeight: '800', position: 'relative', zIndex: 1 }}>Udyam MSME Registered</h4>
            <p style={{ 
              color: 'var(--primary-color)', 
              fontWeight: '700', 
              margin: '0 0 1.5rem', 
              fontSize: '1rem', 
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              position: 'relative',
              zIndex: 1 
            }}>
              UDYAM-KR-04-0184504
            </p>

            <div style={{ width: '50px', height: '3px', background: 'var(--primary-color)', margin: '1.5rem auto', borderRadius: '2px', position: 'relative', zIndex: 1 }}></div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: '1.7', margin: '0 0 2rem', position: 'relative', zIndex: 1 }}>
              Official recognition by the <strong>Ministry of Micro, Small and Medium Enterprises</strong>, Government of India. 
              Proudly operating as a registered <strong>Micro Enterprise</strong> specializing in the wholesale trade of high-quality construction materials.
            </p>

            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1.2rem', 
              background: 'rgba(46, 160, 67, 0.08)', 
              color: 'var(--primary-color)', 
              borderRadius: '12px', 
              fontSize: '0.85rem', 
              fontWeight: '800',
              border: '1px solid rgba(46, 160, 67, 0.2)',
              position: 'relative',
              zIndex: 1
            }}>
              <span style={{ fontSize: '1.2rem' }}>✓</span>
              GOVERNMENT CERTIFIED
            </div>
          </div>
        </div>
      </section>

      <section className="glass-panel" style={{ padding: '2rem', marginTop: '2rem', lineHeight: '1.8' }}>
        <h3 style={{ color: 'var(--primary-color)', marginTop: 0 }}>Our Mission</h3>
        <p style={{ color: 'var(--text-primary)' }}>At ConEco, our mission is to revolutionize the construction industry by providing a unified ecommerce platform that connects customers with trusted vendors and service providers. We aim to simplify the procurement process, ensuring that our users have access to high-quality materials and services for their construction projects.</p>
        <p style={{ color: 'var(--text-primary)' }}>We are committed to fostering a reliable and efficient marketplace that promotes transparency, quality, and customer satisfaction. Our goal is to empower our users to make informed decisions and achieve their construction goals with ease.</p>
        <p style={{ color: 'var(--text-primary)' }}>Through innovation and dedication, we strive to be the leading platform in the construction industry, connecting people and businesses to create a better future for all.</p>
      </section>
    </div>
  );
}

export default About;
