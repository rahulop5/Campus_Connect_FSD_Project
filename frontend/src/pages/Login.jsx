import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../store/slices/authSlice';
import { useNavigate, Link } from 'react-router';
import Plasma from '../components/Plasma';
import '../styles/Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Student');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { error: authError } = useSelector((state) => state.auth);
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent multiple submissions
    
    setIsSubmitting(true);
    setLocalError('');
    try {
      console.log('Login attempt:', { email, role });
      const resultAction = await dispatch(loginUser({ email, password, role }));
      if (loginUser.fulfilled.match(resultAction)) {
        console.log('Login successful, navigating to dashboard');
        navigate('/dashboard');
      } else {
        console.error('Login failed:', resultAction.payload);
        setLocalError(resultAction.payload || 'Login failed');
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error('Login error:', err);
      setLocalError('Login failed. Please check your credentials.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="outfit login-page">
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
        {(localError || authError) && (
          <p style={{
            color: '#ff4444', 
            textAlign: 'center', 
            background: 'rgba(255, 68, 68, 0.1)',
            padding: '8px 16px',
            borderRadius: '8px',
            marginTop: '10px',
            fontSize: '14px'
          }}>
            {localError || authError}
          </p>
        )}
        
        <div className="role-selector">
          <p className="role-selector__label">Login as</p>
          <div className="role-selector__buttons">
            <button
              type="button"
              className={`role-btn ${role === 'Student' ? 'active' : ''}`}
              onClick={() => setRole('Student')}
              aria-pressed={role === 'Student'}
            >
              <img src="/assets/user_student.png" alt="Student" />
              <span>Student</span>
            </button>
            <button
              type="button"
              className={`role-btn ${role === 'Professor' ? 'active' : ''}`}
              onClick={() => setRole('Professor')}
              aria-pressed={role === 'Professor'}
            >
              <img src="/assets/user_faculty.png" alt="Faculty" />
              <span>Faculty</span>
            </button>
            <button
              type="button"
              className={`role-btn ${role === 'Admin' ? 'active' : ''}`}
              onClick={() => setRole('Admin')}
              aria-pressed={role === 'Admin'}
            >
              <img src="/assets/user_admin.png" alt="Admin" />
              <span>Admin</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className='login_form' >
            <input 
                type="email" 
                placeholder="Email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                maxLength={300}
            />
            <input 
                type="password" 
                placeholder="Password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                maxLength={300}
            />
            <button type="submit" disabled={isSubmitting}>
              <p>{isSubmitting ? 'Logging in...' : 'Login'}</p>
            </button>
        </form>
        <div className="other">
            <p>Not registered? <Link to="/register">Sign up</Link></p>
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
      </div>
    </div>
  );
};

export default Login;
