import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router';
import api from '../api/axios';
import Plasma from '../components/Plasma';
import { fetchUserData } from '../store/slices/authSlice';
import '../styles/landing.css';
import '../styles/Register.css';

const LandingPage = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [institutes, setInstitutes] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [joinStep, setJoinStep] = useState(1);
  const [formData, setFormData] = useState({ name: '', code: '', address: '' });
  const [joinData, setJoinData] = useState({ instituteId: '', role: 'student' });

  useEffect(() => {
    if (user?.instituteId) {
      if (user.verificationStatus === 'verified') {
        navigate('/dashboard');
      }
      // If pending, stay here or show "Pending" message?
    }
    fetchInstitutes();
  }, [user, navigate]);

  const fetchInstitutes = async () => {
    try {
      const res = await api.get('/institutes');
      setInstitutes(res.data);
    } catch (error) {
      console.error("Error fetching institutes:", error);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/institutes/create', formData);
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
      }
      dispatch(fetchUserData()); // Refresh user to get new role/instituteId
      setShowCreate(false);
    } catch (error) {
      alert(error.response?.data?.message || "Error creating institute");
    }
  };

  const handleJoinNext = (e) => {
    e.preventDefault();
    if (!joinData.instituteId) {
      alert('Please select an institute');
      return;
    }
    setJoinStep(2);
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/institutes/join', joinData);
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
      }
      dispatch(fetchUserData());
      setShowJoin(false);
      setJoinStep(1);
      alert("Join request sent! Please wait for approval.");
    } catch (error) {
      alert(error.response?.data?.message || "Error joining institute");
    }
  };

  const handleJoinBack = () => {
    setJoinStep(1);
  };

  const handleJoinCancel = () => {
    setShowJoin(false);
    setJoinStep(1);
    setJoinData({ instituteId: '', role: 'student' });
  };

  if (user?.instituteId && user?.verificationStatus === 'pending') {
    return (
      <div className="outfit landing-page">
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
        <div className="landing-container">
          <p className="logo">Campus<span>C</span>onnect</p>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, textAlign: 'center', maxWidth: '500px', marginTop: '-60px' }}>
            <h1 style={{ fontSize: '28px', marginBottom: '20px' }}>Verification Pending</h1>
            <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#DDD' }}>You have requested to join an institute. Please wait for the administrator to approve your request.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="outfit landing-page">
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

      <div className="landing-container">
        <p className="logo">Campus<span>C</span>onnect</p>
        <h1 className="outfit" style={{ marginTop: '20px' }}>Select Your Institute</h1>

        <div className="role-selector" style={{ marginTop: '18px' }}>
          <p className="role-selector__label">Choose an action</p>
          <div className="role-selector__buttons">
            <button
              className={`role-btn ${showJoin ? 'active' : ''}`}
              onClick={() => { setShowJoin((s) => !s); setShowCreate(false); }}
            >
              Join Existing
            </button>
            <button
              className={`role-btn ${showCreate ? 'active' : ''}`}
              onClick={() => { setShowCreate((s) => !s); setShowJoin(false); }}
            >
              Create New Institute
            </button>
          </div>
        </div>

        {showCreate && (
          <div className="modal">
            <form onSubmit={handleCreate} className="register_form">
              <input type="text" placeholder="Institute Name" required onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              <input type="text" placeholder="Unique Code" required onChange={(e) => setFormData({ ...formData, code: e.target.value })} />
              <input type="text" placeholder="Address" required onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
              <div className="button-group">
                <button type="button" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit">Create</button>
              </div>
            </form>
          </div>
        )}

        {showJoin && joinStep === 1 && (
          <div className="modal">
            <form onSubmit={handleJoinNext} className="register_form">
              <select required value={joinData.instituteId} onChange={(e) => setJoinData({ ...joinData, instituteId: e.target.value })}>
                <option value="">Select Institute</option>
                {institutes.map(inst => (
                  <option key={inst._id} value={inst._id}>{inst.name} ({inst.code})</option>
                ))}
              </select>
              <select required value={joinData.role} onChange={(e) => setJoinData({ ...joinData, role: e.target.value })}>
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
              </select>

              <div className="button-group">
                <button type="button" onClick={handleJoinCancel}>Cancel</button>
                <button type="submit">Next</button>
              </div>
            </form>
          </div>
        )}

        {showJoin && joinStep === 2 && (
          <div className="modal">
            <form onSubmit={handleJoin} className="register_form">
              {joinData.role === 'student' && (
                <>
                  <input
                    type="text"
                    placeholder="Roll Number"
                    required
                    onChange={(e) => setJoinData({ ...joinData, rollnumber: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Section (e.g., A, B)"
                    required
                    onChange={(e) => setJoinData({ ...joinData, section: e.target.value })}
                  />
                  <select required onChange={(e) => setJoinData({ ...joinData, branch: e.target.value })}>
                    <option value="">Select Branch</option>
                    <option value="CSE">CSE</option>
                    <option value="ECE">ECE</option>
                    <option value="AIDS">AIDS</option>
                    <option value="MECH">MECH</option>
                    <option value="CIVIL">CIVIL</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Year (e.g., 1, 2, 3, 4)"
                    required
                    onChange={(e) => setJoinData({ ...joinData, ug: e.target.value })}
                  />
                </>
              )}

              {joinData.role === 'faculty' && (
                <>
                  <p style={{ fontSize: '0.9em', color: '#DDD', marginTop: '10px' }}>Additional faculty details can be updated after approval.</p>
                </>
              )}

              <div className="button-group">
                <button type="button" onClick={handleJoinBack}>Back</button>
                <button type="submit">Join</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default LandingPage;
