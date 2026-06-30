import React, { useState } from 'react';

function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredFaq = faqData.filter(item => 
    item.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '800px', margin: '4rem auto', padding: '0 1.5rem 6rem' }}>
      
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '3rem', color: 'var(--text-highlight)', marginBottom: '1rem', fontWeight: '800' }}>
          Frequently Asked Questions
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', margin: 0 }}>
          Learn how ConEco simplifies bulk B2B procurement and local supply chain logistics.
        </p>
      </div>

      {/* Search Input */}
      <div style={{ marginBottom: '2.5rem', position: 'relative' }}>
        <input 
          type="text" 
          placeholder="🔍 Search FAQ topics..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-field"
          style={{
            width: '100%',
            padding: '1rem 1.5rem',
            borderRadius: '12px',
            background: 'var(--input-bg)',
            border: '1px solid var(--surface-border)',
            color: 'var(--text-highlight)',
            fontSize: '1.05rem',
            boxSizing: 'border-box'
          }}
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            style={{
              position: 'absolute',
              right: '15px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Clear
          </button>
        )}
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
        {filteredFaq.length > 0 ? (
          filteredFaq.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div 
                key={idx} 
                className="glass-panel" 
                style={{ 
                  borderRadius: '16px', 
                  overflow: 'hidden', 
                  border: isOpen ? '1px solid var(--primary-color)' : '1px solid var(--surface-border)',
                  boxShadow: isOpen ? '0 12px 30px rgba(46, 160, 67, 0.15)' : 'none',
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
                    background: isOpen ? 'rgba(46, 160, 67, 0.04)' : 'transparent',
                    userSelect: 'none'
                  }}
                >
                  <div style={{ paddingRight: '1rem' }}>
                    <span style={{ 
                      fontSize: '0.7rem', 
                      background: 'rgba(255,255,255,0.05)', 
                      color: 'var(--text-secondary)', 
                      padding: '3px 8px', 
                      borderRadius: '4px',
                      textTransform: 'uppercase',
                      fontWeight: '800',
                      letterSpacing: '0.8px',
                      border: '1px solid var(--surface-border)'
                    }}>
                      {item.category}
                    </span>
                    <h3 style={{ 
                      color: isOpen ? 'var(--text-highlight)' : 'var(--text-primary)', 
                      margin: '10px 0 0 0', 
                      fontSize: '1.15rem',
                      fontWeight: '700'
                    }}>
                      {item.question}
                    </h3>
                  </div>
                  <span style={{ 
                    fontSize: '1rem', 
                    color: isOpen ? 'var(--primary-color)' : 'var(--text-secondary)',
                    transition: 'transform 0.3s ease',
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0)'
                  }}>
                    ▼
                  </span>
                </div>
                
                <div style={{ 
                  maxHeight: isOpen ? '400px' : '0', 
                  opacity: isOpen ? 1 : 0,
                  overflow: 'hidden',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                }}>
                  <div style={{ 
                    padding: '0 1.5rem 1.5rem 1.5rem', 
                    color: 'var(--text-secondary)', 
                    lineHeight: '1.7',
                    fontSize: '0.95rem',
                    borderTop: '1px solid var(--surface-border)',
                    paddingTop: '1.2rem'
                  }}>
                    {item.answer}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center', borderRadius: '16px' }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🔍</span>
            <h3 style={{ color: 'var(--text-highlight)', margin: '0 0 0.5rem 0' }}>No Match Found</h3>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Try looking for keywords like 'QC', 'GST', 'COD', or 'RFQ'.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default FAQ;
