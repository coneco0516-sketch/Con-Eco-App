import React from 'react';

function Terms() {
  return (
    <div style={{ maxWidth: '800px', margin: '3rem auto', padding: '0 1rem' }}>
      <h2 style={{ fontSize: '2.5rem', color: 'white', marginBottom: '1rem', textAlign: 'center' }}>Terms of Service</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '3rem', textAlign: 'center', fontSize: '1.2rem' }}>Please read our terms carefully before using ConEco.</p>
      
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h3 style={{ color: 'white', marginBottom: '1rem' }}>Acceptance of Terms</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
          By accessing or using the ConEco platform, you confirm your acceptance of these Terms of Service. If you disagree with any part of these terms, you may not access the service.
        </p>
        
        <h3 style={{ color: 'white', marginBottom: '1rem' }}>Vendor Responsibilities</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
          Vendors must provide completely accurate and legal descriptions of the materials and services they are listing. Any deliberate misinformation entails immediate account verification revocation.
        </p>
        
        <h3 style={{ color: 'white', marginBottom: '1rem' }}>Refund & Cancellation Policy</h3>
        <div style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
          <p style={{ marginBottom: '1rem' }}><strong>100% Refund (Pre-Acceptance):</strong> Customers are eligible for a 100% refund for online payments if they cancel their order while the status is still "Pending" (i.e., before the vendor has accepted the order).</p>
          <p style={{ marginBottom: '1rem' }}><strong>Post-Acceptance Cancellations:</strong> Once an order is accepted by the vendor (status changes from "Pending"), direct cancellation is disabled. The customer must contact the vendor directly and request them to revert the order status back to "Pending" in order to process a cancellation and refund.</p>
          <p><strong>Cash on Delivery (COD):</strong> The same cancellation timeline rules apply to COD orders. While no online payment refund is necessary, the order can only be cancelled while in the "Pending" state.</p>
        </div>
        
        <h3 style={{ color: 'white', marginBottom: '1rem' }}>Delivery Charges Policy</h3>
        <div style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
          <p style={{ marginBottom: '1rem' }}>Delivery charges are not included in the order total displayed on the ConEco platform.</p>
          <p style={{ marginBottom: '1rem' }}>As delivery costs vary based on location, distance, and local transportation conditions, ConEco does not fix, control, or standardize delivery charges.</p>
          <p style={{ marginBottom: '1rem' }}>After placing an order, customers and vendors are required to communicate directly to finalize the delivery arrangements and applicable charges.</p>
          <p style={{ marginBottom: '1rem' }}>The delivery fee shall be paid separately by the customer, either directly to the delivery personnel or to the vendor, as mutually agreed between the customer and the vendor.</p>
          <p>ConEco shall not be held responsible or liable for any disputes, differences, or issues arising between the customer and the vendor regarding delivery charges, payment, or related arrangements.</p>
        </div>
        
        <h3 style={{ color: 'white', marginBottom: '1rem' }}>Limitation of Liability</h3>
        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          ConEco functions strictly as an intermediary facilitator platform and disclaims liability for any discrepancy regarding service quality or disputes between vendors and customers. We do however moderate conflicts appropriately.
        </p>
      </div>
    </div>
  );
}

export default Terms;
