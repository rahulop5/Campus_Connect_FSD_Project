import { Link } from 'react-router';
import Layout from '../components/Layout';
import '../styles/checkout.css';

const PaymentFailed = () => {
  return (
    <Layout>
      <div className="payment-result-page">
        <div className="payment-result-container">
          <div className="payment-result-card">
            <div className="result-icon failed">
              <span className="icon-symbol">✕</span>
            </div>
            
            <h1 className="result-title">Payment Failed</h1>
            <p className="result-subtitle">
              We couldn't process your payment. Your account has not been charged.
            </p>
            
            <Link to="/pricing" className="result-btn retry">
              Try Again
            </Link>
            
            <Link to="/dashboard" className="result-btn secondary">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PaymentFailed;
