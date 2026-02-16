import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router';
import api from '../api/axios';
import Layout from '../components/Layout';
import { fetchUserData } from '../store/slices/authSlice';

const LandingPage = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [institutes, setInstitutes] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
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

  const handleJoin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/institutes/join', joinData);
      if (res.data.token) {
          localStorage.setItem('token', res.data.token);
      }
      dispatch(fetchUserData());
      setShowJoin(false);
      alert("Join request sent! Please wait for approval.");
    } catch (error) {
      alert(error.response?.data?.message || "Error joining institute");
    }
  };

  if (user?.instituteId && user?.verificationStatus === 'pending') {
      return (
          <Layout>
              <div className="landing-container" style={{ color: 'white', textAlign: 'center', marginTop: '100px' }}>
                  <h1>Verification Pending</h1>
                  <p>You have requested to join an institute. Please wait for the administrator to approve your request.</p>
              </div>
          </Layout>
      )
  }

  return (
    <Layout>
      <div className="landing-container" style={{ padding: '40px', color: 'white' }}>
        <h1 className="outfit">Select Your Institute</h1>
        
        <div className="actions" style={{ marginTop: '20px', marginBottom: '40px' }}>
          <button onClick={() => setShowJoin(true)} style={{ marginRight: '20px', padding: '10px 20px' }}>Join Existing</button>
          <button onClick={() => setShowCreate(true)} style={{ padding: '10px 20px' }}>Create New Institute</button>
        </div>

        {showCreate && (
          <div className="modal">
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '400px' }}>
              <h2>Create Institute</h2>
              <input type="text" placeholder="Institute Name" required onChange={(e) => setFormData({...formData, name: e.target.value})} />
              <input type="text" placeholder="Unique Code" required onChange={(e) => setFormData({...formData, code: e.target.value})} />
              <input type="text" placeholder="Address" required onChange={(e) => setFormData({...formData, address: e.target.value})} />
              <button type="submit">Create</button>
              <button type="button" onClick={() => setShowCreate(false)}>Cancel</button>
            </form>
          </div>
        )}

        {showJoin && (
          <div className="modal">
             <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '400px', maxHeight: '80vh', overflowY: 'auto' }}>
              <h2>Join Institute</h2>
              <select required onChange={(e) => setJoinData({...joinData, instituteId: e.target.value})}>
                  <option value="">Select Institute</option>
                  {institutes.map(inst => (
                      <option key={inst._id} value={inst._id}>{inst.name} ({inst.code})</option>
                  ))}
              </select>
              <select required onChange={(e) => setJoinData({...joinData, role: e.target.value})}>
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
              </select>

              {joinData.role === 'student' && (
                  <>
                    <input 
                        type="text" 
                        placeholder="Roll Number" 
                        required 
                        onChange={(e) => setJoinData({...joinData, rollnumber: e.target.value})} 
                    />
                    <input 
                        type="text" 
                        placeholder="Section (e.g., A, B)" 
                        required 
                        onChange={(e) => setJoinData({...joinData, section: e.target.value})} 
                    />
                    <select required onChange={(e) => setJoinData({...joinData, branch: e.target.value})}>
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
                        onChange={(e) => setJoinData({...joinData, ug: e.target.value})} 
                    />
                  </>
              )}

              {joinData.role === 'faculty' && (
                  <>
                     <p style={{fontSize: '0.9em', color: '#888'}}>Additional faculty details can be updated after approval.</p>
                  </>
              )}

              <button type="submit">Join Connection</button>
              <button type="button" onClick={() => setShowJoin(false)}>Cancel</button>
            </form>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default LandingPage;
