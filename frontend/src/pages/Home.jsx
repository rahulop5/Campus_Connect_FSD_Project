import { Link } from 'react-router';
import Header from '../components/Header';
import '../styles/Home.css';

const Home = () => {
  return (
    <div className="outfit">
      <Header />
      <div className="hero">
        <div>
          <p className="herologo">Campus <br /> Connect</p>
          <p className="herodesc">All your academics, insights, & campus <br /> updates—connected in one place.</p>
          <Link to="/register">
            <button>
              <p>Sign Up</p>
            </button>
          </Link>
        </div>
      </div>
      <hr className="herohr" />
      <div className="featuress">
        <p>Features</p>
        <div className="featurescontent">
          <div>
            <img src="/assets/qandaforum.png" alt="" />
            <p>Question & <br />Answer Forum</p>
            <p>More info...</p>
          </div>
          <div>
            <img src="/assets/attendance icon.png" alt="" />
            <p>Attendance <br />Tracking Portal</p>
            <p>More info...</p>
          </div>
          <div>
            <img src="/assets/bell graph icon.png" alt="" />
            <p>Bell Graph <br />Prediction <br />System</p>
            <p>More info...</p>
          </div>
          <div>
            <img src="/assets/blogging.png" alt="" />
            <p>Blogging <br />Platform</p>
            <p>More info...</p>
          </div>
        </div>
      </div>
      <hr className="herohr" />
      <div className="demos">
        <div className="d_attendance active">
          <div>
            <p>Attendance</p>
            <p>Tracking <br /> Portal</p>
          </div>
          <div>
            <img src="/assets/attendancedemo.png" alt="" />
          </div>
        </div>
        {/* Add other demo slides as needed */}
      </div>
      <hr className="herohr" />
      <div className="finalsignup">
        <div>
          <p>Ready to get started?</p>
          <p>Create your free account now</p>
          <Link to="/register" style={{ textDecoration: 'none' }}>
            <div>
              <p>Sign Up</p>
            </div>
          </Link>
        </div>
      </div>
      <footer>
        <p className="logo">Campus<span>C</span>onnect</p>
        <p>© All rights reserved</p>
      </footer>
    </div>
  );
};

export default Home;
