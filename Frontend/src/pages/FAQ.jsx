import React, { useState } from 'react';

function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqData = [
    {
      category: "General",
      question: "What is ConEco?",
      answer: "ConEco is a B2B marketplace platform connecting customers (builders, contractors, and project managers) with construction material vendors and service providers. We help eliminate middlemen, enabling direct bulk procurement."
    },
    {
      category: "General",
      question: "Are the vendors and materials verified?",
      answer: "Yes, all registered vendors and service providers undergo a manual verification process by our platform administrators. Admin teams review business documentation and assign Quality Control (QC) ratings to maintain a high standard of material sourcing."
    },
    {
      category: "Procurement & RFQ",
      question: "How does the Reverse Auction (RFQ) work?",
      answer: "As a Customer, you can post a Request for Quote (RFQ) specifying the raw material or service, required quantity, location, and date. Nearby verified vendors registered under that category will view your request on their RFQ Board and submit competitive bulk prices. You can review all incoming bids and accept the best quote to automatically create an order."
    },
    {
      category: "Procurement & RFQ",
      question: "Can I manage multiple construction sites?",
      answer: "Yes, customers can create separate Project Site profiles. Each site can have its own budget. When you order materials or book services, you can tag them to a specific site, and the platform will automatically track spending against the site's budget."
    },
    {
      category: "Billing & Settlement",
      question: "What are the payment options?",
      answer: "Currently, our platform supports Cash on Delivery (COD) and Credit Account (PayLater) options. For PayLater accounts, admins set credit limits per customer, allowing flexible B2B billing cycles."
    },
    {
      category: "Vendors & Partners",
      question: "How do I start listing my products?",
      answer: "Simply register a new account choosing the 'Vendor' role. Complete your profile details (GST, category, location, and company details). Once our QC admin team verifies your business, your catalogue items will automatically become active and visible to local customers."
    }
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '4rem auto', padding: '0 1.5rem 6rem' }}>
      <h2 style={{ fontSize: '3rem', color: 'var(--text-highlight)', marginBottom: '1rem', textAlign: 'center', fontWeight: '800' }}>
        Frequently Asked Questions
      </h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '3.5rem', textAlign: 'center', fontSize: '1.2rem' }}>
        Learn how ConEco simplifies bulk B2B procurement and local supply chain logistics.
      </p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {faqData.map((item, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div 
              key={idx} 
              className="glass-panel" 
              style={{ 
                borderRadius: '12px', 
                overflow: 'hidden', 
                border: isOpen ? '1px solid var(--primary-color)' : '1px solid var(--surface-border)',
                transition: 'all 0.3s ease' 
              }}
            >
              <div 
                onClick={() => toggleFAQ(idx)}
                style={{ 
                  padding: '1.5rem', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  cursor: 'pointer',
                  background: isOpen ? 'rgba(46, 160, 67, 0.03)' : 'transparent'
                }}
              >
                <div>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    background: 'rgba(255,255,255,0.05)', 
                    color: 'var(--text-secondary)', 
                    padding: '2px 8px', 
                    borderRadius: '4px',
                    marginRight: '10px',
                    textTransform: 'uppercase',
                    fontWeight: 'bold',
                    letterSpacing: '0.5px'
                  }}>
                    {item.category}
                  </span>
                  <h3 style={{ 
                    color: isOpen ? 'var(--text-highlight)' : 'var(--text-primary)', 
                    margin: '8px 0 0 0', 
                    fontSize: '1.15rem',
                    fontWeight: '600'
                  }}>
                    {item.question}
                  </h3>
                </div>
                <span style={{ 
                  fontSize: '1.2rem', 
                  color: isOpen ? 'var(--primary-color)' : 'var(--text-secondary)',
                  transition: 'transform 0.3s ease',
                  transform: isOpen ? 'rotate(180deg)' : 'rotate(0)'
                }}>
                  ▼
                </span>
              </div>
              
              <div style={{ 
                maxHeight: isOpen ? '500px' : '0', 
                overflow: 'hidden',
                transition: 'all 0.3s cubic-bezier(0,1,0.5,1)'
              }}>
                <div style={{ 
                  padding: '0 1.5rem 1.5rem 1.5rem', 
                  color: 'var(--text-secondary)', 
                  lineHeight: '1.6',
                  fontSize: '0.95rem',
                  borderTop: '1px solid var(--surface-border)',
                  paddingTop: '1rem'
                }}>
                  {item.answer}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default FAQ;
