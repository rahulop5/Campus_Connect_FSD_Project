import { Link, useNavigate } from 'react-router';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import '../styles/Header.css';

const Header = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/');
    setTimeout(() => {
        dispatch(logout());
    }, 100);
  };

  return (
    <header>
      <Link to="/dashboard" style={{ textDecoration: 'none' }}>
        <p className="logo">Campus<span>C</span>onnect</p>
      </Link>
      {!user ? (
        <>
          <div className="separator">|</div>
          <Link to="/login" className="login-link"><p>Log in</p></Link>
          <Link to="/register" style={{ textDecoration: 'none' }}>
            <div id="signup"><p>Sign up</p></div>
          </Link>
        </>
      ) : (
        <>
          <Link to="/profile" className="profile">
            <img src="/assets/user(2) 1.png" alt="profile" />
          </Link>
          <button onClick={handleLogout} className="logout-btn">
            <p>Logout</p>
          </button>
        </>
      )}
    </header>
  );
};

export default Header;
