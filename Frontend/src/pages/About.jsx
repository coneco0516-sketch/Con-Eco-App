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

      <section className="glass-panel" style={{ padding: '2rem', marginTop: '2rem' }}>
        <h3 style={{ color: 'var(--primary-color)', marginTop: 0 }}>Meet Our Team</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '1.5rem', 
          marginTop: '1.5rem' 
        }}>
          <a href="/portfolio/index.html" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="glass-panel" style={{ 
              textAlign: 'center', 
              padding: '2rem', 
              height: '100%', 
              transition: 'transform 0.3s ease, border-color 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.03)'
            }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.borderColor = 'var(--primary-color)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--surface-border)'; }}>
              <img src="/Project_Head.jpg" alt="Project Head" style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', marginBottom: '1.5rem', border: '3px solid var(--primary-color)', padding: '3px' }} />
              <h4 style={{ color: 'var(--text-highlight)', margin: '0 0 0.5rem', fontSize: '1.1rem' }}>Hriday Demashetti</h4>
              <p style={{ color: 'var(--primary-color)', fontWeight: '600', margin: '0 0 1rem', fontSize: '0.9rem', textTransform: 'uppercase' }}>Project Head</p>
              <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.85rem' }}>2AG22CV006 - Civil Engineering Student</p>
            </div>
          </a>
          
          <div className="glass-panel" style={{ 
            textAlign: 'center', 
            padding: '2rem', 
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.03)'
          }}>
            <img src="/team_member_1.jpg" alt="Team Member 01" style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', marginBottom: '1.5rem', border: '3px solid var(--primary-color)', padding: '3px' }} />
            <h4 style={{ color: 'var(--text-highlight)', margin: '0 0 0.5rem', fontSize: '1.1rem' }}>Tulasi M Marennavar</h4>
            <p style={{ color: 'var(--primary-color)', fontWeight: '600', margin: '0 0 1rem', fontSize: '0.9rem', textTransform: 'uppercase' }}>Team Member 01</p>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.85rem' }}>2AG22CS145 - Computer Science Engineering Student</p>
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
