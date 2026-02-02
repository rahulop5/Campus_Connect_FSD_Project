import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../store/slices/authSlice';
import { useNavigate, Link } from 'react-router';
import '../styles/Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Student');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { error: authError } = useSelector((state) => state.auth);
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    try {
      console.log(email)
      console.log(password)
      console.log(role)
      const resultAction = await dispatch(loginUser({ email, password, role }));
      if (loginUser.fulfilled.match(resultAction)) {
        navigate('/dashboard');
      } else {
        setLocalError(resultAction.payload || 'Login failed');
      }
    } catch (err) {
      setLocalError('Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="outfit login-page">
      <div>
        <p className="logo">Campus<span>C</span>onnect</p>
        {(localError || authError) && <p style={{color: 'red', textAlign: 'center'}}>{localError || authError}</p>}
        
        <div style={{textAlign: 'center', marginTop: '20px', marginBottom: '10px'}}>
            <label style={{color: '#FFF', marginRight: '10px'}}>Login as:</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} style={{padding: '8px 15px', borderRadius: '5px', background: 'rgba(48, 48, 48, 0.55)', color: '#FFF', border: '1px solid #7A7A7A'}}>
                <option value="Student">Student</option>
                <option value="Professor">Professor</option>
                <option value="Admin">Admin</option>
            </select>
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
            <button type="submit"><p>Login</p></button>
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
