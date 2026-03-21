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
import Navbar from './components/Navbar';
import Home from './pages/Home';
import CustomerDashboard from './pages/CustomerDashboard';
import Products from './pages/Products';
import Services from './pages/Services';
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
import './index.css';

function AppContent() {
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('is_logged_in'));

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('is_logged_in'));
  }, [location]);

  console.log("AppContent: isLoggedIn =", isLoggedIn);

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
          <Route path="/notifications" element={<NotificationSettings />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/vendors" element={<VendorVerification />} />
          <Route path="/admin/customers" element={<CustomerVerification />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/payments" element={<AdminPayments />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
          <Route path="/admin/profile" element={<AdminProfile />} />
          <Route path="/admin/settings" element={<PlatformSettings />} />
          
          {/* Customer Routes */}
          <Route path="/customer" element={<CustomerDashboard />} />
          <Route path="/customer/products" element={<Products />} />
          <Route path="/customer/services" element={<Services />} />
          <Route path="/customer/cart" element={<Cart />} />
          <Route path="/customer/checkout" element={<Checkout />} />
          <Route path="/customer/payment/card" element={<CardPayment />} />
          <Route path="/customer/payment/upi" element={<UPIPayment />} />
          <Route path="/customer/order-success" element={<OrderSuccess />} />
          <Route path="/customer/orders" element={<MyOrders />} />
          <Route path="/customer/booked-services" element={<MyBookedServices />} />
          <Route path="/customer/profile" element={<CustomerProfile />} />

          {/* Vendor Routes */}
          <Route path="/vendor" element={<VendorDashboard />} />
          <Route path="/vendor/catalogue" element={<Catalogue />} />
          <Route path="/vendor/orders" element={<VendorOrders />} />
          <Route path="/vendor/earnings" element={<Earnings />} />
          <Route path="/vendor/analytics" element={<VendorAnalytics />} />
          <Route path="/vendor/profile" element={<VendorProfile />} />

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
