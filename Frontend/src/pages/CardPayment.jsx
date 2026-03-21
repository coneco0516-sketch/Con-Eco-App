import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// CardPayment & UPIPayment are now unified under the Razorpay checkout popup.
// This component simply redirects to the Checkout page.
function CardPayment() {
  const navigate = useNavigate();
  useEffect(() => { navigate('/customer/checkout', { replace: true }); }, [navigate]);
  return null;
}

export default CardPayment;
