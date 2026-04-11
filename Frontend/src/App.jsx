import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import VendorVerification from './pages/VendorVerification';
import CustomerVerification from './pages/CustomerVerification';
import AdminOrders from './pages/AdminOrders';
import AdminPayments from './pages/AdminPayments';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminProfile from './pages/AdminProfile';
import AdminContactMessages from './pages/AdminContactMessages';
import AdminCommissions from './pages/AdminCommissions';
import PlatformSettings from './pages/PlatformSettings';
import Register from './pages/Register';
import About from './pages/About';
import Contact from './pages/Contact';
import FAQ from './pages/FAQ';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import ForgotPassword from './pages/ForgotPassword';
import VerifyEmail from './pages/VerifyEmail';
import VerifyEmailSent from './pages/VerifyEmailSent';
import NotificationSettings from './pages/NotificationSettings';
import ResetPassword from './pages/ResetPassword';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import CustomerDashboard from './pages/CustomerDashboard';
import Products from './pages/Products';
import Services from './pages/Services';
import CustomerItemDetail from './pages/CustomerItemDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import CardPayment from './pages/CardPayment';
import UPIPayment from './pages/UPIPayment';
import OrderSuccess from './pages/OrderSuccess';
import MyOrders from './pages/MyOrders';
import MyBookedServices from './pages/MyBookedServices';
import CustomerProfile from './pages/CustomerProfile';
import VendorDashboard from './pages/VendorDashboard';
import Catalogue from './pages/Catalogue';
import VendorOrders from './pages/VendorOrders';
import Earnings from './pages/Earnings';
import VendorAnalytics from './pages/VendorAnalytics';
import VendorProfile from './pages/VendorProfile';
import VendorBilling from './pages/VendorBilling';
import './index.css';

// Role-based route protection component
function ProtectedRoute({ children, allowedRoles }) {
  const isLoggedIn = localStorage.getItem('is_logged_in') === 'true';
  const userRole = localStorage.getItem('user_role');
  
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    console.log(`Protected: Role ${userRole} not in`, allowedRoles);
    // Redirect to correct dashboard based on actual role
    if (userRole === 'Admin') return <Navigate to="/admin" replace />;
    if (userRole === 'Vendor') return <Navigate to="/vendor" replace />;
    return <Navigate to="/customer" replace />;
  }
  return children;
}

function AppContent() {
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('is_logged_in'));
  const [showMaintenancePopup, setShowMaintenancePopup] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('is_logged_in'));
    checkMaintenance();
  }, [location]);

  useEffect(() => {
    if (isLoggedIn) {
      registerPushService();
    }
  }, [isLoggedIn]);

  const registerPushService = async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        // Register service worker if not already
        const registration = await navigator.serviceWorker.register('/sw.js');
        
        // Wait for registration to be active
        await navigator.serviceWorker.ready;

        // Check if push is enabled in platform settings
        const settingsResp = await fetch('/api/admin/platform_settings');
        const settingsData = await settingsResp.json();
        
        if (settingsData.status === 'success' && settingsData.settings.push_notifications) {
          // Check if permission is already granted or if we should ask
          if (Notification.permission === 'denied') {
            console.warn('Push Notifications are blocked by the user.');
            return;
          }

          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: 'BAKkidll6rsBZNL1dNfVigz42Ek26PhvKgMLJTj_aiRy6eH_rz' // SECURE VAPID KEY
          });

          await fetch('/api/auth/subscribe-push', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subscription }),
            credentials: 'include'
          });
          console.log('Push subscription synced with server');
        }
      } catch (err) {
        console.warn('Push registration flow skipped or failed:', err);
      }
    }
  };

  const checkMaintenance = async () => {
    try {
      const resp = await fetch('/api/auth/maintenance-mode');
      const data = await resp.json();
      console.log("Maintenance Status Response:", data);
      if (data.status === 'success') {
        const maintenanceActive = String(data.maintenance_active) === 'true';
        const userRole = localStorage.getItem('user_role');
        console.log("Maintenance Active:", maintenanceActive, "User Role:", userRole);
        
        // If maintenance is on, and user is NOT an Admin, show popup
        if (maintenanceActive && userRole !== 'Admin') {
          console.log("Showing Maintenance Popup...");
          setShowMaintenancePopup(true);
          // Block scrolling when maintenance is active
          document.body.style.overflow = 'hidden';
        } else {
          setShowMaintenancePopup(false);
          document.body.style.overflow = 'auto';
        }
      }
    } catch (err) {
      console.error("Maintenance check failed:", err);
    }
  };

  const handleMaintenanceOk = () => {
    // Redirect to a safe external site
    window.location.href = "https://www.google.com";
  };

  return (
    <div className="app-container">
      {showMaintenancePopup && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: '#0a0a0a', zIndex: 99999,
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          backdropFilter: 'blur(20px)',
          overflow: 'hidden'
        }}>
          <div className="glass-panel" style={{ 
            padding: '4rem', 
            textAlign: 'center', 
            maxWidth: '600px', 
            border: '1px solid #ef4444', 
            boxShadow: '0 0 60px rgba(239, 68, 68, 0.2)',
            animation: 'fadeIn 0.5s ease-out'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🛠️</div>
            <h2 style={{ color: '#ef4444', fontSize: '2.5rem', marginBottom: '1.5rem', fontWeight: 800 }}>
              System Maintenance
            </h2>
            <p style={{ color: 'white', fontSize: '1.3rem', marginBottom: '2.5rem', lineHeight: '1.8', opacity: 0.9 }}>
              ConEco Marketplace is currently undergoing scheduled maintenance to improve our services. We'll be back online shortly!
            </p>
            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', marginBottom: '2.5rem' }}>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Estimated Downtime: ~30 minutes
              </p>
            </div>
            <button 
              className="btn danger" 
              onClick={handleMaintenanceOk} 
              style={{ padding: '1.2rem 4.5rem', fontSize: '1.2rem', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', transition: 'transform 0.2s' }}
              onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              Close & Redirect
            </button>
          </div>
        </div>
      )}
      
      {/* Rest of the App only renders if not in maintenance (or as background blurred) */}
      <div style={{ filter: showMaintenancePopup ? 'blur(15px)' : 'none', pointerEvents: showMaintenancePopup ? 'none' : 'auto', transition: 'filter 0.3s ease' }}>
        <Navbar />
        <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/verify-email-sent" element={<VerifyEmailSent />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/notifications" element={<NotificationSettings />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['Admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['Admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/vendors" element={<ProtectedRoute allowedRoles={['Admin']}><VendorVerification /></ProtectedRoute>} />
          <Route path="/admin/customers" element={<ProtectedRoute allowedRoles={['Admin']}><CustomerVerification /></ProtectedRoute>} />
          <Route path="/admin/orders" element={<ProtectedRoute allowedRoles={['Admin']}><AdminOrders /></ProtectedRoute>} />
          <Route path="/admin/payments" element={<ProtectedRoute allowedRoles={['Admin']}><AdminPayments /></ProtectedRoute>} />
          <Route path="/admin/commissions" element={<ProtectedRoute allowedRoles={['Admin']}><AdminCommissions /></ProtectedRoute>} />
          <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={['Admin']}><AdminAnalytics /></ProtectedRoute>} />
          <Route path="/admin/profile" element={<ProtectedRoute allowedRoles={['Admin']}><AdminProfile /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['Admin']}><PlatformSettings /></ProtectedRoute>} />
          <Route path="/admin/contact-messages" element={<ProtectedRoute allowedRoles={['Admin']}><AdminContactMessages /></ProtectedRoute>} />
          
          {/* Customer Routes */}
          <Route path="/customer" element={<ProtectedRoute allowedRoles={['Customer']}><CustomerDashboard /></ProtectedRoute>} />
          <Route path="/customer/products" element={<ProtectedRoute allowedRoles={['Customer']}><Products /></ProtectedRoute>} />
          <Route path="/customer/services" element={<ProtectedRoute allowedRoles={['Customer']}><Services /></ProtectedRoute>} />
          <Route path="/customer/item/:type/:id" element={<ProtectedRoute allowedRoles={['Customer']}><CustomerItemDetail /></ProtectedRoute>} />
          <Route path="/customer/cart" element={<ProtectedRoute allowedRoles={['Customer']}><Cart /></ProtectedRoute>} />
          <Route path="/customer/checkout" element={<ProtectedRoute allowedRoles={['Customer']}><Checkout /></ProtectedRoute>} />
          <Route path="/customer/payment/card" element={<ProtectedRoute allowedRoles={['Customer']}><CardPayment /></ProtectedRoute>} />
          <Route path="/customer/payment/upi" element={<ProtectedRoute allowedRoles={['Customer']}><UPIPayment /></ProtectedRoute>} />
          <Route path="/customer/order-success" element={<ProtectedRoute allowedRoles={['Customer']}><OrderSuccess /></ProtectedRoute>} />
          <Route path="/customer/orders" element={<ProtectedRoute allowedRoles={['Customer']}><MyOrders /></ProtectedRoute>} />
          <Route path="/customer/booked-services" element={<ProtectedRoute allowedRoles={['Customer']}><MyBookedServices /></ProtectedRoute>} />
          <Route path="/customer/profile" element={<ProtectedRoute allowedRoles={['Customer']}><CustomerProfile /></ProtectedRoute>} />

          {/* Vendor Routes */}
          <Route path="/vendor" element={<ProtectedRoute allowedRoles={['Vendor']}><VendorDashboard /></ProtectedRoute>} />
          <Route path="/vendor/catalogue" element={<ProtectedRoute allowedRoles={['Vendor']}><Catalogue /></ProtectedRoute>} />
          <Route path="/vendor/orders" element={<ProtectedRoute allowedRoles={['Vendor']}><VendorOrders /></ProtectedRoute>} />
          <Route path="/vendor/earnings" element={<ProtectedRoute allowedRoles={['Vendor']}><Earnings /></ProtectedRoute>} />
          <Route path="/vendor/billing" element={<ProtectedRoute allowedRoles={['Vendor']}><VendorBilling /></ProtectedRoute>} />
          <Route path="/vendor/analytics" element={<ProtectedRoute allowedRoles={['Vendor']}><VendorAnalytics /></ProtectedRoute>} />
          <Route path="/vendor/profile" element={<ProtectedRoute allowedRoles={['Vendor']}><VendorProfile /></ProtectedRoute>} />

          {/* Catch all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      
      {!isLoggedIn && (
        <footer>
          <p style={{ color: 'var(--text-secondary)' }}>&copy; 2026 ConEco Marketplace Platform. All rights reserved.</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '0.5rem' }}>
            <Link to="/faq" style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>FAQ</Link>
            <Link to="/contact" style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>Contact</Link>
            <Link to="/privacy" style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>Privacy Policy</Link>
            <Link to="/terms" style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>Terms of Service</Link>
          </div>
        </footer>
      )}
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
