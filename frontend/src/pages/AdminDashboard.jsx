import { useState, useEffect } from 'react';
import api from '../api/axios';
import Layout from '../components/Layout';
import '../styles/Admindashboard.css';

const AdminDashboard = () => {
  const [data, setData] = useState({ courses: [], professors: [], students: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await api.get('/admin/dashboard');
      setData(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching dashboard data", err);
      setLoading(false);
    }
  };

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
      fetchDashboardData();
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
      fetchDashboardData();
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
      fetchDashboardData();
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
      fetchDashboardData();
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
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error assigning course');
    }
  };

  const handleRemoveCourseFrom = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/remove/course', { ...removeCourseFromData, removeType: isProfRemoval ? 'professor' : 'student' });
      alert('Removal successful');
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error removing course from user');
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
            <form onSubmit={handleAddCourse}>
              <label>Name of the Course:</label>
              <input type="text" value={courseForm.name} onChange={e => setCourseForm({...courseForm, name: e.target.value})} required placeholder="e.g., Operating Systems"/>
              
              <label>Professor Assigned:</label>
              <select value={courseForm.professor} onChange={e => setCourseForm({...courseForm, professor: e.target.value})} required>
                <option value="">Select a Professor</option>
                {data.professors.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>

              <label>Section:</label>
              <input type="text" value={courseForm.section} onChange={e => setCourseForm({...courseForm, section: e.target.value})} required placeholder="e.g., 1"/>

              <label>Total No. of Classes:</label>
              <input type="number" value={courseForm.totalclasses} onChange={e => setCourseForm({...courseForm, totalclasses: e.target.value})} required min="1"/>

              <label>Course's Credits:</label>
              <input type="number" value={courseForm.credits} onChange={e => setCourseForm({...courseForm, credits: e.target.value})} required min="1"/>

              <button type="submit">Add Course</button>
            </form>

            <h2>Remove Course</h2>
            <form onSubmit={handleRemoveCourse}>
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
            <form onSubmit={handleAddStudent}>
              <label>Name:</label>
              <input type="text" value={studentForm.name} onChange={e => setStudentForm({...studentForm, name: e.target.value})} required/>
              <label>Email:</label>
              <input type="email" value={studentForm.email} onChange={e => setStudentForm({...studentForm, email: e.target.value})} required/>
              <label>Roll Number:</label>
              <input type="text" value={studentForm.rollnumber} onChange={e => setStudentForm({...studentForm, rollnumber: e.target.value})} required/>
              <label>Phone:</label>
              <input type="text" value={studentForm.phone} onChange={e => setStudentForm({...studentForm, phone: e.target.value})} required/>
              <label>Section:</label>
              <input type="text" value={studentForm.section} onChange={e => setStudentForm({...studentForm, section: e.target.value})} required/>
              <label>Password:</label>
              <input type="password" value={studentForm.password} onChange={e => setStudentForm({...studentForm, password: e.target.value})} required/>
              <button type="submit">Add Student</button>
            </form>
          </div>

          {/* Professor Management */}
          <div className="professor-container">
            <h2>Add New Professor</h2>
            <form onSubmit={handleAddProfessor}>
              <label>Name:</label>
              <input type="text" value={profForm.name} onChange={e => setProfForm({...profForm, name: e.target.value})} required/>
              <label>Email:</label>
              <input type="email" value={profForm.email} onChange={e => setProfForm({...profForm, email: e.target.value})} required/>
              <label>Phone:</label>
              <input type="text" value={profForm.phone} onChange={e => setProfForm({...profForm, phone: e.target.value})} required/>
              <label>Password:</label>
              <input type="password" value={profForm.password} onChange={e => setProfForm({...profForm, password: e.target.value})} required/>
              <button type="submit">Add Professor</button>
            </form>

            <h2>Remove Professor</h2>
            <form onSubmit={handleRemoveProfessor}>
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
            <form onSubmit={handleAssignCourse}>
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
            <form onSubmit={handleRemoveCourseFrom}>
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
