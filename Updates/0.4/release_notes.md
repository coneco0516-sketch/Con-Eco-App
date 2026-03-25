# Con-Eco Update v0.4 Release Notes

### 🚀 Payment Gateway Integration (Razorpay)

1. **Test Mode Configuration**:
   - Added Razorpay Key ID (`rzp_test_SVLS05Nmtx6XI1`) and Secret to both local `.env` and Railway production environment.
   - Backend now correctly initializes the `razorpay.Client` for order creation and verification.
2. **Frontend Deployment**:
   - Built the latest version of the React frontend using Vite.
   - All payment flows (Card, UPI) are now connected to the live backend on Railway.
3. **Redeploy Triggered**: 
   - Environment variables updated successfully via Railway CLI.
   - Ready for testing at: [https://con-eco-app-production.up.railway.app](https://con-eco-app-production.up.railway.app)