import { Link } from 'react-router';
import { useEffect } from 'react';
import Layout from '../components/Layout';
import '../styles/checkout.css';

const PaymentSuccess = () => {
  useEffect(() => {
    // Generate confetti
    const numConfetti = 50;
    const container = document.getElementById('confetti-container');
    if (container) {
      for (let i = 0; i < numConfetti; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti-piece';
        confetti.style.left = `${Math.random() * 100}vw`;
        confetti.style.backgroundColor = ['#2B9900', '#48ff00', '#ffffff', '#a5a5a5'][Math.floor(Math.random() * 4)];
        confetti.style.animationDelay = `${Math.random() * 2}s`;
        container.appendChild(confetti);
      }
    }
  }, []);

  return (
    <Layout>
      <div className="payment-result-page">
        <div id="confetti-container" className="confetti-container"></div>
        <div className="payment-result-container">
          <div className="payment-result-card">
            <div className="result-icon success">
              <span className="icon-symbol">✓</span>
            </div>
            
            <h1 className="result-title">Payment Successful!</h1>
            <p className="result-subtitle">
              Your subscription is now active. Welcome to the premium CampusConnect experience.
            </p>
            
            <div className="result-details">
              <div className="result-detail-row">
                <span className="label">Status</span>
                <span className="value success-text">Active</span>
              </div>
            </div>
            
            <Link to="/dashboard" className="result-btn">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PaymentSuccess;
