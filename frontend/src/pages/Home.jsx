import { useState } from 'react';
import { Link } from 'react-router';
import Header from '../components/Header';
import '../styles/Home.css';

const Home = () => {
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = [
    { title: "Attendance", subtitle: "Tracking Portal", img: "/assets/attendancedemo.png" },
    { title: "Q&A", subtitle: "Forum", img: "/assets/qandademo.png" },
    { title: "Bell Graph", subtitle: "Prediction System", img: "/assets/attendancedemo.png" }, // Placeholder img
    { title: "Blogging", subtitle: "Platform", img: "/assets/attendancedemo.png" } // Placeholder img
  ];

  return (
    <div className="outfit home-page">
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
      <div className="features">
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
        {slides.map((slide, index) => (
          <div 
            key={index} 
            className={`d_attendance ${activeSlide === index ? 'active' : ''}`}
            style={{ display: activeSlide === index ? 'flex' : 'none' }}
          >
            <div>
              <p>{slide.title}</p>
              <p>{slide.subtitle.split(' ').map((word, i) => <span key={i}>{word}<br/></span>)}</p>
            </div>
            <div>
              <img src={slide.img} alt={slide.title} />
            </div>
          </div>
        ))}

        <div className="scroller">
          {slides.map((_, index) => (
            <button 
              key={index} 
              className="btn" 
              id={activeSlide === index ? 'btnselect' : ''}
              onClick={() => setActiveSlide(index)}
            ></button>
          ))}
        </div>
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
