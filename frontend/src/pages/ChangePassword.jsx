import { useState } from 'react';
import { useNavigate } from 'react-router';
import api from '../api/axios';
import Plasma from '../components/Plasma';
import '../styles/changepassword.css';

const ChangePassword = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: '' });
  const [validations, setValidations] = useState({
    minLength: false,
    hasUpper: false,
    hasNumber: false,
    hasSpecial: false
  });

  const calculatePasswordStrength = (password) => {
    let score = 0;
    const validations = {
      minLength: password.length >= 8,
      hasUpper: /[A-Z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    setValidations(validations);

    if (validations.minLength) score++;
    if (validations.hasUpper) score++;
    if (validations.hasNumber) score++;
    if (validations.hasSpecial) score++;
    if (password.length >= 12) score++;

    let label = '';
    let strengthScore = 0;
    if (score === 0) {
      label = 'Very Weak';
      strengthScore = 0;
    } else if (score <= 2) {
      label = 'Weak';
      strengthScore = 1;
    } else if (score === 3) {
      label = 'Medium';
      strengthScore = 2;
    } else if (score === 4) {
      label = 'Strong';
      strengthScore = 3;
    } else {
      label = 'Very Strong';
      strengthScore = 4;
    }

    setPasswordStrength({ score: strengthScore, label });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    if (name === 'newPassword') {
      calculatePasswordStrength(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (formData.newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (!validations.hasUpper) {
      setError('Password must contain at least one uppercase letter');
      return;
    }

    if (!validations.hasNumber) {
      setError('Password must contain at least one number');
      return;
    }

    if (!validations.hasSpecial) {
      setError('Password must contain at least one special character');
      return;
    }

    try {
      const response = await api.post('/student/change-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });

      setMessage('Password changed successfully!');
      setTimeout(() => {
        navigate('/profile');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change password');
    }
  };

  const getStrengthColor = () => {
    const colors = ['#FF4444', '#FFA500', '#FFD700', '#48FF00', '#2B9900'];
    return colors[passwordStrength.score] || '#FF4444';
  };

  const getStrengthWidth = () => {
    return `${(passwordStrength.score + 1) * 20}%`;
  };

  return (
    <div className="outfit change-password-page">
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

        {(error || message) && (
          <div className={`notification ${message ? 'success' : 'error'}`}>
            {error || message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="change-password-form">
          <h2 className="form-title">Change Password</h2>

          <input
            type="password"
            name="currentPassword"
            placeholder="Current Password"
            value={formData.currentPassword}
            onChange={handleChange}
            required
            maxLength={300}
          />

          <input
            type="password"
            name="newPassword"
            placeholder="New Password"
            value={formData.newPassword}
            onChange={handleChange}
            required
            maxLength={300}
          />

          {formData.newPassword && (
            <div className="password-strength-indicator">
              <div className="strength-bar">
                <div
                  className="strength-bar-fill"
                  style={{
                    width: getStrengthWidth(),
                    backgroundColor: getStrengthColor()
                  }}
                ></div>
              </div>
              <span
                className="strength-label"
                style={{ color: getStrengthColor() }}
              >
                {passwordStrength.label}
              </span>
            </div>
          )}

          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm New Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            maxLength={300}
          />

          <div className="password-requirements">
            <div className={`requirement ${validations.minLength ? 'valid' : ''}`}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                {validations.minLength && <path d="M5 8L7 10L11 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />}
              </svg>
              <span>At least 8 characters</span>
            </div>
            <div className={`requirement ${validations.hasUpper ? 'valid' : ''}`}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                {validations.hasUpper && <path d="M5 8L7 10L11 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />}
              </svg>
              <span>One uppercase letter</span>
            </div>
            <div className={`requirement ${validations.hasNumber ? 'valid' : ''}`}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                {validations.hasNumber && <path d="M5 8L7 10L11 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />}
              </svg>
              <span>One number</span>
            </div>
            <div className={`requirement ${validations.hasSpecial ? 'valid' : ''}`}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                {validations.hasSpecial && <path d="M5 8L7 10L11 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />}
              </svg>
              <span>One special character</span>
            </div>
          </div>

          <button type="submit" className="submit-btn">
            <p>Change Password</p>
          </button>

          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="cancel-btn"
          >
            <p>Cancel</p>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
