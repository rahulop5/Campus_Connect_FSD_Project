import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '../context/AuthContext';

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

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
        await refreshUser();
        navigate('/dashboard');
      } else {
        navigate('/login');
      }
    };

    processOAuth();
  }, [searchParams, navigate, refreshUser]);

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
