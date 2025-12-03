import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useDispatch } from 'react-redux';
import { fetchUserData } from '../store/slices/authSlice';

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const processOAuth = async () => {
      const token = searchParams.get('token');
      const error = searchParams.get('error');

      if (error) {
        alert(`Authentication failed: ${error}`);
        navigate('/login');
        return;
      }

      if (token) {
        localStorage.setItem('token', token);
        await dispatch(fetchUserData());
        navigate('/dashboard');
      } else {
        navigate('/login');
      }
    };

    processOAuth();
  }, [searchParams, navigate, dispatch]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      background: '#090909',
      color: '#FFF',
      fontFamily: 'Outfit',
      fontSize: '20px'
    }}>
      <div>Processing authentication...</div>
    </div>
  );
};

export default OAuthCallback;
