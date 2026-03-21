import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// UPIPayment is now unified under the Razorpay checkout popup.
function UPIPayment() {
  const navigate = useNavigate();
  useEffect(() => { navigate('/customer/checkout', { replace: true }); }, [navigate]);
  return null;
}

export default UPIPayment;
