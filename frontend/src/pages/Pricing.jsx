import Layout from '../components/Layout';
import '../styles/pricing.css';

const Pricing = () => {
  return (
    <Layout>
      <div className="pricing-container pricing-page">
        <div className="pricing-container">
          <div className="pricing-card">
            <div className="plan-name">Student Lite</div>
            <div className="plan-price free">Free</div>
            <ul className="features">
              <li><span className="green-icon icon"></span>&nbsp; &nbsp; Access to Campus<span className="green-letter">C</span>onnect</li>
              <li><span class="green-icon icon"></span>&nbsp; &nbsp; Grade & Attendance Tracking</li>
              <li><span class="red-icon icon"></span>&nbsp; &nbsp; No Premium Profile Features</li>
              <li><span class="red-icon icon"></span>&nbsp; &nbsp; No Ad-Free Experience</li>
              <li><span class="red-icon icon"></span>&nbsp; &nbsp; No Club Profile</li>
            </ul>
            <button className="get-now"><span className="get-now-text">Get now</span></button>
          </div>
        
          <div className="pricing-card">
            <div className="plan-name">Student Core</div>
            <div className="plan-price"><span className="rupee">₹29</span><span className="mo">/mo.</span></div>
            <ul className="features">
              <li><span className="green-icon"></span>&nbsp; &nbsp;Access to Campus<span className="green-letter">C</span>onnect</li>
              <li><span className="green-icon"></span>&nbsp; &nbsp; Grade & Attendance Tracking</li>
              <li><span className="green-icon"></span>&nbsp; &nbsp; Premium Profile Features</li>
              <li><span className="green-icon"></span>&nbsp; &nbsp; Ad-Free Experience</li>
              <li><span className="red-icon"></span>&nbsp; &nbsp; No Club Profile</li>
            </ul>
            <button className="get-now"><span className="get-now-text">Get now</span></button>
          </div>
        
          <div className="pricing-card">
            <div className="plan-name">Student Collective</div>
            <div className="plan-price"><span className="rupee">₹99</span><span className="mo">/mo.</span></div>
            <ul className="features">
              <li><span className="green-icon"></span>&nbsp; &nbsp; Access to Campus<span className="green-letter">C</span>onnect</li>
              <li><span className="green-icon"></span>&nbsp; &nbsp; Grade & Attendance Tracking</li>
              <li><span className="green-icon"></span>&nbsp; &nbsp; Premium Profile Features</li>
              <li><span className="green-icon"></span>&nbsp; &nbsp; Ad-Free Experience</li>
              <li><span className="green-icon"></span>&nbsp; &nbsp; No Club Profile</li>
            </ul>
            <button className="get-now"><span className="get-now-text">Get now</span></button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Pricing;
