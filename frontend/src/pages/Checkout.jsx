import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import api from '../api/axios';
import Layout from '../components/Layout';
import '../styles/checkout.css';

const PLANS = {
  student_core: {
    name: 'Student Core',
    price: 29,
    features: [
      'Access to CampusConnect',
      'Grade & Attendance Tracking',
      'Premium Profile Features',
      'Ad-Free Experience'
    ]
  },
  student_collective: {
    name: 'Student Collective',
    price: 99,
    features: [
      'Access to CampusConnect',
      'Grade & Attendance Tracking',
      'Premium Profile Features',
      'Ad-Free Experience',
      'Club Profile Access'
    ]
  }
};

const Checkout = () => {
  const { planId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const plan = PLANS[planId];

  useEffect(() => {
    if (!plan) {
      navigate('/pricing');
    }
  }, [plan, navigate]);

  const initPayment = () => {
    if (!window.Razorpay) {
      setError("Razorpay SDK failed to load. Are you online?");
      return null;
    }
    return window.Razorpay;
  };

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError('');

      // Create Order on server
      const { data } = await api.post('/payment/create-order', { planId });

      if (!data.success) {
        throw new Error(data.message || 'Failed to create order');
      }

      const RazorpayOptions = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'CampusConnect',
        description: `${data.planName} Subscription`,
        order_id: data.orderId,
        handler: async function (response) {
          try {
            // Verify payment
            const verifyData = await api.post('/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyData.data.success) {
              navigate('/payment/success');
            } else {
              navigate('/payment/failed');
            }
          } catch (err) {
            console.error("Payment verification failed:", err);
            navigate('/payment/failed');
          }
        },
        prefill: {
          name: 'Student Name',
          email: 'student@example.com',
          contact: '9999999999'
        },
        theme: {
          color: '#2B9900'
        }
      };

      const rzp = new window.Razorpay(RazorpayOptions);
      rzp.on('payment.failed', function (response){
        console.error("Payment failed:", response.error);
        navigate('/payment/failed');
      });

      rzp.open();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Payment initiation failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!plan) return null;

  return (
    <Layout>
      <div className="checkout-page">
        <div className="checkout-container">
          <div className="checkout-card">
            <div className="checkout-card-header">
              <h2>Subscribe to</h2>
              <h1>{plan.name}</h1>
            </div>
            
            <div className="checkout-divider"></div>
            
            <div className="checkout-details">
              <div className="checkout-row">
                <span className="label">Plan Details</span>
                <span className="value">Monthly Subscription</span>
              </div>
              
              <ul className="checkout-features">
                {plan.features.map((feature, idx) => (
                  <li key={idx}>
                    <span className="feat-icon green">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              
              <div className="checkout-total-divider"></div>
              
              <div className="checkout-total">
                <span>Total</span>
                <span className="total-amount">₹{plan.price}</span>
              </div>
            </div>

            {error && <div style={{ color: '#ff4c4c', marginBottom: '15px', fontFamily: 'Poppins, sans-serif' }}>{error}</div>}
            
            <button 
              className="checkout-pay-btn" 
              onClick={handlePayment} 
              disabled={loading}
            >
              {loading ? (
                <div className="checkout-spinner"></div>
              ) : (
                <>
                  <span className="btn-icon">⚡</span>
                  Pay Now
                </>
              )}
            </button>
            
            <div className="checkout-secure">
              <span className="lock-icon">🔒</span>
              Secure payment via Razorpay
            </div>
          </div>
          
          <Link to="/pricing" className="checkout-back-link">
            ← Back to Pricing
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default Checkout;
