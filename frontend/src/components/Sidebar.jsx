import { Link } from 'react-router';
import '../styles/Sidebar.css';

const Sidebar = () => {
  return (
    <div className="sidebar">
      <ul>
        <li>
          <Link to="/forum/questions">
            <img src="/assets/question-and-answer 1.png" alt="" /> 
            <span className="text">Q&A<span>Forum</span></span>
          </Link>
        </li>
        <li>
          <Link to="/attendance">
            <img src="/assets/attendance 1.png" alt="" /> 
            <span className="text">Attendance<span>Tracking</span></span>
          </Link>
        </li>
        <li>
          <Link to="/bellgraph">
            <img src="/assets/wave-graph 1.png" alt="" /> 
            <span className="text">Grade<span>Prediction</span></span>
          </Link>
        </li>
        <li className="premium">
          <Link to="/pricing">
            <img src="/assets/premium.png" alt="" /> 
            <span className="text">Premium</span>
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
