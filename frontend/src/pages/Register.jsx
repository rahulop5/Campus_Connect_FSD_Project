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
    role: 'Student',
    roll: '',
    section: '',
    phone: '',
    confirm_password: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
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

  const handleNextPage = (e) => {
    e.preventDefault();
    
    // Validate page 1 fields
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
    
    setError('');
    setCurrentPage(2);
  };

  const handlePrevPage = () => {
    setError('');
    setCurrentPage(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let url = '';
      if (formData.role === 'Student') url = '/auth/student/register';
      else if (formData.role === 'Professor') url = '/auth/professor/register';
      else if (formData.role === 'Admin') url = '/auth/admin/register';
      
      const response = await api.post(url, formData);
      
      // Registration returns JWT token
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        await dispatch(fetchUserData()); // Fetch user data into Redux
        navigate('/dashboard');
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
        
        <div className="role-selector">
          <p className="role-selector__label">Register as</p>
          <div className="role-selector__buttons">
            <button
              type="button"
              className={`role-btn ${formData.role === 'Student' ? 'active' : ''}`}
              onClick={() => currentPage === 1 && setFormData({...formData, role: 'Student'})}
              aria-pressed={formData.role === 'Student'}
              disabled={currentPage === 2}
              style={{ cursor: currentPage === 2 ? 'not-allowed' : 'pointer', opacity: currentPage === 2 ? 0.6 : 1 }}
            >
              <img src="/assets/user_student.png" alt="Student" />
              <span>Student</span>
            </button>
            <button
              type="button"
              className={`role-btn ${formData.role === 'Professor' ? 'active' : ''}`}
              onClick={() => currentPage === 1 && setFormData({...formData, role: 'Professor'})}
              aria-pressed={formData.role === 'Professor'}
              disabled={currentPage === 2}
              style={{ cursor: currentPage === 2 ? 'not-allowed' : 'pointer', opacity: currentPage === 2 ? 0.6 : 1 }}
            >
              <img src="/assets/user_faculty.png" alt="Faculty" />
              <span>Faculty</span>
            </button>
            <button
              type="button"
              className={`role-btn ${formData.role === 'Admin' ? 'active' : ''}`}
              onClick={() => currentPage === 1 && setFormData({...formData, role: 'Admin'})}
              aria-pressed={formData.role === 'Admin'}
              disabled={currentPage === 2}
              style={{ cursor: currentPage === 2 ? 'not-allowed' : 'pointer', opacity: currentPage === 2 ? 0.6 : 1 }}
            >
              <img src="/assets/user_admin.png" alt="Admin" />
              <span>Admin</span>
            </button>
          </div>
        </div>

        <form onSubmit={currentPage === 1 ? handleNextPage : handleSubmit} className='register_form'>
            {currentPage === 1 && (
              <>
                <input type="text" placeholder="Name" name="name" value={formData.name} onChange={handleChange} required readOnly={isOAuth} maxLength={300} />
                <input type="email" placeholder="Email" name="email" value={formData.email} onChange={handleChange} required readOnly={isOAuth} maxLength={300} />
                {!isOAuth && (
                  <>
                    <input type="password" placeholder="Password" name="password" value={formData.password} onChange={handleChange} required minLength={6} maxLength={300} />
                    <input type="password" placeholder="Confirm Password" name="confirm_password" value={formData.confirm_password} onChange={handleChange} required minLength={6} maxLength={300} />
                  </>
                )}
                <button type="submit"><p>Next</p></button>
              </>
            )}
            
            {currentPage === 2 && (
              <>
                {formData.role === 'Student' && (
                  <>
                    <input type="text" placeholder="Roll Number" name="roll" value={formData.roll} onChange={handleChange} required maxLength={300} />
                    <input type="text" placeholder="Section" name="section" value={formData.section} onChange={handleChange} required maxLength={300} />
                  </>
                )}
                
                <input type="tel" placeholder="Phone Number" name="phone" value={formData.phone} onChange={handleChange} required pattern="[0-9]{10}" title="10 digit mobile number" maxLength={300} />
                
                <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                  <button type="button" onClick={handlePrevPage} style={{ flex: 1 }}><p>Back</p></button>
                  <button type="submit" style={{ flex: 1 }}><p>Register</p></button>
                </div>
              </>
            )}
        </form>
        
        <div className="other">
            <p>Already have an account? <Link to="/login">Login</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;
