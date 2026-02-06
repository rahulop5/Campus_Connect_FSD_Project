import { Link } from 'react-router';
import { useEffect } from 'react';
import Header from '../components/Header';
import SplitText from '../components/SplitText';
import DarkVeil from '../components/DarkVeil';
import '../styles/Home.css';

const Home = () => {
  useEffect(() => {
    // Premium smooth scrolling with delay
    let scrollPosition = window.scrollY;
    let targetPosition = window.scrollY;
    let isScrolling = false;

    const smoothScroll = () => {
      const difference = targetPosition - scrollPosition;
      const delta = difference * 0.03; // Very slow easing for ultra-premium feel
      
      if (Math.abs(difference) > 0.5) {
        scrollPosition += delta;
        window.scrollTo(0, scrollPosition);
        requestAnimationFrame(smoothScroll);
      } else {
        scrollPosition = targetPosition;
        isScrolling = false;
      }
    };

    const handleWheel = (e) => {
      e.preventDefault();
      targetPosition += e.deltaY * 0.35; // Very heavy scroll feel
      targetPosition = Math.max(0, Math.min(targetPosition, document.documentElement.scrollHeight - window.innerHeight));
      
      if (!isScrolling) {
        isScrolling = true;
        requestAnimationFrame(smoothScroll);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      window.removeEventListener('wheel', handleWheel);
    };
  }, []);

  return (
    <div className="outfit" style={{ scrollBehavior: 'auto' }}>
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
        <SplitText 
          text="Features" 
          className="features-heading"
          delay={50}
          duration={1.2}
          ease="power3.out"
          from={{ opacity: 0, y: 100, rotateX: -90 }}
          to={{ opacity: 1, y: 0, rotateX: 0 }}
          threshold={0.2}
        />
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
        <div className="darkveil-container">
          <DarkVeil
            hueShift={120}
            noiseIntensity={0}
            scanlineIntensity={0}
            speed={1.5}
            scanlineFrequency={0}
            warpAmount={0}
          />
        </div>
        <div className="finalsignup-content">
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
