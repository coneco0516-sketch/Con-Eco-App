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

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('is_logged_in'));
  }, [location]);

  return (
    <div className="app-container">
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
