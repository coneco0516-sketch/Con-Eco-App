import React from 'react';

function About() {
  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '0 2rem' }}>
      <h2 style={{ fontSize: '2.5rem', color: 'white', borderBottom: '1px solid var(--surface-border)', paddingBottom: '1rem' }}>About Us</h2>
      <p style={{ color: 'var(--text-secondary)' }}>Learn more about our mission, vision, and values</p>
      
      <section className="glass-panel" style={{ padding: '2rem', marginTop: '2rem', textAlign: 'center' }}>
        <h3 style={{ color: 'var(--primary-color)', marginTop: 0 }}>Project Overview through:</h3>
        {/* Using exact local absolute path as specified in original HTML, though browsers may block it for security */}
        <video style={{ width: '100%', borderRadius: '8px', marginTop: '1rem', border: '1px solid var(--surface-border)' }} controls>
          <source src="C:\Users\demas\Desktop\8th Sem\Internship\Vrishank Soft\Internship Project\Social Media Marketing\Screen Recording 2026-03-16 221146.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </section>

      <section className="glass-panel" style={{ padding: '2rem', marginTop: '2rem' }}>
        <h3 style={{ color: 'var(--primary-color)', marginTop: 0 }}>Meet Our Team</h3>
        <div style={{ display: 'flex', gap: '2rem', marginTop: '1.5rem' }}>
          <div style={{ flex: 1, textAlign: 'center', background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '8px' }}>
             <img src="/team_member_1.jpg" alt="Team Member 1" style={{ width:'100px', height:'100px', borderRadius:'50%', objectFit:'cover', marginBottom:'1rem' }} />
             <h4 style={{ color: 'white', margin: 0 }}>John Doe</h4>
             <p style={{ color: 'var(--text-secondary)', margin: '5px 0 0' }}>Project Manager</p>
          </div>
          <div style={{ flex: 1, textAlign: 'center', background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '8px' }}>
             <img src="/team_member_2.jpg" alt="Team Member 2" style={{ width:'100px', height:'100px', borderRadius:'50%', objectFit:'cover', marginBottom:'1rem' }} />
             <h4 style={{ color: 'white', margin: 0 }}>Jane Smith</h4>
             <p style={{ color: 'var(--text-secondary)', margin: '5px 0 0' }}>Lead Developer</p>
          </div>
        </div>
      </section>

      <section className="glass-panel" style={{ padding: '2rem', marginTop: '2rem', lineHeight: '1.8' }}>
         <h3 style={{ color: 'var(--primary-color)', marginTop: 0 }}>Our Mission</h3>
         <p>At ConEco, our mission is to revolutionize the construction industry by providing a unified ecommerce platform that connects customers with trusted vendors and service providers. We aim to simplify the procurement process, ensuring that our users have access to high-quality materials and services for their construction projects.</p>
         <p>We are committed to fostering a reliable and efficient marketplace that promotes transparency, quality, and customer satisfaction. Our goal is to empower our users to make informed decisions and achieve their construction goals with ease.</p>
         <p>Through innovation and dedication, we strive to be the leading platform in the construction industry, connecting people and businesses to create a better future for all.</p>
      </section>
    </div>
  );
}

export default About;
