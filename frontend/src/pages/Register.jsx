import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router';
import api from '../api/axios';
import Plasma from '../components/Plasma';
import '../styles/Register.css';

import { useDispatch } from 'react-redux';
import { fetchUserData } from '../store/slices/authSlice';

const Register = () => {
  const [searchParams] = useSearchParams();
  const isOAuth = searchParams.get('oauth') === 'true';
  const oauthEmail = searchParams.get('email') || '';
  const oauthName = searchParams.get('name') || '';

  const [formData, setFormData] = useState({
    name: oauthName,
    email: oauthEmail,
    password: '',
    phone: '',
    confirm_password: ''
  });
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOAuth) {
      setFormData(prev => ({
        ...prev,
        name: oauthName,
        email: oauthEmail
      }));
    }
  }, [isOAuth, oauthEmail, oauthName]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
        setError('Please fill in all required fields');
        return;
    }
    
    if (!isOAuth) {
        if (!formData.password || !formData.confirm_password) {
        setError('Please fill in all required fields');
        return;
        }
        if (formData.password !== formData.confirm_password) {
        setError('Passwords do not match');
        return;
        }
        if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
        }
    }

    try {
      const response = await api.post('/auth/register', formData);
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        await dispatch(fetchUserData());
        navigate('/landing'); // Go to landing to join institute
      } else {
        navigate('/login');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="outfit register-page">
      <div className="plasma-background">
        <Plasma 
          color="#026100"
          speed={0.5}
          direction="forward"
          scale={1.1}
          opacity={0.6}
          mouseInteractive={true}
        />
      </div>
      <div>
        <p className="logo">Campus<span>C</span>onnect</p>
        {error && <p style={{color: 'red', textAlign: 'center'}}>{error}</p>}
        {isOAuth && <p style={{color: '#2B9900', textAlign: 'center', marginTop: '10px'}}>Complete your registration</p>}
        
        <form onSubmit={handleSubmit} className='register_form'>
            <input type="text" placeholder="Name" name="name" value={formData.name} onChange={handleChange} required readOnly={isOAuth} maxLength={300} />
            <input type="email" placeholder="Email" name="email" value={formData.email} onChange={handleChange} required readOnly={isOAuth} maxLength={300} />
            {!isOAuth && (
                <>
                <input type="password" placeholder="Password" name="password" value={formData.password} onChange={handleChange} required minLength={6} maxLength={300} />
                <input type="password" placeholder="Confirm Password" name="confirm_password" value={formData.confirm_password} onChange={handleChange} required minLength={6} maxLength={300} />
                </>
            )}
            <input type="tel" placeholder="Phone Number" name="phone" value={formData.phone} onChange={handleChange} required pattern="[0-9]{10}" title="10 digit mobile number" maxLength={300} />
            
            <button type="submit"><p>Register</p></button>
        </form>
        
        <div className="other">
            <p>Already have an account? <Link to="/login">Login</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;
