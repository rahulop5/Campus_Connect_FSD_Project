import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDashboardData } from '../store/slices/adminSlice';
import api from '../api/axios';
import Layout from '../components/Layout';
import '../styles/Admindashboard.css';

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { courses, professors, students, loading } = useSelector((state) => state.admin);
  const data = { courses, professors, students }; // Map redux state to local variable name used in render

  const [activeSection, setActiveSection] = useState('course'); // course, student, professor, allotment
  
  // Form States
  const [courseForm, setCourseForm] = useState({ name: '', professor: '', section: '', totalclasses: '', credits: '' });
  const [studentForm, setStudentForm] = useState({ name: '', email: '', rollnumber: '', phone: '', section: '', password: '' });
  const [profForm, setProfForm] = useState({ name: '', email: '', phone: '', password: '' });
  
  // Removal/Assignment States
  const [removeCourseId, setRemoveCourseId] = useState('');
  const [assignCourseData, setAssignCourseData] = useState({ course: '', professor: '', student: '' });
  const [isProfAssignment, setIsProfAssignment] = useState(true);
  
  const [removeProfData, setRemoveProfData] = useState({ professor: '', course_action: '', new_professor: '' });
  const [removeCourseFromData, setRemoveCourseFromData] = useState({ 
    course: '', professor: '', student: '', removeType: 'professor', unassign_action: '', new_professor: '' 
  });
  const [isProfRemoval, setIsProfRemoval] = useState(true);

  useEffect(() => {
    dispatch(fetchDashboardData());
  }, [dispatch]);

  // Helper to refresh data
  const refreshData = () => dispatch(fetchDashboardData());

  const handleAddCourse = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/course/add', courseForm);
      alert('Course added successfully');
      fetchDashboardData();
      setCourseForm({ name: '', professor: '', section: '', totalclasses: '', credits: '' });
    } catch (err) {
      alert(err.response?.data?.message || 'Error adding course');
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/student/add', studentForm);
      alert('Student added successfully');
      refreshData();
      setStudentForm({ name: '', email: '', rollnumber: '', phone: '', section: '', password: '' });
    } catch (err) {
      alert(err.response?.data?.message || 'Error adding student');
    }
  };

  const handleAddProfessor = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/professor/add', profForm);
      alert('Professor added successfully');
      refreshData();
      setProfForm({ name: '', email: '', phone: '', password: '' });
    } catch (err) {
      alert(err.response?.data?.message || 'Error adding professor');
    }
  };

  const handleRemoveCourse = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/remove/course', { course: removeCourseId, removeType: 'entire-course' });
      alert('Course removed successfully');
      refreshData();
      setRemoveCourseId('');
    } catch (err) {
      alert(err.response?.data?.message || 'Error removing course');
    }
  };

  const handleRemoveProfessor = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/remove/professor', removeProfData);
      alert('Professor removed successfully');
      refreshData();
      setRemoveProfData({ professor: '', course_action: '', new_professor: '' });
    } catch (err) {
      alert(err.response?.data?.message || 'Error removing professor');
    }
  };

  const handleAssignCourse = async (e) => {
    e.preventDefault();
    const endpoint = isProfAssignment ? '/admin/assign/course-professor' : '/admin/assign/course-student';
    try {
      await api.post(endpoint, assignCourseData);
      alert('Assignment successful');
      refreshData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error assigning course');
    }
  };

  const handleRemoveCourseFrom = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/remove/course', { ...removeCourseFromData, removeType: isProfRemoval ? 'professor' : 'student' });
      alert('Removal successful');
      refreshData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error removing course from user');
    }
  };

  // Election Management
  const [electionStatus, setElectionStatus] = useState(null);
  const [nominateEmail, setNominateEmail] = useState('');

  const fetchElectionStatus = async () => {
    try {
      const res = await api.get('/election');
      setElectionStatus(res.data.election);
    } catch (err) {
      console.error("Error fetching election status", err);
    }
  };

  useEffect(() => {
    fetchElectionStatus();
  }, []);

  const handleStartElection = async () => {
    if (!window.confirm("Are you sure you want to start a new election?")) return;
    try {
      await api.post('/election/start');
      alert("Election started!");
      fetchElectionStatus();
    } catch (err) {
      alert(err.response?.data?.message || "Error starting election");
    }
  };

  const handleStopElection = async () => {
    if (!window.confirm("Are you sure you want to stop the current election?")) return;
    try {
      await api.post('/election/stop');
      alert("Election stopped!");
      fetchElectionStatus();
    } catch (err) {
      alert(err.response?.data?.message || "Error stopping election");
    }
  };

  const handleNominate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/election/nominate', { email: nominateEmail });
      alert("Candidate nominated successfully!");
      setNominateEmail('');
      fetchElectionStatus();
    } catch (err) {
      alert(err.response?.data?.message || "Error nominating candidate");
    }
  };

  if (loading) return <Layout>Loading...</Layout>;

  return (
    <Layout>
      <div className="admin-dashboard admin-dashboard-page">
        <div id="top_row">
          <div id="dash_welcm_admn_div">
            <div className="green_gradient" id="dashboard_div">Dashboard</div>
            <div id="welcm_nd_admn_div">
              <div className="green_gradient" id="welcome_div">Welcome back, Admin</div>
            </div>
          </div>
        </div>

        <div className="management-section">
            {/* Course Management */}
          <div className="course-container">
            <h2>Course Management</h2>
            <form onSubmit={handleAddCourse} id="add-course-form" >
              <label>Name of the Course:</label>
              <input type="text" value={courseForm.name} onChange={e => setCourseForm({...courseForm, name: e.target.value})} required placeholder="e.g., Operating Systems" maxLength={300}/>
              
              <label>Professor Assigned:</label>
              <select value={courseForm.professor} onChange={e => setCourseForm({...courseForm, professor: e.target.value})} required>
                <option value="">Select a Professor</option>
                {data.professors.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>

              <label>Section:</label>
              <input type="text" value={courseForm.section} onChange={e => setCourseForm({...courseForm, section: e.target.value})} required placeholder="e.g., 1" maxLength={300}/>

              <label>Total No. of Classes:</label>
              <input type="number" value={courseForm.totalclasses} onChange={e => setCourseForm({...courseForm, totalclasses: e.target.value})} required min="1" max="300"/>

              <label>Course's Credits:</label>
              <input type="number" value={courseForm.credits} onChange={e => setCourseForm({...courseForm, credits: e.target.value})} required min="1" max="300"/>

              <button type="submit">Add Course</button>
            </form>

            <h2>Remove Course</h2>
            <form id="remove-course-form" onSubmit={handleRemoveCourse}>
              <select value={removeCourseId} onChange={e => setRemoveCourseId(e.target.value)} required>
                <option value="">Select a Course</option>
                {data.courses.map(c => <option key={c._id} value={c._id}>{c.name} (Sec {c.section})</option>)}
              </select>
              <button type="submit">Remove Course</button>
            </form>
          </div>

          {/* Student Management */}
          <div className="student-container">
            <h2>Add New Student</h2>
            <form id="student-form" onSubmit={handleAddStudent}>
              <label>Name:</label>
              <input type="text" value={studentForm.name} onChange={e => setStudentForm({...studentForm, name: e.target.value})} required maxLength={300}/>
              <label>Email:</label>
              <input type="email" value={studentForm.email} onChange={e => setStudentForm({...studentForm, email: e.target.value})} required maxLength={300}/>
              <label>Roll Number:</label>
              <input type="text" value={studentForm.rollnumber} onChange={e => setStudentForm({...studentForm, rollnumber: e.target.value})} required maxLength={300}/>
              <label>Phone:</label>
              <input type="tel" value={studentForm.phone} onChange={e => setStudentForm({...studentForm, phone: e.target.value})} required pattern="[0-9]{10}" title="10 digit mobile number" maxLength={300}/>
              <label>Section:</label>
              <input type="text" value={studentForm.section} onChange={e => setStudentForm({...studentForm, section: e.target.value})} required maxLength={300}/>
              <label>Password:</label>
              <input type="password" value={studentForm.password} onChange={e => setStudentForm({...studentForm, password: e.target.value})} required minLength={6} maxLength={300}/>
              <button type="submit">Add Student</button>
            </form>
          </div>

          {/* Professor Management */}
          <div className="professor-container">
            <h2>Add New Professor</h2>
            <form id="add-professor-form" onSubmit={handleAddProfessor}>
              <label>Name:</label>
              <input type="text" value={profForm.name} onChange={e => setProfForm({...profForm, name: e.target.value})} required maxLength={300}/>
              <label>Email:</label>
              <input type="email" value={profForm.email} onChange={e => setProfForm({...profForm, email: e.target.value})} required maxLength={300}/>
              <label>Phone:</label>
              <input type="tel" value={profForm.phone} onChange={e => setProfForm({...profForm, phone: e.target.value})} required pattern="[0-9]{10}" title="10 digit mobile number" maxLength={300}/>
              <label>Password:</label>
              <input type="password" value={profForm.password} onChange={e => setProfForm({...profForm, password: e.target.value})} required minLength={6} maxLength={300}/>
              <button type="submit">Add Professor</button>
            </form>

            <h2>Remove Professor</h2>
            <form id="remove-professor-form" onSubmit={handleRemoveProfessor}>
              <select value={removeProfData.professor} onChange={e => setRemoveProfData({...removeProfData, professor: e.target.value})} required>
                <option value="">Select Professor</option>
                {data.professors.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
              <select value={removeProfData.course_action} onChange={e => setRemoveProfData({...removeProfData, course_action: e.target.value})} required>
                <option value="">Action for courses</option>
                <option value="remove">Remove all courses</option>
                <option value="reassign">Reassign to another professor</option>
              </select>
              {removeProfData.course_action === 'reassign' && (
                <select value={removeProfData.new_professor} onChange={e => setRemoveProfData({...removeProfData, new_professor: e.target.value})} required>
                  <option value="">Select New Professor</option>
                  {data.professors.filter(p => p._id !== removeProfData.professor).map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              )}
              <button type="submit">Remove Professor</button>
            </form>
          </div>

          {/* Allotment Section */}
          <div className="course-allotment-container">
            <h2>{isProfAssignment ? "Assign Course to Professor" : "Assign Course to Student"}</h2>
            <button type="button" onClick={() => setIsProfAssignment(!isProfAssignment)} className="toggle-btn">
              Switch to {isProfAssignment ? "Student" : "Professor"} Allotment
            </button>
            <form onSubmit={handleAssignCourse} id="course-allotment-form">
              <select value={assignCourseData.course} onChange={e => setAssignCourseData({...assignCourseData, course: e.target.value})} required>
                <option value="">Select Course</option>
                {data.courses.map(c => <option key={c._id} value={c._id}>{c.name} (Sec {c.section})</option>)}
              </select>
              
              {isProfAssignment ? (
                <select value={assignCourseData.professor} onChange={e => setAssignCourseData({...assignCourseData, professor: e.target.value})} required>
                  <option value="">Select Professor</option>
                  {data.professors.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              ) : (
                <select value={assignCourseData.student} onChange={e => setAssignCourseData({...assignCourseData, student: e.target.value})} required>
                  <option value="">Select Student</option>
                  {data.students.map(s => <option key={s._id} value={s._id}>{s.name} ({s.rollnumber})</option>)}
                </select>
              )}
              <button type="submit">Assign</button>
            </form>

            <h2>{isProfRemoval ? "Remove Course from Professor" : "Remove Course from Student"}</h2>
            <button type="button" onClick={() => setIsProfRemoval(!isProfRemoval)} className="toggle-btn">
              Switch to {isProfRemoval ? "Student" : "Professor"} Removal
            </button>
            <form onSubmit={handleRemoveCourseFrom} id="course-removal-form">
               <select value={removeCourseFromData.course} onChange={e => setRemoveCourseFromData({...removeCourseFromData, course: e.target.value})} required>
                <option value="">Select Course</option>
                {data.courses.map(c => <option key={c._id} value={c._id}>{c.name} (Sec {c.section})</option>)}
              </select>

              {isProfRemoval ? (
                <>
                  <select value={removeCourseFromData.professor} onChange={e => setRemoveCourseFromData({...removeCourseFromData, professor: e.target.value})} required>
                    <option value="">Select Professor</option>
                    {data.professors.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                  </select>
                  <select value={removeCourseFromData.unassign_action} onChange={e => setRemoveCourseFromData({...removeCourseFromData, unassign_action: e.target.value})} required>
                    <option value="">Action after unassign</option>
                    <option value="remove">Remove course</option>
                    <option value="reassign">Reassign</option>
                  </select>
                  {removeCourseFromData.unassign_action === 'reassign' && (
                    <select value={removeCourseFromData.new_professor} onChange={e => setRemoveCourseFromData({...removeCourseFromData, new_professor: e.target.value})} required>
                      <option value="">Select New Professor</option>
                      {data.professors.filter(p => p._id !== removeCourseFromData.professor).map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                    </select>
                  )}
                </>
              ) : (
                <select value={removeCourseFromData.student} onChange={e => setRemoveCourseFromData({...removeCourseFromData, student: e.target.value})} required>
                  <option value="">Select Student</option>
                  {data.students.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              )}
              <button type="submit">Remove</button>
            </form>
          </div>

          {/* Election Management */}
          <div className="course-container" style={{borderColor: '#2B9900'}}>
            <h2>Election Management</h2>
            <div style={{marginBottom: '20px'}}>
              <p>Status: <span style={{color: electionStatus?.status === 'active' ? '#2B9900' : 'red', fontWeight: 'bold'}}>{electionStatus?.status === 'active' ? 'ACTIVE' : 'INACTIVE'}</span></p>
              {electionStatus?.status === 'active' ? (
                <button onClick={handleStopElection} style={{backgroundColor: 'red', marginTop: '10px'}}>Stop Election</button>
              ) : (
                <button onClick={handleStartElection} style={{marginTop: '10px'}}>Start New Election</button>
              )}
            </div>

            {electionStatus?.status === 'active' && (
              <>
                <h3>Nominate Candidate</h3>
                <form onSubmit={handleNominate}>
                  <label>Student Email:</label>
                  <input type="email" value={nominateEmail} onChange={e => setNominateEmail(e.target.value)} required placeholder="student@example.com" maxLength={300}/>
                  <button type="submit">Nominate</button>
                </form>

                <h3>Current Candidates</h3>
                <ul className="student-list">
                  {electionStatus.candidates.map(c => (
                    <li key={c._id} style={{display:'flex', justifyContent:'space-between'}}>
                      <span>{c.student.name}</span>
                      <span style={{color:'#2B9900'}}>{c.votes} Votes</span>
                    </li>
                  ))}
                  {electionStatus.candidates.length === 0 && <li className="no-items">No candidates yet</li>}
                </ul>
              </>
            )}
          </div>
        </div>
        
        {/* Lists Display */}
        <div className="lists-display">
            <h3>Existing Courses</h3>
            <ul>
                {data.courses.map(c => (
                    <li key={c._id}>{c.name} (Sec {c.section}) - Prof: {c.professor?.name || 'Unassigned'}</li>
                ))}
            </ul>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;