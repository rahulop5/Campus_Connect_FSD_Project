import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router';
import api from '../api/axios';
import '../styles/Register.css';

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
  const navigate = useNavigate();
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
    try {
      let url = '';
      if (formData.role === 'Student') url = '/auth/student/register';
      else if (formData.role === 'Professor') url = '/auth/professor/register';
      else if (formData.role === 'Admin') url = '/auth/admin/register';
      
      const response = await api.post(url, formData);
      
      // Registration returns JWT token
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        navigate('/dashboard');
        window.location.reload(); // Reload to trigger auth context
      } else {
        navigate('/login');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="outfit register-page">
      <div>
        <p className="logo">Campus<span>C</span>onnect</p>
        {error && <p style={{color: 'red', textAlign: 'center'}}>{error}</p>}
        {isOAuth && <p style={{color: '#2B9900', textAlign: 'center', marginTop: '10px'}}>Complete your registration</p>}
        
        <div style={{textAlign: 'center', marginTop: '20px', marginBottom: '10px'}}>
            <label style={{color: '#FFF', marginRight: '10px'}}>Register as:</label>
            <select name="role" value={formData.role} onChange={handleChange} style={{padding: '8px 15px', borderRadius: '5px', background: 'rgba(48, 48, 48, 0.55)', color: '#FFF', border: '1px solid #7A7A7A'}}>
              <option value="Student">Student</option>
              <option value="Professor">Professor</option>
              <option value="Admin">Admin</option>
            </select>
        </div>

        <form onSubmit={handleSubmit}>
            <input type="text" placeholder="Name" name="name" value={formData.name} onChange={handleChange} required readOnly={isOAuth} />
            <input type="email" placeholder="Email" name="email" value={formData.email} onChange={handleChange} required readOnly={isOAuth} />
            {!isOAuth && (
              <>
                <input type="password" placeholder="Password" name="password" value={formData.password} onChange={handleChange} required />
                <input type="password" placeholder="Confirm Password" name="confirm_password" value={formData.confirm_password} onChange={handleChange} required />
              </>
            )}
            
            {formData.role === 'Student' && (
                <>
                    <input type="text" placeholder="Roll Number" name="roll" value={formData.roll} onChange={handleChange} required />
                    <input type="text" placeholder="Section" name="section" value={formData.section} onChange={handleChange} required />
                </>
            )}
            
            <input type="tel" placeholder="Phone Number" name="phone" value={formData.phone} onChange={handleChange} required />
            
            <button type="submit"><p>Register</p></button>
        </form>
        
        {!isOAuth && (
          <div className="other">
              <p>Already have an account? <Link to="/login">Login</Link></p>
              <div className="orline">
                  <div></div>
                  <p>OR</p>
                  <div></div>
              </div>
              <a href="http://localhost:3000/api/auth/student/google" style={{textDecoration: 'none'}}>
                  <div className="google oauth">
                      <img src="/assets/googlelogo.png" alt="" />
                      <p>Continue with Google</p>
                  </div>
              </a>
              <a href="http://localhost:3000/api/auth/student/github" style={{textDecoration: 'none'}}>
                  <div className="github oauth" >
                      <img src="/assets/githublogo.png" alt="" />
                      <p>Continue with Github</p>
                  </div>
              </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;
