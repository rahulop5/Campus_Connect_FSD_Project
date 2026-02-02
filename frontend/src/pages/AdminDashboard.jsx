import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDashboardData } from '../store/slices/adminSlice';
import api from '../api/axios';
import { removeCandidate } from '../api/election';
import Layout from '../components/Layout';
import AdminModal from '../components/AdminModal';
import DatePicker from 'react-datepicker';
import '../styles/Admindashboard.css';
import 'react-datepicker/dist/react-datepicker.css';

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { courses, professors, students, loading } = useSelector((state) => state.admin);
  const { user } = useSelector((state) => state.auth);
  const data = { courses, professors, students }; // Map redux state to local variable name used in render

  const [activeSection, setActiveSection] = useState('course'); // course, student, professor, allotment
  const [activeTab, setActiveTab] = useState('courses'); // courses, students, faculty, elections
  const [addCourseModalOpen, setAddCourseModalOpen] = useState(false);
  const [addStudentModalOpen, setAddStudentModalOpen] = useState(false);
  const [addFacultyModalOpen, setAddFacultyModalOpen] = useState(false);
  const [nominateModalOpen, setNominateModalOpen] = useState(false);
  
  // Notification state
  const [notification, setNotification] = useState({ message: '', type: '' }); // type: 'success' or 'error'
  
  // Helper to show notifications
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: '' }), 4000);
  };
  
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

  const fetchElectionStatus = async () => {
    try {
      const res = await api.get('/election');
      setElectionStatus(res.data.election || null);
      setElectionCandidates(res.data.candidates || []);
    } catch (err) {
      console.error('Error fetching election status:', err);
      setElectionStatus(null);
      setElectionCandidates([]);
    }
  };



  useEffect(() => {
    dispatch(fetchDashboardData());
  }, [dispatch]);

  // Helper to refresh data
  const refreshData = () => dispatch(fetchDashboardData());

  const handleAddCourse = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/course/add', courseForm);
      showNotification('Course added successfully', 'success');
      fetchDashboardData();
      setCourseForm({ name: '', professor: '', section: '', totalclasses: '', credits: '' });
      setAddCourseModalOpen(false);
    } catch (err) {
      showNotification(err.response?.data?.message || 'Error adding course', 'error');
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/student/add', studentForm);
      showNotification('Student added successfully', 'success');
      refreshData();
      setStudentForm({ name: '', email: '', rollnumber: '', phone: '', section: '', password: '' });
      setAddStudentModalOpen(false);
    } catch (err) {
      showNotification(err.response?.data?.message || 'Error adding student', 'error');
    }
  };

  const handleAddProfessor = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/professor/add', profForm);
      showNotification('Faculty added successfully', 'success');
      refreshData();
      setProfForm({ name: '', email: '', phone: '', password: '' });
      setAddFacultyModalOpen(false);
    } catch (err) {
      showNotification(err.response?.data?.message || 'Error adding faculty', 'error');
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
  const [nominateRole, setNominateRole] = useState('');
  const [electionCandidates, setElectionCandidates] = useState([]);

  const electionRoles = [
    'SDC President',
    'SLC President',
    'SDC Technical Secretary',
    'SDC Non-technical Secretary',
    'SLC Secretary',
    'SDC Treasurer'
  ];
  const [startConfirmOpen, setStartConfirmOpen] = useState(false);
  const [startFormOpen, setStartFormOpen] = useState(false);
  const [startElectionForm, setStartElectionForm] = useState({
    title: '',
    description: '',
    startTime: null,
    endTime: null
  });
  const [startElectionError, setStartElectionError] = useState('');
  useEffect(() => {
    fetchElectionStatus();
  }, []);

  const handleStartElection = () => {
    setStartConfirmOpen(true);
  };

  const handleConfirmStartElection = () => {
    setStartConfirmOpen(false);
    setStartFormOpen(true);
    setStartElectionError('');
  };

  const handleCancelStartElection = () => {
    setStartConfirmOpen(false);
    setStartFormOpen(false);
    setStartElectionError('');
  };

  const handleSubmitStartElection = async (e) => {
    e.preventDefault();

    if (!startElectionForm.title.trim()) {
      setStartElectionError('Title is required');
      return;
    }

    if (!startElectionForm.startTime || !startElectionForm.endTime) {
      setStartElectionError('Start time and end time are required');
      return;
    }

    const start = new Date(startElectionForm.startTime);
    const end = new Date(startElectionForm.endTime);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      setStartElectionError('End time must be after start time');
      return;
    }

    try {
      setStartElectionError('');
      const payload = {
        ...startElectionForm,
        startTime: new Date(startElectionForm.startTime),
        endTime: new Date(startElectionForm.endTime)
      };
      await api.post('/election/start', payload);
      setStartFormOpen(false);
      setStartElectionForm({ title: '', description: '', startTime: '', endTime: '' });
      fetchElectionStatus();
    } catch (err) {
      setStartElectionError(err.response?.data?.message || 'Error starting election');
    }
  };

  const handleStopElection = async () => {
    if (!window.confirm("Are you sure you want to stop the current election?")) return;
    try {
      await api.post('/election/stop');
      showNotification("Election stopped!", 'success');
      fetchElectionStatus();
    } catch (err) {
      showNotification(err.response?.data?.message || "Error stopping election", 'error');
    }
  };

  const handleNominate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/election/nominate', { electionId: electionStatus?._id, email: nominateEmail, role: nominateRole });
      showNotification("Candidate nominated successfully!", 'success');
      setNominateEmail('');
      setNominateRole('');
      setNominateModalOpen(false);
      fetchElectionStatus();
    } catch (err) {
      showNotification(err.response?.data?.message || "Error nominating candidate", 'error');
    }
  };

  const handleRemoveCandidate = async (candidateId) => {
    if (!window.confirm('Remove this candidate? This will also delete their votes.')) return;
    try {
      const res = await removeCandidate(candidateId);
      setElectionCandidates(res.data.candidates || []);
      showNotification('Candidate removed successfully', 'success');
      fetchElectionStatus();
    } catch (err) {
      showNotification(err.response?.data?.message || "Error removing candidate", 'error');
    }
  };

  if (loading) return <Layout>Loading...</Layout>;

  return (
    <Layout>
      <div className="admin-dashboard admin-dashboard-page">
        {/* Dashboard Title Row */}
        <div style={{
          padding: '40px 48px 20px 48px',
          marginBottom: '40px'
        }}>
          <div className="admin-dashboard-label" style={{
            fontFamily: 'Outfit',
            fontSize: '24px',
            width: '1vw',
            fontWeight: 500,
            // marginBottom: '4px',
            color: '#2B9900',
            letterSpacing: '0.5px'
          }}>
            Dashboard
          </div>
          <div className="admin-welcome-heading green_gradient" style={{
            fontFamily: 'Outfit',
            fontSize: '70px',
            fontWeight: 600,
            width: '60vw',
            // lineHeight: '1.2',
            letterSpacing: '-1px',
            marginTop: '-10'
          }}>
            Welcome back, Admin
          </div>
        </div>

        {/* Tab Navigation Row */}
        <div className="admin-tab-navigation" style={{
          padding: '0 48px 8px 48px',
          marginTop: '0',
          marginBottom: '0',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <button 
            className={`admin-tab-btn ${activeTab === 'courses' ? 'admin-tab-active' : ''}`}
            onClick={() => setActiveTab('courses')}
          >
            Courses
          </button>
          <button 
            className={`admin-tab-btn ${activeTab === 'students' ? 'admin-tab-active' : ''}`}
            onClick={() => setActiveTab('students')}
          >
            Students
          </button>
          <button 
            className={`admin-tab-btn ${activeTab === 'faculty' ? 'admin-tab-active' : ''}`}
            onClick={() => setActiveTab('faculty')}
          >
            Faculty
          </button>
          <button 
            className={`admin-tab-btn ${activeTab === 'elections' ? 'admin-tab-active' : ''}`}
            onClick={() => setActiveTab('elections')}
          >
            Elections
          </button>
        </div>

        {/* Notification Toast */}
        {notification.message && (
          <div style={{
            position: 'fixed',
            top: '90px',
            right: '30px',
            background: notification.type === 'success' ? 'rgba(43, 153, 0, 0.95)' : 'rgba(255, 68, 68, 0.95)',
            color: 'white',
            padding: '16px 24px',
            borderRadius: '8px',
            fontFamily: 'Outfit',
            fontWeight: 500,
            fontSize: '14px',
            zIndex: 3000,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            animation: 'slideInRight 0.3s ease',
            maxWidth: '400px'
          }}>
            {notification.message}
          </div>
        )}

        <div className="management-section" style={{marginTop: 0}}>
            {/* Course Management */}
            {activeTab === 'courses' && (
          <div className="course-container" style={{maxWidth: '900px', margin: '0 auto', padding: '0 30px', marginTop: 0}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
              <h2 style={{margin: 0}}>Courses</h2>
              <button 
                type="button" 
                onClick={() => setAddCourseModalOpen(true)}
                disabled={data.professors.length === 0}
                style={{
                  background: data.professors.length === 0 ? 'rgba(43, 153, 0, 0.3)' : '#2B9900', 
                  color: 'white', 
                  border: 'none', 
                  padding: '10px 20px', 
                  borderRadius: '8px', 
                  cursor: data.professors.length === 0 ? 'not-allowed' : 'pointer', 
                  fontFamily: 'Outfit', 
                  fontWeight: 600,
                  opacity: data.professors.length === 0 ? 0.5 : 1
                }}
                title={data.professors.length === 0 ? 'Add faculty first to create courses' : ''}
              >
                + Add Course
              </button>
            </div>
            {data.courses.length === 0 ? (
              <div style={{
                textAlign: 'center', 
                padding: '60px 20px', 
                color: 'rgba(255, 255, 255, 0.4)'
              }}>
                <div style={{fontSize: '48px', marginBottom: '20px'}}>📚</div>
                <div style={{
                  fontSize: '16px', 
                  fontWeight: '500', 
                  marginBottom: '8px', 
                  color: 'rgba(255, 255, 255, 0.65)'
                }}>
                  No courses yet
                </div>
                <div style={{fontSize: '14px', color: 'rgba(255, 255, 255, 0.4)'}}>
                  {data.professors.length === 0 
                    ? 'Add faculty members first, then create courses' 
                    : 'Click "+ Add Course" above to create your first course'
                  }
                </div>
              </div>
            ) : (
            <ul className="student-list" style={{paddingTop: '8px'}}>
              {data.courses.map(course => (
                <li 
                  key={course._id} 
                  style={{
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '18px 0',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                >
                  <div>
                    <div style={{fontSize: '17px', fontWeight: '600', marginBottom: '6px', color: 'rgba(255, 255, 255, 0.95)'}}>
                      {course.name} <span style={{fontSize: '15px', fontWeight: '400', color: 'rgba(255, 255, 255, 0.5)'}}>(Section {course.section})</span>
                    </div>
                    <div style={{fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)', fontWeight: '400'}}>
                      Professor: {course.professor?.name || 'Unassigned'}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="remove-candidate-btn"
                    onClick={async () => {
                      if (window.confirm(`Delete course "${course.name}"?`)) {
                        try {
                          await api.post('/admin/remove/course', { course: course._id, removeType: 'entire-course' });
                          showNotification('Course deleted successfully', 'success');
                          refreshData();
                        } catch (err) {
                          showNotification(err.response?.data?.message || 'Error deleting course', 'error');
                        }
                      }
                    }}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
            )}
          </div>
            )}

          {/* Student Management */}
          {activeTab === 'students' && (
          <div className="student-container" style={{maxWidth: '900px', margin: '0 auto', padding: '0 30px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
              <h2 style={{margin: 0}}>Students</h2>
              <button 
                type="button" 
                onClick={() => setAddStudentModalOpen(true)}
                style={{background: '#2B9900', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'Outfit', fontWeight: 600}}
              >
                + Add Student
              </button>
            </div>
            {data.students.length === 0 ? (
              <div style={{
                textAlign: 'center', 
                padding: '60px 20px', 
                color: 'rgba(255, 255, 255, 0.4)'
              }}>
                <div style={{fontSize: '48px', marginBottom: '20px'}}>👨‍🎓</div>
                <div style={{
                  fontSize: '16px', 
                  fontWeight: '500', 
                  marginBottom: '8px', 
                  color: 'rgba(255, 255, 255, 0.65)'
                }}>
                  No students yet
                </div>
                <div style={{fontSize: '14px', color: 'rgba(255, 255, 255, 0.4)'}}>
                  Click "+ Add Student" above to add your first student
                </div>
              </div>
            ) : (
            <ul className="student-list" style={{paddingTop: '8px'}}>
              {data.students.map(student => (
                <li key={student._id} className="candidate-list-item">
                  <div>
                    <strong>{student.name}</strong>
                    <div style={{fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)', marginTop: '4px'}}>
                      <div>Email: {student.email}</div>
                      <div>Roll Number: {student.rollnumber}</div>
                      <div>Section: {student.section}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="remove-candidate-btn"
                    onClick={async () => {
                      if (window.confirm(`Delete student "${student.name}"?`)) {
                        try {
                          await api.delete(`/admin/student/${student._id}`);
                          showNotification('Student deleted successfully', 'success');
                          refreshData();
                        } catch (err) {
                          showNotification(err.response?.data?.message || 'Error deleting student', 'error');
                        }
                      }
                    }}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
            )}
          </div>
            )}

          {/* Professor Management */}
          {activeTab === 'faculty' && (
          <div className="professor-container" style={{maxWidth: '900px', margin: '0 auto', padding: '0 30px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
              <h2 style={{margin: 0}}>Faculty</h2>
              <button 
                type="button" 
                onClick={() => setAddFacultyModalOpen(true)}
                style={{background: '#2B9900', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'Outfit', fontWeight: 600}}
              >
                + Add Faculty
              </button>
            </div>
            {data.professors.length === 0 ? (
              <div style={{
                textAlign: 'center', 
                padding: '60px 20px', 
                color: 'rgba(255, 255, 255, 0.4)'
              }}>
                <div style={{fontSize: '48px', marginBottom: '20px'}}>👨‍🏫</div>
                <div style={{
                  fontSize: '16px', 
                  fontWeight: '500', 
                  marginBottom: '8px', 
                  color: 'rgba(255, 255, 255, 0.65)'
                }}>
                  No faculty yet
                </div>
                <div style={{fontSize: '14px', color: 'rgba(255, 255, 255, 0.4)'}}>
                  Click "+ Add Faculty" above to add your first faculty member
                </div>
              </div>
            ) : (
            <ul className="student-list" style={{paddingTop: '8px'}}>
              {data.professors.map(professor => (
                <li key={professor._id} className="candidate-list-item">
                  <div>
                    <strong>{professor.name}</strong>
                    <div style={{fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)', marginTop: '4px'}}>
                      <div>Email: {professor.email}</div>
                      <div>Phone: {professor.phone}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="remove-candidate-btn"
                    onClick={async () => {
                      if (window.confirm(`Delete professor "${professor.name}"?`)) {
                        try {
                          await api.delete(`/admin/professor/${professor._id}`);
                          showNotification('Faculty deleted successfully', 'success');
                          refreshData();
                        } catch (err) {
                          showNotification(err.response?.data?.message || 'Error deleting faculty', 'error');
                        }
                      }
                    }}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
            )}
          </div>
            )}

          {/* Election Management */}
          {activeTab === 'elections' && (
          <div className="course-container">
            <h2 style={{marginBottom: '24px', paddingBottom: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)'}}>Elections</h2>
            
            {/* Status Section */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: '24px',
              marginBottom: '24px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <div>
                <div style={{fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px'}}>
                  Status
                </div>
                <div style={{
                  fontSize: '28px',
                  fontWeight: 'bold',
                  color: electionStatus?.status === 'active' ? '#2B9900' : '#ff4444'
                }}>
                  {electionStatus?.status === 'active' ? 'ACTIVE' : 'ENDED'}
                </div>
              </div>
              
              <div>
                {electionStatus?.status === 'active' ? (
                  <button 
                    onClick={handleStopElection}
                    style={{
                      background: '#ff4444',
                      color: 'white',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontFamily: 'Outfit',
                      fontWeight: 600,
                      fontSize: '14px'
                    }}
                  >
                    Stop Election
                  </button>
                ) : (
                  <button 
                    onClick={handleStartElection}
                    style={{
                      background: '#2B9900',
                      color: 'white',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontFamily: 'Outfit',
                      fontWeight: 600,
                      fontSize: '14px'
                    }}
                  >
                    Start New Election
                  </button>
                )}
              </div>
            </div>

            {/* Candidates List */}
            {electionStatus?.status === 'active' && (
              <>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                  <h3 style={{margin: 0, fontSize: '18px'}}>Candidates</h3>
                  <button 
                    type="button" 
                    onClick={() => setNominateModalOpen(true)}
                    style={{background: '#2B9900', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'Outfit', fontWeight: 600}}
                  >
                    Nominate Candidate
                  </button>
                </div>
                
                {electionCandidates.length === 0 ? (
                  <div className="no-items" style={{padding: '20px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)'}}>
                    No candidates yet
                  </div>
                ) : (
                  <>
                    {electionRoles.map(role => {
                      const candidatesForRole = electionCandidates.filter(c => c.role === role);
                      if (candidatesForRole.length === 0) return null;
                      
                      return (
                        <div key={role} style={{marginBottom: '32px'}}>
                          <h4 style={{
                            color: '#2B9900',
                            fontSize: '15px',
                            fontWeight: 600,
                            marginBottom: '12px',
                            paddingBottom: '0',
                            borderBottom: 'none',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            {role}
                          </h4>
                          <ul className="student-list">
                            {candidatesForRole.map(c => (
                              <li key={c._id} className="candidate-list-item">
                                <div>
                                  <strong>{c.name}</strong>
                                  <div style={{fontSize: '14px', color: '#2B9900', marginTop: '4px'}}>
                                    {c.voteCount} Votes
                                  </div>
                                </div>
                                {user?.role === 'Admin' && (
                                  <button
                                    type="button"
                                    className="remove-candidate-btn"
                                    onClick={() => handleRemoveCandidate(c._id)}
                                  >
                                    Remove
                                  </button>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </>
                )}
              </>
            )}
          </div>
            )}
        </div>

        {startConfirmOpen && (
          <div className="admin-modal-overlay">
            <div className="admin-modal">
              <h3>Start New Election?</h3>
              <p>This will end any currently active election.</p>
              <div className="admin-modal-actions">
                <button type="button" className="admin-modal-btn admin-modal-btn--secondary" onClick={handleCancelStartElection}>Cancel</button>
                <button type="button" className="admin-modal-btn" onClick={handleConfirmStartElection}>Continue</button>
              </div>
            </div>
          </div>
        )}

        {startFormOpen && (
          <div className="admin-modal-overlay">
            <div className="admin-modal">
              <h3>New Election Details</h3>
              <form className="admin-modal-form" onSubmit={handleSubmitStartElection}>
                <label>Title</label>
                <input
                  type="text"
                  value={startElectionForm.title}
                  onChange={(e) => setStartElectionForm({ ...startElectionForm, title: e.target.value })}
                  required
                  maxLength={200}
                />
                <label>Description</label>
                <textarea
                  value={startElectionForm.description}
                  onChange={(e) => setStartElectionForm({ ...startElectionForm, description: e.target.value })}
                  rows={4}
                  maxLength={1000}
                />
                <label>Start Time</label>
                <DatePicker
                  selected={startElectionForm.startTime}
                  onChange={(date) => setStartElectionForm({ ...startElectionForm, startTime: date })}
                  showTimeSelect
                  timeIntervals={15}
                  dateFormat="yyyy-MM-dd HH:mm"
                  className="admin-datepicker"
                  required
                />
                <label>End Time</label>
                <DatePicker
                  selected={startElectionForm.endTime}
                  onChange={(date) => setStartElectionForm({ ...startElectionForm, endTime: date })}
                  showTimeSelect
                  timeIntervals={15}
                  dateFormat="yyyy-MM-dd HH:mm"
                  className="admin-datepicker"
                  required
                  minDate={startElectionForm.startTime}
                />
                {startElectionError && (
                  <div className="admin-modal-error">{startElectionError}</div>
                )}
                <div className="admin-modal-actions">
                  <button type="button" className="admin-modal-btn admin-modal-btn--secondary" onClick={handleCancelStartElection}>Cancel</button>
                  <button type="submit" className="admin-modal-btn">Start Election</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Course Modal */}
        <AdminModal
          isOpen={addCourseModalOpen}
          onClose={() => setAddCourseModalOpen(false)}
          title="Add New Course"
          actions={
            <>
              <button 
                type="button" 
                className="admin-modal-btn admin-modal-btn--secondary" 
                onClick={() => setAddCourseModalOpen(false)}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                form="add-course-modal-form"
                className="admin-modal-btn"
              >
                Add Course
              </button>
            </>
          }
        >
          <form id="add-course-modal-form" className="admin-modal-form" onSubmit={handleAddCourse}>
            <label>Name of the Course</label>
            <input 
              type="text" 
              value={courseForm.name} 
              onChange={e => setCourseForm({...courseForm, name: e.target.value})} 
              required 
              placeholder="e.g., Operating Systems" 
              maxLength={300}
            />
            
            <label>Professor Assigned</label>
            <select 
              value={courseForm.professor} 
              onChange={e => setCourseForm({...courseForm, professor: e.target.value})} 
              required
            >
              <option value="">Select a Professor</option>
              {data.professors.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>

            <label>Section</label>
            <input 
              type="text" 
              value={courseForm.section} 
              onChange={e => setCourseForm({...courseForm, section: e.target.value})} 
              required 
              placeholder="e.g., 1" 
              maxLength={300}
            />

            <label>Total No. of Classes</label>
            <input 
              type="number" 
              value={courseForm.totalclasses} 
              onChange={e => setCourseForm({...courseForm, totalclasses: e.target.value})} 
              required 
              min="1" 
              max="300"
            />

            <label>Course's Credits</label>
            <input 
              type="number" 
              value={courseForm.credits} 
              onChange={e => setCourseForm({...courseForm, credits: e.target.value})} 
              required 
              min="1" 
              max="300"
            />
          </form>
        </AdminModal>


        {/* Add Student Modal */}
        <AdminModal
          isOpen={addStudentModalOpen}
          onClose={() => setAddStudentModalOpen(false)}
          title="Add New Student"
          actions={
            <>
              <button 
                type="button" 
                className="admin-modal-btn admin-modal-btn--secondary" 
                onClick={() => setAddStudentModalOpen(false)}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                form="add-student-modal-form"
                className="admin-modal-btn"
              >
                Add Student
              </button>
            </>
          }
        >
          <form id="add-student-modal-form" className="admin-modal-form" onSubmit={handleAddStudent}>
            <label>Name</label>
            <input 
              type="text" 
              value={studentForm.name} 
              onChange={e => setStudentForm({...studentForm, name: e.target.value})} 
              required 
              maxLength={300}
            />
            
            <label>Email</label>
            <input 
              type="email" 
              value={studentForm.email} 
              onChange={e => setStudentForm({...studentForm, email: e.target.value})} 
              required 
              maxLength={300}
            />

            <label>Roll Number</label>
            <input 
              type="text" 
              value={studentForm.rollnumber} 
              onChange={e => setStudentForm({...studentForm, rollnumber: e.target.value})} 
              required 
              maxLength={300}
            />

            <label>Phone</label>
            <input 
              type="tel" 
              value={studentForm.phone} 
              onChange={e => setStudentForm({...studentForm, phone: e.target.value})} 
              required 
              pattern="[0-9]{10}" 
              title="10 digit mobile number" 
              maxLength={300}
            />

            <label>Section</label>
            <input 
              type="text" 
              value={studentForm.section} 
              onChange={e => setStudentForm({...studentForm, section: e.target.value})} 
              required 
              maxLength={300}
            />

            <label>Password</label>
            <input 
              type="password" 
              value={studentForm.password} 
              onChange={e => setStudentForm({...studentForm, password: e.target.value})} 
              required 
              minLength={6} 
              maxLength={300}
            />
          </form>
        </AdminModal>

        {/* Add Faculty Modal */}
        <AdminModal
          isOpen={addFacultyModalOpen}
          onClose={() => setAddFacultyModalOpen(false)}
          title="Add New Faculty"
          actions={
            <>
              <button 
                type="button" 
                className="admin-modal-btn admin-modal-btn--secondary" 
                onClick={() => setAddFacultyModalOpen(false)}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                form="add-faculty-modal-form"
                className="admin-modal-btn"
              >
                Add Faculty
              </button>
            </>
          }
        >
          <form id="add-faculty-modal-form" className="admin-modal-form" onSubmit={handleAddProfessor}>
            <label>Name</label>
            <input 
              type="text" 
              value={profForm.name} 
              onChange={e => setProfForm({...profForm, name: e.target.value})} 
              required 
              maxLength={300}
            />
            
            <label>Email</label>
            <input 
              type="email" 
              value={profForm.email} 
              onChange={e => setProfForm({...profForm, email: e.target.value})} 
              required 
              maxLength={300}
            />

            <label>Phone</label>
            <input 
              type="tel" 
              value={profForm.phone} 
              onChange={e => setProfForm({...profForm, phone: e.target.value})} 
              required 
              pattern="[0-9]{10}" 
              title="10 digit mobile number" 
              maxLength={300}
            />

            <label>Password</label>
            <input 
              type="password" 
              value={profForm.password} 
              onChange={e => setProfForm({...profForm, password: e.target.value})} 
              required 
              minLength={6} 
              maxLength={300}
            />
          </form>
        </AdminModal>

        {/* Nominate Candidate Modal */}
        <AdminModal
          isOpen={nominateModalOpen}
          onClose={() => setNominateModalOpen(false)}
          title="Nominate Candidate"
          actions={
            <>
              <button 
                type="button" 
                className="admin-modal-btn admin-modal-btn--secondary" 
                onClick={() => setNominateModalOpen(false)}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                form="nominate-modal-form"
                className="admin-modal-btn"
              >
                Nominate
              </button>
            </>
          }
        >
          <form id="nominate-modal-form" className="admin-modal-form" onSubmit={handleNominate}>
            <label>Student Email</label>
            <input 
              type="email" 
              value={nominateEmail} 
              onChange={e => setNominateEmail(e.target.value)} 
              required 
              placeholder="student@example.com" 
              maxLength={300}
            />
            
            <label>Role</label>
            <select 
              value={nominateRole} 
              onChange={e => setNominateRole(e.target.value)} 
              required
            >
              <option value="">Select a role</option>
              {electionRoles.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </form>
        </AdminModal>
      </div>
    </Layout>
  );
};

export default AdminDashboard;