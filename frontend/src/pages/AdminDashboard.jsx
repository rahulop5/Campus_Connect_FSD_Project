import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import { fetchDashboardData } from '../store/slices/adminSlice';
import api from '../api/axios';
import { removeCandidate } from '../api/election';
import Layout from '../components/Layout';
import AdminModal from '../components/AdminModal';
import DatePicker from 'react-datepicker';
import '../styles/Admindashboard.css';
import 'react-datepicker/dist/react-datepicker.css';

// Helper function to generate course acronyms
const getCourseAcronym = (courseName = '') => {
  const words = courseName.split(' ').filter(Boolean);
  if (words.length <= 1) return courseName;

  const stopWords = new Set([
    'of', 'the', 'and', 'for', 'to', 'in', 'on', 'with', 'a', 'an'
  ]);

  return words
    .filter(word => !stopWords.has(word.toLowerCase()))
    .map(word => word[0].toUpperCase())
    .join('');
};

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { courses, professors, students, loading } = useSelector((state) => state.admin);
  const { user } = useSelector((state) => state.auth);
  const data = { courses, professors, students }; // Map redux state to local variable name used in render
  console.log(data.students)

  const [activeSection, setActiveSection] = useState('course'); // course, student, professor, allotment
  const [activeTab, setActiveTab] = useState('courses'); // courses, students, faculty, elections
  const [addCourseModalOpen, setAddCourseModalOpen] = useState(false);
  const [addStudentModalOpen, setAddStudentModalOpen] = useState(false);
  const [addFacultyModalOpen, setAddFacultyModalOpen] = useState(false);
  const [nominateModalOpen, setNominateModalOpen] = useState(false);
  const [editCourseModalOpen, setEditCourseModalOpen] = useState(false);
  const [editCourseForm, setEditCourseForm] = useState({ name: '', professor: '', section: '', totalclasses: '', credits: '', _id: '' });
  const [editStudentModalOpen, setEditStudentModalOpen] = useState(false);
  const [editStudentForm, setEditStudentForm] = useState({
    name: '',
    rollnumber: '',
    phone: '',
    section: '',
    email: '',
    courses: [],
    _id: ''
  });
  const [editStudentCourseSearch, setEditStudentCourseSearch] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [deleteStudentConfirmOpen, setDeleteStudentConfirmOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [hoveredIcon, setHoveredIcon] = useState({ courseId: null, type: null });
  const [courseSearchQuery, setCourseSearchQuery] = useState('');
  const [facultySearchQuery, setFacultySearchQuery] = useState('');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [editFacultyModalOpen, setEditFacultyModalOpen] = useState(false);
  const [editFacultyForm, setEditFacultyForm] = useState({ name: '', email: '', phone: '', password: '', _id: '' });
  const [deleteFacultyConfirmOpen, setDeleteFacultyConfirmOpen] = useState(false);
  const [facultyToDelete, setFacultyToDelete] = useState(null);

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
  const [profForm, setProfForm] = useState({ name: '', email: '', phone: '', password: '', employeeId: '' });

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

  // Requests State
  const [requests, setRequests] = useState([]);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/institutes/pending');
      setRequests(res.data);
    } catch (error) {
      console.error("Error fetching requests:", error);
    }
  };

  const handleRequestAction = async (userId, action) => {
    try {
      await api.post('/institutes/verify', { userId, action });
      showNotification(`User ${action}ed successfully`, 'success');
      fetchRequests(); // Refresh list
    } catch (error) {
      showNotification(error.response?.data?.message || "Error processing request", 'error');
    }
  }



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

  const handleEditCourse = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/admin/course/${editCourseForm._id}`, editCourseForm);
      showNotification('Course updated successfully', 'success');
      refreshData();
      setEditCourseForm({ name: '', professor: '', section: '', totalclasses: '', credits: '', _id: '' });
      setEditCourseModalOpen(false);
    } catch (err) {
      showNotification(err.response?.data?.message || 'Error updating course', 'error');
    }
  };

  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;
    try {
      await api.post('/admin/remove/course', { course: courseToDelete._id, removeType: 'entire-course' });
      showNotification('Course deleted successfully', 'success');
      refreshData();
      setDeleteConfirmOpen(false);
      setCourseToDelete(null);
    } catch (err) {
      showNotification(err.response?.data?.message || 'Error deleting course', 'error');
    }
  };

  const openEditModal = (course) => {
    setEditCourseForm({
      name: course.name,
      professor: course.professor?._id || '',
      section: course.section,
      totalclasses: course.totalclasses,
      credits: course.credits,
      _id: course._id
    });
    setEditCourseModalOpen(true);
  };

  const openDeleteConfirm = (course) => {
    setCourseToDelete(course);
    setDeleteConfirmOpen(true);
  };

  const openDeleteStudentConfirm = (student) => {
    setStudentToDelete(student);
    setDeleteStudentConfirmOpen(true);
  };

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;
    try {
      await api.delete(`/admin/student/${studentToDelete._id}`);
      showNotification('Student deleted successfully', 'success');
      refreshData();
      setDeleteStudentConfirmOpen(false);
      setStudentToDelete(null);
    } catch (err) {
      showNotification(err.response?.data?.message || 'Error deleting student', 'error');
    }
  };

  const openEditFacultyModal = (faculty) => {
    setEditFacultyForm({
      name: faculty.name,
      email: faculty.email,
      phone: faculty.phone || '',
      password: '',
      _id: faculty._id
    });
    setEditFacultyModalOpen(true);
  };

  const openDeleteFacultyConfirm = (faculty) => {
    setFacultyToDelete(faculty);
    setDeleteFacultyConfirmOpen(true);
  };

  const handleEditFaculty = async () => {
    try {
      await api.put(`/admin/professor/${editFacultyForm._id}`, {
        name: editFacultyForm.name,
        email: editFacultyForm.email,
        phone: editFacultyForm.phone,
        ...(editFacultyForm.password && { password: editFacultyForm.password })
      });
      showNotification('Faculty updated successfully', 'success');
      setEditFacultyModalOpen(false);
      refreshData();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Error updating faculty', 'error');
    }
  };

  const handleDeleteFaculty = async () => {
    try {
      await api.delete(`/admin/professor/${facultyToDelete._id}`);
      showNotification('Faculty deleted successfully', 'success');
      setDeleteFacultyConfirmOpen(false);
      setFacultyToDelete(null);
      refreshData();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Error deleting faculty', 'error');
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

  const openEditStudentModal = (student) => {
    setEditStudentForm({
      name: student.name,
      rollnumber: student.rollnumber,
      phone: student.phone || '',
      section: student.section || '',
      email: student.email,
      courses: student.courses.map(c => c.course._id || c.course),
      _id: student._id
    });
    setEditStudentModalOpen(true);
  };

  const handleEditStudent = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/admin/student/${editStudentForm._id}`, {
        name: editStudentForm.name,
        rollnumber: editStudentForm.rollnumber,
        phone: editStudentForm.phone,
        section: editStudentForm.section,
        courses: editStudentForm.courses
      });
      showNotification('Student updated successfully', 'success');
      setEditStudentModalOpen(false);
      refreshData();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Error updating student', 'error');
    }
  };

  const handleToggleCourse = (courseId) => {
    setEditStudentForm(prev => {
      const courses = [...prev.courses];
      const index = courses.indexOf(courseId);
      if (index > -1) {
        courses.splice(index, 1);
      } else {
        courses.push(courseId);
      }
      return { ...prev, courses };
    });
  };

  const handleAddProfessor = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/professor/add', profForm);
      showNotification('Faculty added successfully', 'success');
      refreshData();
      setProfForm({ name: '', email: '', phone: '', password: '', employeeId: '' });
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
    startDate: null,
    startTime: '12:00 PM',
    endDate: null,
    endTime: '12:00 PM'
  });
  const [startElectionError, setStartElectionError] = useState('');
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    fetchElectionStatus();
  }, []);

  // Live countdown timer
  useEffect(() => {
    if (!electionStatus || electionStatus.status !== 'active' || !electionStatus.endTime) {
      return;
    }

    const updateCountdown = () => {
      const now = new Date().getTime();
      const end = new Date(electionStatus.endTime).getTime();
      const distance = end - now;

      if (distance < 0) {
        setCountdown({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const hours = Math.floor(distance / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setCountdown({ hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [electionStatus]);

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

    if (!startElectionForm.startDate || !startElectionForm.endDate) {
      setStartElectionError('Start date and end date are required');
      return;
    }

    // Combine date and time
    const parseTime = (timeStr) => {
      const [time, period] = timeStr.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      return { hours, minutes };
    };

    const startDateTime = new Date(startElectionForm.startDate);
    const startTimeObj = parseTime(startElectionForm.startTime);
    startDateTime.setHours(startTimeObj.hours, startTimeObj.minutes, 0, 0);

    const endDateTime = new Date(startElectionForm.endDate);
    const endTimeObj = parseTime(startElectionForm.endTime);
    endDateTime.setHours(endTimeObj.hours, endTimeObj.minutes, 0, 0);

    if (endDateTime <= startDateTime) {
      setStartElectionError('End date/time must be after start date/time');
      return;
    }

    try {
      setStartElectionError('');
      const payload = {
        title: startElectionForm.title,
        description: startElectionForm.description,
        startTime: startDateTime,
        endTime: endDateTime
      };
      await api.post('/election/start', payload);
      setStartFormOpen(false);
      setStartElectionForm({ title: '', description: '', startDate: null, startTime: '12:00 PM', endDate: null, endTime: '12:00 PM' });
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
          padding: '40px 48px 20px 24px',
          marginBottom: '40px'
        }}>
          <div className="admin-dashboard-label" style={{
            fontFamily: 'Outfit',
            fontSize: '24px',
            width: '1vw',
            fontWeight: 500,
            // marginBottom: '4px',
            color: '#2B9900',
            letterSpacing: '0.5px',
            marginLeft: '4vw'
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
            marginTop: '-20',
            marginLeft: '4vw'
          }}>
            Welcome back, Admin
          </div>
        </div>

        {/* Tab Navigation Row */}
        <div className="section-selector-wrapper" style={{
          padding: '0 48px 0 24px',
          marginTop: '0',
          marginBottom: '32px',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <div className="section-selector">
            <button
              className={activeTab === 'courses' ? 'active' : ''}
              onClick={() => setActiveTab('courses')}
            >
              Courses
            </button>
            <button
              className={activeTab === 'students' ? 'active' : ''}
              onClick={() => setActiveTab('students')}
            >
              Students
            </button>
            <button
              className={activeTab === 'faculty' ? 'active' : ''}
              onClick={() => setActiveTab('faculty')}
            >
              Faculty
            </button>
            <button
              className={activeTab === 'elections' ? 'active' : ''}
              onClick={() => setActiveTab('elections')}
            >
              Elections
            </button>
            <button
              className={activeTab === 'others' ? 'active' : ''}
              onClick={() => setActiveTab('others')}
            >
              Others
            </button>
            <button
              className={activeTab === 'requests' ? 'active' : ''}
              onClick={() => { setActiveTab('requests'); fetchRequests(); }}
            >
              Requests
            </button>
          </div>
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

        <div className="management-section" style={{ marginTop: 0 }}>
          {/* Verification Requests Tab */}
          {activeTab === 'requests' && (
            <div style={{ maxWidth: '100%', margin: '0 auto', padding: '0 24px 0 48px', marginTop: '5vh' }}>
              <h2 style={{ marginBottom: '24px' }}>Pending Join Requests</h2>
              {requests.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.5)' }}>No pending requests</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                      <th style={{ padding: '16px' }}>Name</th>
                      <th style={{ padding: '16px' }}>Email</th>
                      <th style={{ padding: '16px' }}>Role</th>
                      <th style={{ padding: '16px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map(req => (
                      <tr key={req._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '16px' }}>{req.name}</td>
                        <td style={{ padding: '16px' }}>{req.email}</td>
                        <td style={{ padding: '16px' }}>{req.role}</td>
                        <td style={{ padding: '16px' }}>
                          <button
                            onClick={() => handleRequestAction(req._id, 'approve')}
                            style={{
                              marginRight: '10px',
                              backgroundColor: '#2B9900',
                              color: 'white',
                              border: 'none',
                              padding: '8px 16px',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRequestAction(req._id, 'reject')}
                            style={{
                              backgroundColor: '#ff4444',
                              color: 'white',
                              border: 'none',
                              padding: '8px 16px',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Course Management */}
          {activeTab === 'courses' && (
            <div className="course-container" style={{ maxWidth: '100%', margin: '0 auto', padding: '0 24px 0 48px', marginTop: '5vh' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
                <h2 style={{ margin: 0 }}>Courses</h2>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <img
                      src="/assets/search (5).png"
                      alt="Search"
                      style={{
                        position: 'absolute',
                        left: '14px',
                        width: '18px',
                        height: '18px',
                        opacity: 0.6,
                        pointerEvents: 'none'
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Search here..."
                      value={courseSearchQuery}
                      onChange={(e) => setCourseSearchQuery(e.target.value)}
                      style={{
                        padding: '12px 18px 12px 44px',
                        borderRadius: '999px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: 'white',
                        fontFamily: 'Outfit',
                        fontSize: '14px',
                        outline: 'none',
                        width: '400px',
                        height: '44px',
                        transition: 'all 0.2s ease'
                      }}
                      onFocus={(e) => {
                        e.target.style.border = '1px solid rgba(43, 153, 0, 0.5)';
                        e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                      }}
                      onBlur={(e) => {
                        e.target.style.border = '1px solid rgba(255, 255, 255, 0.2)';
                        e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                      }}
                    />
                  </div>
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
              </div>
              {data.courses.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  color: 'rgba(255, 255, 255, 0.4)'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '20px' }}>📚</div>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '500',
                    marginBottom: '8px',
                    color: 'rgba(255, 255, 255, 0.65)'
                  }}>
                    No courses yet
                  </div>
                  <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.4)' }}>
                    {data.professors.length === 0
                      ? 'Add faculty members first, then create courses'
                      : 'Click "+ Add Course" above to create your first course'
                    }
                  </div>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '28px',
                  paddingTop: '8px'
                }}>
                  {data.courses
                    .filter(course => {
                      const query = courseSearchQuery.toLowerCase();
                      const courseName = course.name.toLowerCase();
                      const professorName = (course.professor?.name || '').toLowerCase();
                      const courseAcronym = getCourseAcronym(course.name).toLowerCase();
                      return courseName.includes(query) || professorName.includes(query) || courseAcronym.includes(query);
                    })
                    .map(course => (
                      <div
                        key={course._id}
                        className="course-card"
                        onClick={(e) => {
                          // Don't navigate if clicking on buttons
                          if (!e.target.closest('button')) {
                            navigate(`/course/${course._id}`);
                          }
                        }}
                        style={{
                          position: 'relative',
                          background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
                          borderRadius: '18px',
                          padding: '24px',
                          paddingBottom: '72px',
                          minHeight: '200px',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                          transition: 'all 0.3s ease',
                          cursor: 'pointer',
                          border: '1px solid rgba(255, 255, 255, 0.08)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-4px)';
                          e.currentTarget.style.boxShadow = '0 16px 40px rgba(0, 0, 0, 0.35)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                        }}
                      >
                        {/* Action Buttons */}
                        <div style={{
                          position: 'absolute',
                          top: '14px',
                          right: '14px',
                          display: 'flex',
                          gap: '8px',
                          zIndex: 10
                        }}>
                          <button
                            type="button"
                            onClick={() => openEditModal(course)}
                            aria-label="Edit course"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '6px',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.15)';
                              e.currentTarget.style.background = 'rgba(43, 153, 0, 0.1)';
                              setHoveredIcon({ courseId: course._id, type: 'edit' });
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)';
                              e.currentTarget.style.background = 'transparent';
                              setHoveredIcon({ courseId: null, type: null });
                            }}
                          >
                            <img
                              src={hoveredIcon.courseId === course._id && hoveredIcon.type === 'edit'
                                ? '/assets/edithover.png'
                                : '/assets/edit-text 2.png'
                              }
                              alt="Edit"
                              style={{ width: '20px', height: '20px', opacity: 0.9 }}
                            />
                          </button>
                          <button
                            type="button"
                            onClick={() => openDeleteConfirm(course)}
                            aria-label="Delete course"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '6px',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.15)';
                              e.currentTarget.style.background = 'rgba(255, 68, 68, 0.1)';
                              setHoveredIcon({ courseId: course._id, type: 'delete' });
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)';
                              e.currentTarget.style.background = 'transparent';
                              setHoveredIcon({ courseId: null, type: null });
                            }}
                          >
                            <img
                              src={hoveredIcon.courseId === course._id && hoveredIcon.type === 'delete'
                                ? '/assets/delete-pfp-hover.png'
                                : '/assets/delete-pfp.png'
                              }
                              alt="Delete"
                              style={{ width: '20px', height: '20px', opacity: 0.9 }}
                            />
                          </button>
                        </div>

                        {/* Course Content */}
                        <div
                          className="course-content"
                          style={{
                            paddingRight: '36px',
                            maxWidth: '70%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start'
                          }}
                        >
                          <h3
                            className="course-title"
                            style={{
                              fontSize: '32px',
                              fontWeight: '600',
                              letterSpacing: '0.5px',
                              color: '#ffffff',
                              margin: '0',
                              lineHeight: '1.15',
                              cursor: 'help'
                            }}
                            title={course.name}
                          >
                            {getCourseAcronym(course.name)}
                          </h3>

                          <div
                            className="course-section"
                            style={{
                              marginTop: '0px',
                              fontSize: '18px',
                              fontWeight: '400',
                              color: 'rgba(255, 255, 255, 0.35)',
                              textAlign: 'left'
                            }}
                          >
                            Section {course.section}
                          </div>

                          <div
                            className="course-professor"
                            style={{
                              marginTop: '18px',
                              fontSize: '15px',
                              color: 'rgba(255, 255, 255, 0.55)',
                              fontWeight: '500'
                            }}
                          >
                            Professor: <span style={{ fontWeight: '600', color: 'rgba(255, 255, 255, 0.9)' }}>{course.professor?.name || 'Unassigned'}</span>
                          </div>
                        </div>

                        {/* Pinned Attributes */}
                        <div className="course-attributes" style={{
                          position: 'absolute',
                          bottom: '20px',
                          left: '24px',
                          right: '24px',
                          display: 'flex',
                          gap: '12px',
                          flexWrap: 'wrap'
                        }}>
                          <div className="course-attribute" style={{
                            padding: '7px 14px',
                            borderRadius: '999px',
                            fontSize: '13px',
                            fontWeight: '600',
                            background: 'rgba(43, 153, 0, 0.18)',
                            color: '#9BEF7C',
                            border: '1px solid rgba(43, 153, 0, 0.35)',
                            whiteSpace: 'nowrap'
                          }}>
                            Credits: {course.credits || 'N/A'}
                          </div>
                          <div className="course-attribute" style={{
                            padding: '7px 14px',
                            borderRadius: '999px',
                            fontSize: '13px',
                            fontWeight: '600',
                            background: 'rgba(43, 153, 0, 0.18)',
                            color: '#9BEF7C',
                            border: '1px solid rgba(43, 153, 0, 0.35)',
                            whiteSpace: 'nowrap'
                          }}>
                            Classes: {course.totalclasses || 'N/A'}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Student Management */}
          {activeTab === 'students' && (
            <div className="student-container" style={{ maxWidth: '100%', margin: '0 auto', padding: '0 24px 0 48px', marginTop: '5vh' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
                <h2 style={{ margin: 0 }}>Students</h2>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <img
                      src="/assets/search (5).png"
                      alt="Search"
                      style={{
                        position: 'absolute',
                        left: '14px',
                        width: '18px',
                        height: '18px',
                        opacity: 0.6,
                        pointerEvents: 'none'
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Search here..."
                      value={studentSearchQuery}
                      onChange={(e) => setStudentSearchQuery(e.target.value)}
                      style={{
                        padding: '12px 18px 12px 44px',
                        borderRadius: '999px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: 'white',
                        fontFamily: 'Outfit',
                        fontSize: '14px',
                        outline: 'none',
                        width: '400px',
                        height: '44px',
                        transition: 'all 0.2s ease'
                      }}
                      onFocus={(e) => {
                        e.target.style.border = '1px solid rgba(43, 153, 0, 0.5)';
                        e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                      }}
                      onBlur={(e) => {
                        e.target.style.border = '1px solid rgba(255, 255, 255, 0.2)';
                        e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setAddStudentModalOpen(true)}
                    style={{ background: '#2B9900', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'Outfit', fontWeight: 600 }}
                  >
                    + Add Student
                  </button>
                </div>
              </div>
              {data.students.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  color: 'rgba(255, 255, 255, 0.4)'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '20px' }}>👨‍🎓</div>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '500',
                    marginBottom: '8px',
                    color: 'rgba(255, 255, 255, 0.65)'
                  }}>
                    No students yet
                  </div>
                  <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.4)' }}>
                    Click "+ Add Student" above to add your first student
                  </div>
                </div>
              ) : (
                <div className="student-table-wrapper" style={{
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  maxHeight: '420px',
                  overflowY: 'auto',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}>
                  <table className="student-table" style={{
                    width: '100%',
                    borderCollapse: 'collapse'
                  }}>
                    <thead>
                      <tr>
                        <th style={{
                          textAlign: 'left',
                          fontSize: '13px',
                          fontWeight: '600',
                          padding: '12px 16px',
                          color: 'rgba(255, 255, 255, 0.8)',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                          background: 'rgba(255,255,255,0.03)',
                          position: 'sticky',
                          top: 0,
                          zIndex: 1
                        }}></th>
                        <th style={{
                          textAlign: 'left',
                          fontSize: '13px',
                          fontWeight: '600',
                          padding: '12px 16px',
                          color: 'rgba(255, 255, 255, 0.8)',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                          background: 'rgba(255,255,255,0.03)',
                          position: 'sticky',
                          top: 0,
                          zIndex: 1
                        }}>Name</th>
                        <th style={{
                          textAlign: 'center',
                          fontSize: '13px',
                          fontWeight: '600',
                          padding: '12px 16px',
                          color: 'rgba(255, 255, 255, 0.8)',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                          background: 'rgba(255,255,255,0.03)',
                          position: 'sticky',
                          top: 0,
                          zIndex: 1
                        }}>Roll No.</th>
                        <th style={{
                          textAlign: 'center',
                          fontSize: '13px',
                          fontWeight: '600',
                          padding: '12px 16px',
                          color: 'rgba(255, 255, 255, 0.8)',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                          background: 'rgba(255,255,255,0.03)',
                          position: 'sticky',
                          top: 0,
                          zIndex: 1
                        }}>Year of Study</th>
                        <th style={{
                          textAlign: 'left',
                          fontSize: '13px',
                          fontWeight: '600',
                          padding: '12px 16px',
                          color: 'rgba(255, 255, 255, 0.8)',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                          background: 'rgba(255,255,255,0.03)',
                          position: 'sticky',
                          top: 0,
                          zIndex: 1
                        }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.students
                        .filter(student => {
                          const query = studentSearchQuery.toLowerCase();
                          const studentName = student.name.toLowerCase();
                          const studentEmail = (student.email || '').toLowerCase();
                          const rollNumber = (student.rollnumber || '').toLowerCase();
                          return studentName.includes(query) || studentEmail.includes(query) || rollNumber.includes(query);
                        })
                        .map((student, index) => (
                          <tr key={student._id} style={{
                            transition: 'background 0.2s ease',
                            cursor: 'pointer'
                          }}
                            onClick={(e) => {
                              // Don't navigate if clicking on buttons
                              if (!e.target.closest('button')) {
                                navigate(`/student/${student._id}`);
                              }
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            <td className="student-index" style={{
                              padding: '14px 16px',
                              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                              fontSize: '14px',
                              color: 'rgba(255, 255, 255, 0.5)',
                              width: '60px'
                            }}>
                              {index + 1}
                            </td>

                            <td className="student-name-cell" style={{
                              padding: '14px 16px',
                              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                              fontSize: '14px'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div className="student-avatar" style={{
                                  width: '36px',
                                  height: '36px',
                                  borderRadius: '50%',
                                  border: '2px solid rgba(255, 255, 255, 0.3)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                  background: 'rgba(255, 255, 255, 0.9)'
                                }}>
                                </div>
                                <div>
                                  <div className="student-name" style={{
                                    fontWeight: '600',
                                    fontSize: '14px',
                                    color: '#ffffff',
                                    marginBottom: '2px'
                                  }}>
                                    {student.name}
                                  </div>
                                  <div className="student-email" style={{
                                    fontSize: '12px',
                                    color: 'rgba(255, 255, 255, 0.55)'
                                  }}>
                                    {student.email}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td style={{
                              padding: '14px 16px',
                              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                              fontSize: '14px',
                              color: 'rgba(255, 255, 255, 0.8)',
                              textAlign: 'center'
                            }}>
                              {student.rollnumber}
                            </td>

                            <td style={{
                              padding: '14px 16px',
                              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                              fontSize: '14px',
                              color: 'rgba(255, 255, 255, 0.8)',
                              textAlign: 'center'
                            }}>
                              {student.ug || 'N/A'}
                            </td>

                            <td className="student-actions" style={{
                              padding: '14px 16px',
                              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                              fontSize: '14px'
                            }}>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    openEditStudentModal(student);
                                  }}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '6px',
                                    borderRadius: '6px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s ease'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'scale(1.15)';
                                    e.currentTarget.style.background = 'rgba(43, 153, 0, 0.1)';
                                    setHoveredIcon({ courseId: student._id, type: 'edit' });
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'scale(1)';
                                    e.currentTarget.style.background = 'transparent';
                                    setHoveredIcon({ courseId: null, type: null });
                                  }}
                                >
                                  <img
                                    src={hoveredIcon.courseId === student._id && hoveredIcon.type === 'edit'
                                      ? '/assets/edithover.png'
                                      : '/assets/edit-text 2.png'
                                    }
                                    alt="Edit"
                                    style={{ width: '20px', height: '20px', opacity: 0.9 }}
                                  />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openDeleteStudentConfirm(student)}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '6px',
                                    borderRadius: '6px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s ease'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'scale(1.15)';
                                    e.currentTarget.style.background = 'rgba(255, 68, 68, 0.1)';
                                    setHoveredIcon({ courseId: student._id, type: 'delete' });
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'scale(1)';
                                    e.currentTarget.style.background = 'transparent';
                                    setHoveredIcon({ courseId: null, type: null });
                                  }}
                                >
                                  <img
                                    src={hoveredIcon.courseId === student._id && hoveredIcon.type === 'delete'
                                      ? '/assets/delete-pfp-hover.png'
                                      : '/assets/delete-pfp.png'
                                    }
                                    alt="Delete"
                                    style={{ width: '20px', height: '20px', opacity: 0.9 }}
                                  />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Professor Management */}
          {activeTab === 'faculty' && (
            <div className="professor-container" style={{ maxWidth: '100%', margin: '0 auto', padding: '0 24px 0 48px', marginTop: '5vh' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
                <h2 style={{ margin: 0 }}>Faculty</h2>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <img
                      src="/assets/search (5).png"
                      alt="Search"
                      style={{
                        position: 'absolute',
                        left: '14px',
                        width: '18px',
                        height: '18px',
                        opacity: 0.6,
                        pointerEvents: 'none'
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Search here..."
                      value={facultySearchQuery}
                      onChange={(e) => setFacultySearchQuery(e.target.value)}
                      style={{
                        padding: '12px 18px 12px 44px',
                        borderRadius: '999px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: 'white',
                        fontFamily: 'Outfit',
                        fontSize: '14px',
                        outline: 'none',
                        width: '400px',
                        height: '44px',
                        transition: 'all 0.2s ease'
                      }}
                      onFocus={(e) => {
                        e.target.style.border = '1px solid rgba(43, 153, 0, 0.5)';
                        e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                      }}
                      onBlur={(e) => {
                        e.target.style.border = '1px solid rgba(255, 255, 255, 0.2)';
                        e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setAddFacultyModalOpen(true)}
                    style={{
                      background: '#2B9900',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontFamily: 'Outfit',
                      fontWeight: 600
                    }}
                  >
                    + Add Faculty
                  </button>
                </div>
              </div>
              {data.professors.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  color: 'rgba(255, 255, 255, 0.4)'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '20px' }}>👨‍🏫</div>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '500',
                    marginBottom: '8px',
                    color: 'rgba(255, 255, 255, 0.65)'
                  }}>
                    No faculty yet
                  </div>
                  <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.4)' }}>
                    Click "+ Add Faculty" above to add your first faculty member
                  </div>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))',
                  gap: '28px',
                  paddingTop: '8px'
                }}>
                  {data.professors
                    .filter(faculty => {
                      const query = facultySearchQuery.toLowerCase();
                      const facultyName = faculty.name.toLowerCase();
                      const facultyEmail = (faculty.email || '').toLowerCase();
                      return facultyName.includes(query) || facultyEmail.includes(query);
                    })
                    .map(faculty => (
                      <div
                        key={faculty._id}
                        className="faculty-card"
                        style={{
                          position: 'relative',
                          background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
                          borderRadius: '18px',
                          padding: '20px',
                          paddingBottom: '20px',
                          minHeight: '140px',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                          transition: 'all 0.3s ease',
                          cursor: 'default',
                          border: '1px solid rgba(255, 255, 255, 0.08)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-4px)';
                          e.currentTarget.style.boxShadow = '0 16px 40px rgba(0, 0, 0, 0.35)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                        }}
                      >
                        {/* Action Buttons */}
                        <div style={{
                          position: 'absolute',
                          top: '14px',
                          right: '14px',
                          display: 'flex',
                          gap: '8px',
                          zIndex: 10
                        }}>
                          <button
                            type="button"
                            onClick={() => openEditFacultyModal(faculty)}
                            aria-label="Edit faculty"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '6px',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.15)';
                              e.currentTarget.style.background = 'rgba(43, 153, 0, 0.1)';
                              setHoveredIcon({ courseId: faculty._id, type: 'edit' });
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)';
                              e.currentTarget.style.background = 'transparent';
                              setHoveredIcon({ courseId: null, type: null });
                            }}
                          >
                            <img
                              src={hoveredIcon.courseId === faculty._id && hoveredIcon.type === 'edit'
                                ? '/assets/edithover.png'
                                : '/assets/edit-text 2.png'
                              }
                              alt="Edit"
                              style={{ width: '20px', height: '20px', opacity: 0.9 }}
                            />
                          </button>
                          <button
                            type="button"
                            onClick={() => openDeleteFacultyConfirm(faculty)}
                            aria-label="Delete faculty"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '6px',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.15)';
                              e.currentTarget.style.background = 'rgba(255, 68, 68, 0.1)';
                              setHoveredIcon({ courseId: faculty._id, type: 'delete' });
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)';
                              e.currentTarget.style.background = 'transparent';
                              setHoveredIcon({ courseId: null, type: null });
                            }}
                          >
                            <img
                              src={hoveredIcon.courseId === faculty._id && hoveredIcon.type === 'delete'
                                ? '/assets/delete-pfp-hover.png'
                                : '/assets/delete-pfp.png'
                              }
                              alt="Delete"
                              style={{ width: '20px', height: '20px', opacity: 0.9 }}
                            />
                          </button>
                        </div>

                        {/* Faculty Card Content */}
                        <div
                          className="faculty-card-content"
                          style={{
                            display: 'flex',
                            gap: '20px',
                            alignItems: 'flex-end',
                            height: '100%'
                          }}
                        >
                          {/* Avatar */}
                          <div
                            className="faculty-avatar"
                            style={{
                              width: '96px',
                              height: '100%',
                              borderRadius: '14px',
                              background: 'rgba(255,255,255,0.9)',
                              flexShrink: 0
                            }}
                          />

                          {/* Text */}
                          <div
                            className="faculty-text"
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'flex-end',
                              paddingBottom: '4px'
                            }}
                          >
                            <div
                              style={{
                                fontSize: '22px',
                                fontWeight: '600',
                                color: '#ffffff'
                              }}
                            >
                              {faculty.name}
                            </div>

                            <div
                              style={{
                                marginTop: '4px',
                                fontSize: '14px',
                                color: 'rgba(255,255,255,0.55)'
                              }}
                            >
                              {faculty.email}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Election Management */}
          {activeTab === 'elections' && (
            <div className="course-container" style={{ maxWidth: '100%', padding: '0 24px 0 48px', marginTop: '5vh' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
                <h2 style={{ margin: 0 }}>Elections</h2>
              </div>

              {!electionStatus ? (
                // No election state - 2-column layout
                <div className="elections-grid" style={{
                  display: 'grid',
                  gridTemplateColumns: '35% 1fr',
                  gap: '28px',
                  alignItems: 'start'
                }}>
                  {/* Left: Status Card */}
                  <div style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
                    borderRadius: '16px',
                    padding: '32px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    minHeight: '400px'
                  }}>
                    <div style={{ fontSize: '56px', marginBottom: '24px' }}>🗳️</div>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      marginBottom: '12px',
                      color: 'rgba(255, 255, 255, 0.65)'
                    }}>
                      No election currently running
                    </div>
                    <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.4)', marginBottom: '32px' }}>
                      Create a new election to begin accepting nominations and votes
                    </div>
                    <button
                      onClick={handleStartElection}
                      style={{
                        background: '#2B9900',
                        color: 'white',
                        border: 'none',
                        padding: '14px 32px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontFamily: 'Outfit',
                        fontWeight: 600,
                        fontSize: '15px',
                        transition: 'all 0.2s ease',
                        width: '100%',
                        maxWidth: '220px'
                      }}
                      onMouseEnter={(e) => e.target.style.background = '#248000'}
                      onMouseLeave={(e) => e.target.style.background = '#2B9900'}
                    >
                      Start Election
                    </button>
                  </div>

                  {/* Right: Disabled Candidates Area */}
                  <div style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
                    borderRadius: '16px',
                    padding: '32px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    opacity: 0.5
                  }}>
                    <div>
                      <div style={{ fontSize: '48px', marginBottom: '16px' }}>👤</div>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: '500',
                        color: 'rgba(255, 255, 255, 0.5)'
                      }}>
                        Candidates section
                      </div>
                      <div style={{ fontSize: '14px', marginTop: '8px', color: 'rgba(255, 255, 255, 0.3)' }}>
                        Available once election starts
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Active/Ended election - 2-column layout
                <div className="elections-grid" style={{
                  display: 'grid',
                  gridTemplateColumns: '35% 1fr',
                  gap: '28px',
                  alignItems: 'start'
                }}>
                  {/* LEFT COLUMN: Status Card */}
                  <div style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
                    borderRadius: '16px',
                    padding: '32px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    height: 'fit-content',
                    position: 'sticky',
                    top: '20px'
                  }}>
                    {/* Status */}
                    <div style={{ marginBottom: '24px' }}>
                      <div style={{
                        fontSize: '11px',
                        color: 'rgba(255, 255, 255, 0.5)',
                        marginBottom: '8px',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        fontWeight: '600'
                      }}>
                        Election Status
                      </div>
                      <div style={{
                        fontSize: '32px',
                        fontWeight: '700',
                        color: electionStatus?.status === 'active' ? '#2B9900' : '#ff4444',
                        letterSpacing: '0.5px'
                      }}>
                        {electionStatus?.status === 'active' ? 'ACTIVE' : 'ENDED'}
                      </div>
                    </div>

                    {/* Divider */}
                    <div style={{
                      height: '1px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      marginBottom: '24px'
                    }} />

                    {/* Start Time */}
                    <div style={{ marginBottom: '20px' }}>
                      <div style={{
                        fontSize: '11px',
                        color: 'rgba(255, 255, 255, 0.5)',
                        marginBottom: '8px',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        fontWeight: '600'
                      }}>
                        Started
                      </div>
                      <div style={{
                        fontSize: '15px',
                        fontWeight: '500',
                        color: 'rgba(255, 255, 255, 0.9)',
                        lineHeight: '1.5'
                      }}>
                        {electionStatus?.startTime ? new Date(electionStatus.startTime).toLocaleString('en-US', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }).replace(',', ' •') : 'N/A'}
                      </div>
                    </div>

                    {/* End Time */}
                    <div style={{ marginBottom: '24px' }}>
                      <div style={{
                        fontSize: '11px',
                        color: 'rgba(255, 255, 255, 0.5)',
                        marginBottom: '8px',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        fontWeight: '600'
                      }}>
                        Ends
                      </div>
                      <div style={{
                        fontSize: '15px',
                        fontWeight: '500',
                        color: 'rgba(255, 255, 255, 0.9)',
                        lineHeight: '1.5'
                      }}>
                        {electionStatus?.endTime ? new Date(electionStatus.endTime).toLocaleString('en-US', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }).replace(',', ' •') : 'N/A'}
                      </div>
                    </div>

                    {/* Live Countdown */}
                    {electionStatus?.status === 'active' && (
                      <>
                        <div style={{
                          height: '1px',
                          background: 'rgba(255, 255, 255, 0.08)',
                          marginBottom: '24px'
                        }} />
                        <div style={{ marginBottom: '32px' }}>
                          <div style={{
                            fontSize: '11px',
                            color: 'rgba(255, 255, 255, 0.5)',
                            marginBottom: '12px',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            fontWeight: '600'
                          }}>
                            Time Remaining
                          </div>
                          <div style={{
                            fontSize: '36px',
                            fontWeight: '700',
                            color: '#2B9900',
                            fontFamily: 'monospace',
                            letterSpacing: '2px',
                            textAlign: 'center',
                            padding: '16px',
                            background: 'rgba(43, 153, 0, 0.08)',
                            borderRadius: '8px',
                            border: '1px solid rgba(43, 153, 0, 0.2)'
                          }}>
                            {String(countdown.hours).padStart(2, '0')}:{String(countdown.minutes).padStart(2, '0')}:{String(countdown.seconds).padStart(2, '0')}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Action Button at Bottom */}
                    <div style={{ marginTop: 'auto', paddingTop: '24px' }}>
                      {electionStatus?.status === 'active' ? (
                        <button
                          onClick={handleStopElection}
                          style={{
                            background: '#ff4444',
                            color: 'white',
                            border: 'none',
                            padding: '14px 24px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontFamily: 'Outfit',
                            fontWeight: 600,
                            fontSize: '14px',
                            transition: 'all 0.2s ease',
                            width: '100%'
                          }}
                          onMouseEnter={(e) => e.target.style.background = '#e63939'}
                          onMouseLeave={(e) => e.target.style.background = '#ff4444'}
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
                            padding: '14px 24px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontFamily: 'Outfit',
                            fontWeight: 600,
                            fontSize: '14px',
                            transition: 'all 0.2s ease',
                            width: '100%'
                          }}
                          onMouseEnter={(e) => e.target.style.background = '#248000'}
                          onMouseLeave={(e) => e.target.style.background = '#2B9900'}
                        >
                          Start New Election
                        </button>
                      )}
                    </div>
                  </div>

                  {/* RIGHT COLUMN: Candidates Section */}
                  <div>
                    {electionStatus?.status === 'active' ? (
                      <>
                        {/* Header */}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '24px'
                        }}>
                          <h3 style={{
                            margin: 0,
                            fontSize: '20px',
                            fontWeight: '600',
                            color: 'rgba(255, 255, 255, 0.95)'
                          }}>
                            Candidates
                          </h3>
                          <button
                            type="button"
                            onClick={() => setNominateModalOpen(true)}
                            style={{
                              background: '#2B9900',
                              color: 'white',
                              border: 'none',
                              padding: '10px 20px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontFamily: 'Outfit',
                              fontWeight: 600,
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.target.style.background = '#248000'}
                            onMouseLeave={(e) => e.target.style.background = '#2B9900'}
                          >
                            Nominate Candidate
                          </button>
                        </div>

                        {electionCandidates.length === 0 ? (
                          <div style={{
                            textAlign: 'center',
                            padding: '80px 20px',
                            color: 'rgba(255, 255, 255, 0.4)',
                            background: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
                            borderRadius: '12px',
                            border: '1px solid rgba(255, 255, 255, 0.08)'
                          }}>
                            <div style={{ fontSize: '56px', marginBottom: '20px' }}>👤</div>
                            <div style={{
                              fontSize: '18px',
                              fontWeight: '500',
                              color: 'rgba(255, 255, 255, 0.6)',
                              marginBottom: '8px'
                            }}>
                              No candidates yet
                            </div>
                            <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.4)' }}>
                              Click "Nominate Candidate" to add candidates
                            </div>
                          </div>
                        ) : (
                          <div>
                            {electionRoles.map(role => {
                              const candidatesForRole = electionCandidates.filter(c => c.role === role);
                              if (candidatesForRole.length === 0) return null;

                              // Calculate total votes for this role
                              const totalVotesForRole = candidatesForRole.reduce((sum, c) => sum + (c.voteCount || 0), 0);

                              return (
                                <div key={role} style={{ marginBottom: '40px' }}>
                                  {/* Role Title */}
                                  <div style={{
                                    fontSize: '13px',
                                    fontWeight: '700',
                                    color: '#2B9900',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1.2px',
                                    marginBottom: '4px'
                                  }}>
                                    {role}
                                  </div>
                                  <div style={{
                                    height: '2px',
                                    background: 'linear-gradient(90deg, #2B9900 0%, rgba(43, 153, 0, 0.2) 100%)',
                                    marginBottom: '16px',
                                    width: '100%'
                                  }} />

                                  {/* Candidate Cards */}
                                  <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                                    gap: '20px',
                                    paddingBottom: '12px'
                                  }}>
                                    {candidatesForRole.map(candidate => {
                                      const votePercentage = totalVotesForRole > 0 ? (candidate.voteCount / totalVotesForRole) * 100 : 0;

                                      return (
                                        <div
                                          key={candidate._id}
                                          style={{
                                            position: 'relative',
                                            background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
                                            borderRadius: '18px',
                                            padding: '20px',
                                            paddingBottom: '60px',
                                            minHeight: '180px',
                                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                                            transition: 'all 0.3s ease',
                                            cursor: 'default',
                                            border: '1px solid rgba(255, 255, 255, 0.08)'
                                          }}
                                          onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-4px)';
                                            e.currentTarget.style.boxShadow = '0 16px 40px rgba(0, 0, 0, 0.35)';
                                          }}
                                          onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                                          }}
                                        >
                                          {/* Delete Button */}
                                          {user?.role === 'Admin' && (
                                            <div style={{
                                              position: 'absolute',
                                              top: '14px',
                                              right: '14px',
                                              display: 'flex',
                                              gap: '8px',
                                              zIndex: 10
                                            }}>
                                              <button
                                                type="button"
                                                onClick={() => handleRemoveCandidate(candidate._id)}
                                                aria-label="Delete candidate"
                                                style={{
                                                  background: 'transparent',
                                                  border: 'none',
                                                  cursor: 'pointer',
                                                  padding: '6px',
                                                  borderRadius: '6px',
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  justifyContent: 'center',
                                                  transition: 'all 0.2s ease'
                                                }}
                                                onMouseEnter={(e) => {
                                                  e.currentTarget.style.transform = 'scale(1.15)';
                                                  e.currentTarget.style.background = 'rgba(255, 68, 68, 0.1)';
                                                  setHoveredIcon({ courseId: candidate._id, type: 'delete' });
                                                }}
                                                onMouseLeave={(e) => {
                                                  e.currentTarget.style.transform = 'scale(1)';
                                                  e.currentTarget.style.background = 'transparent';
                                                  setHoveredIcon({ courseId: null, type: null });
                                                }}
                                              >
                                                <img
                                                  src={hoveredIcon.courseId === candidate._id && hoveredIcon.type === 'delete'
                                                    ? '/assets/delete-pfp-hover.png'
                                                    : '/assets/delete-pfp.png'
                                                  }
                                                  alt="Delete"
                                                  style={{ width: '20px', height: '20px', opacity: 0.9 }}
                                                />
                                              </button>
                                            </div>
                                          )}

                                          {/* Profile Picture */}
                                          <div style={{
                                            width: '72px',
                                            height: '72px',
                                            borderRadius: '50%',
                                            background: 'rgba(255, 255, 255, 0.9)',
                                            border: '2px solid rgba(255, 255, 255, 0.3)',
                                            marginBottom: '16px'
                                          }} />

                                          {/* Name and Vote Count Row */}
                                          <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginBottom: '8px',
                                            gap: '12px'
                                          }}>
                                            {/* Name */}
                                            <div style={{
                                              fontSize: '18px',
                                              fontWeight: '600',
                                              color: '#ffffff',
                                              lineHeight: '1.3',
                                              wordBreak: 'break-word',
                                              flex: 1
                                            }}>
                                              {candidate.name}
                                            </div>

                                            {/* Vote Count Box */}
                                            <div style={{
                                              padding: '4px 10px',
                                              borderRadius: '6px',
                                              fontSize: '12px',
                                              fontWeight: '600',
                                              color: '#2B9900',
                                              background: 'rgba(43, 153, 0, 0.15)',
                                              border: '1px solid rgba(43, 153, 0, 0.3)',
                                              whiteSpace: 'nowrap'
                                            }}>
                                              {candidate.voteCount || 0} Votes
                                            </div>
                                          </div>

                                          {/* Progress Bar - Positioned at bottom */}
                                          <div style={{
                                            position: 'absolute',
                                            bottom: '24px',
                                            left: '24px',
                                            right: '24px'
                                          }}>
                                            <div style={{
                                              width: '100%',
                                              height: '8px',
                                              background: 'rgba(255, 255, 255, 0.08)',
                                              borderRadius: '4px',
                                              overflow: 'hidden'
                                            }}>
                                              <div style={{
                                                width: `${votePercentage}%`,
                                                height: '100%',
                                                background: 'linear-gradient(90deg, #2B9900, #3db300)',
                                                borderRadius: '4px',
                                                transition: 'width 0.5s ease'
                                              }} />
                                            </div>

                                            {/* Percentage Label */}
                                            <div style={{
                                              fontSize: '11px',
                                              color: 'rgba(255, 255, 255, 0.5)',
                                              marginTop: '6px',
                                              textAlign: 'right',
                                              fontWeight: '600'
                                            }}>
                                              {votePercentage.toFixed(1)}%
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </>
                    ) : (
                      // Election ended - show message
                      <div style={{
                        textAlign: 'center',
                        padding: '80px 20px',
                        color: 'rgba(255, 255, 255, 0.4)',
                        background: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.08)'
                      }}>
                        <div style={{ fontSize: '56px', marginBottom: '20px' }}>🏁</div>
                        <div style={{
                          fontSize: '18px',
                          fontWeight: '500',
                          color: 'rgba(255, 255, 255, 0.6)',
                          marginBottom: '8px'
                        }}>
                          Election has ended
                        </div>
                        <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.4)' }}>
                          Start a new election to view candidates
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Others Section - Noticeboard, Banner, and Ads Management */}
          {activeTab === 'others' && (
            <div className="course-container" style={{ maxWidth: '100%', padding: '0 24px 0 48px', marginTop: '5vh' }}>
              <h2 style={{ marginBottom: '32px' }}>Content Management</h2>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                gap: '24px'
              }}>
                {/* Noticeboard Management */}
                <div style={{
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
                  borderRadius: '16px',
                  padding: '28px',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '20px'
                  }}>
                    <div style={{ fontSize: '28px' }}>📋</div>
                    <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Noticeboard</h3>
                  </div>
                  <p style={{
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: '14px',
                    marginBottom: '20px'
                  }}>
                    Update important notices visible to all students
                  </p>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const noticeText = formData.get('noticeText');
                    // This will be implemented via backend
                    showNotification('Noticeboard update feature coming soon!', 'success');
                  }}>
                    <textarea
                      name="noticeText"
                      placeholder="Enter notice text..."
                      style={{
                        width: '100%',
                        height: '120px',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: 'white',
                        fontFamily: 'Outfit',
                        fontSize: '14px',
                        resize: 'vertical',
                        marginBottom: '16px'
                      }}
                      required
                    />
                    <button
                      type="submit"
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: 'none',
                        background: '#2B9900',
                        color: 'white',
                        fontFamily: 'Outfit',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.target.style.background = '#248000'}
                      onMouseLeave={(e) => e.target.style.background = '#2B9900'}
                    >
                      Update Notice
                    </button>
                  </form>
                </div>

                {/* Banner Management */}
                <div style={{
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
                  borderRadius: '16px',
                  padding: '28px',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '20px'
                  }}>
                    <div style={{ fontSize: '28px' }}>🖼️</div>
                    <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Dashboard Banner</h3>
                  </div>
                  <p style={{
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: '14px',
                    marginBottom: '20px'
                  }}>
                    Change the banner image on student dashboard
                  </p>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    showNotification('Banner update feature coming soon!', 'success');
                  }}>
                    <input
                      type="file"
                      accept="image/*"
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: 'white',
                        fontFamily: 'Outfit',
                        fontSize: '14px',
                        marginBottom: '16px'
                      }}
                      required
                    />
                    <button
                      type="submit"
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: 'none',
                        background: '#2B9900',
                        color: 'white',
                        fontFamily: 'Outfit',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.target.style.background = '#248000'}
                      onMouseLeave={(e) => e.target.style.background = '#2B9900'}
                    >
                      Upload Banner
                    </button>
                  </form>
                </div>

                {/* Ads Management */}
                <div style={{
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
                  borderRadius: '16px',
                  padding: '28px',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '20px'
                  }}>
                    <div style={{ fontSize: '28px' }}>📢</div>
                    <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Advertisement Section</h3>
                  </div>
                  <p style={{
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: '14px',
                    marginBottom: '20px'
                  }}>
                    Upload videos, images, or GIFs for the ad section
                  </p>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    showNotification('Ad upload feature coming soon!', 'success');
                  }}>
                    <select
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: 'white',
                        fontFamily: 'Outfit',
                        fontSize: '14px',
                        marginBottom: '12px'
                      }}
                    >
                      <option value="image">Image (PNG/JPG/GIF)</option>
                      <option value="video">Video (MP4)</option>
                    </select>
                    <input
                      type="file"
                      accept="image/*,video/mp4"
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: 'white',
                        fontFamily: 'Outfit',
                        fontSize: '14px',
                        marginBottom: '16px'
                      }}
                      required
                    />
                    <button
                      type="submit"
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: 'none',
                        background: '#2B9900',
                        color: 'white',
                        fontFamily: 'Outfit',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.target.style.background = '#248000'}
                      onMouseLeave={(e) => e.target.style.background = '#2B9900'}
                    >
                      Upload Ad
                    </button>
                  </form>
                </div>
              </div>
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

                <label>Start Date</label>
                <DatePicker
                  selected={startElectionForm.startDate}
                  onChange={(date) => setStartElectionForm({ ...startElectionForm, startDate: date })}
                  dateFormat="yyyy-MM-dd"
                  className="admin-datepicker"
                  required
                  placeholderText="Select start date"
                />

                <label>Start Time</label>
                <select
                  value={startElectionForm.startTime}
                  onChange={(e) => setStartElectionForm({ ...startElectionForm, startTime: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: 'white',
                    fontFamily: 'Outfit',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                >
                  <option value="12:00 AM">12:00 AM</option>
                  <option value="12:00 PM">12:00 PM</option>
                  <option value="6:00 PM">6:00 PM</option>
                </select>

                <label>End Date</label>
                <DatePicker
                  selected={startElectionForm.endDate}
                  onChange={(date) => setStartElectionForm({ ...startElectionForm, endDate: date })}
                  dateFormat="yyyy-MM-dd"
                  className="admin-datepicker"
                  required
                  minDate={startElectionForm.startDate}
                  placeholderText="Select end date"
                />

                <label>End Time</label>
                <select
                  value={startElectionForm.endTime}
                  onChange={(e) => setStartElectionForm({ ...startElectionForm, endTime: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: 'white',
                    fontFamily: 'Outfit',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                >
                  <option value="12:00 AM">12:00 AM</option>
                  <option value="12:00 PM">12:00 PM</option>
                  <option value="6:00 PM">6:00 PM</option>
                </select>
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
              onChange={e => setCourseForm({ ...courseForm, name: e.target.value })}
              required
              placeholder="e.g., Operating Systems"
              maxLength={300}
            />

            <label>Professor Assigned</label>
            <select
              value={courseForm.professor}
              onChange={e => setCourseForm({ ...courseForm, professor: e.target.value })}
              required
            >
              <option value="">Select a Professor</option>
              {data.professors.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>

            <label>Section</label>
            <input
              type="text"
              value={courseForm.section}
              onChange={e => setCourseForm({ ...courseForm, section: e.target.value })}
              required
              placeholder="e.g., 1"
              maxLength={300}
            />

            <label>Total No. of Classes</label>
            <input
              type="number"
              value={courseForm.totalclasses}
              onChange={e => setCourseForm({ ...courseForm, totalclasses: e.target.value })}
              required
              min="1"
              max="300"
            />

            <label>Course's Credits</label>
            <div style={{
              display: 'flex',
              gap: '12px',
              marginBottom: '20px'
            }}>
              {[2, 3, 4].map(credit => (
                <button
                  key={credit}
                  type="button"
                  onClick={() => setCourseForm({ ...courseForm, credits: credit.toString() })}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '8px',
                    border: courseForm.credits === credit.toString()
                      ? '2px solid #2B9900'
                      : '1px solid rgba(255, 255, 255, 0.2)',
                    background: courseForm.credits === credit.toString()
                      ? 'rgba(43, 153, 0, 0.2)'
                      : 'rgba(255, 255, 255, 0.05)',
                    color: courseForm.credits === credit.toString() ? '#2B9900' : 'white',
                    fontFamily: 'Outfit',
                    fontSize: '14px',
                    fontWeight: courseForm.credits === credit.toString() ? '600' : '400',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (courseForm.credits !== credit.toString()) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (courseForm.credits !== credit.toString()) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    }
                  }}
                >
                  {credit} Credits
                </button>
              ))}
            </div>
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
              onChange={e => setStudentForm({ ...studentForm, name: e.target.value })}
              required
              maxLength={300}
            />

            <label>Email</label>
            <input
              type="email"
              value={studentForm.email}
              onChange={e => setStudentForm({ ...studentForm, email: e.target.value })}
              required
              maxLength={300}
            />

            <label>Roll Number</label>
            <input
              type="text"
              value={studentForm.rollnumber}
              onChange={e => setStudentForm({ ...studentForm, rollnumber: e.target.value })}
              required
              maxLength={300}
            />

            <label>Phone</label>
            <input
              type="tel"
              value={studentForm.phone}
              onChange={e => setStudentForm({ ...studentForm, phone: e.target.value })}
              required
              pattern="[0-9]{10}"
              title="10 digit mobile number"
              maxLength={300}
            />

            <label>Section</label>
            <input
              type="text"
              value={studentForm.section}
              onChange={e => setStudentForm({ ...studentForm, section: e.target.value })}
              required
              maxLength={300}
            />

            <label>Password</label>
            <input
              type="password"
              value={studentForm.password}
              onChange={e => setStudentForm({ ...studentForm, password: e.target.value })}
              required
              minLength={6}
              maxLength={300}
            />
          </form>
        </AdminModal>

        {/* Edit Student Modal */}
        <AdminModal
          isOpen={editStudentModalOpen}
          onClose={() => {
            setEditStudentModalOpen(false);
            setEditStudentCourseSearch('');
          }}
          title="Edit Student"
          className="wide"
          actions={
            <>
              <button
                type="button"
                className="admin-modal-btn admin-modal-btn--secondary"
                onClick={() => {
                  setEditStudentModalOpen(false);
                  setEditStudentCourseSearch('');
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="edit-student-modal-form"
                className="admin-modal-btn"
              >
                Save Changes
              </button>
            </>
          }
        >
          <form id="edit-student-modal-form" style={{ marginTop: 0 }} onSubmit={handleEditStudent}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '32px'
            }}>
              {/* Left Side - Student Details */}
              <div>
                <label style={{ marginBottom: '8px', display: 'block', fontSize: '14px', fontWeight: '500' }}>Name</label>
                <input
                  type="text"
                  value={editStudentForm.name}
                  onChange={e => setEditStudentForm({ ...editStudentForm, name: e.target.value })}
                  required
                  maxLength={300}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: 'white',
                    fontFamily: 'Outfit',
                    fontSize: '14px',
                    marginBottom: '20px'
                  }}
                />

                <label style={{ marginBottom: '8px', display: 'block', fontSize: '14px', fontWeight: '500' }}>Email (Read Only)</label>
                <input
                  type="email"
                  value={editStudentForm.email}
                  readOnly
                  disabled
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontFamily: 'Outfit',
                    fontSize: '14px',
                    cursor: 'not-allowed',
                    marginBottom: '20px'
                  }}
                />

                <label style={{ marginBottom: '8px', display: 'block', fontSize: '14px', fontWeight: '500' }}>Roll Number</label>
                <input
                  type="text"
                  value={editStudentForm.rollnumber}
                  onChange={e => setEditStudentForm({ ...editStudentForm, rollnumber: e.target.value })}
                  required
                  maxLength={300}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: 'white',
                    fontFamily: 'Outfit',
                    fontSize: '14px',
                    marginBottom: '20px'
                  }}
                />

                <label style={{ marginBottom: '8px', display: 'block', fontSize: '14px', fontWeight: '500' }}>Phone</label>
                <input
                  type="tel"
                  value={editStudentForm.phone}
                  onChange={e => setEditStudentForm({ ...editStudentForm, phone: e.target.value })}
                  required
                  pattern="[0-9]{10}"
                  title="10 digit mobile number"
                  maxLength={300}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: 'white',
                    fontFamily: 'Outfit',
                    fontSize: '14px',
                    marginBottom: '20px'
                  }}
                />

                <label style={{ marginBottom: '8px', display: 'block', fontSize: '14px', fontWeight: '500' }}>Section</label>
                <input
                  type="text"
                  value={editStudentForm.section}
                  onChange={e => setEditStudentForm({ ...editStudentForm, section: e.target.value })}
                  required
                  maxLength={300}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: 'white',
                    fontFamily: 'Outfit',
                    fontSize: '14px',
                    marginBottom: '20px'
                  }}
                />
              </div>

              {/* Right Side - Course Selection */}
              <div>
                <label style={{ marginBottom: '8px', display: 'block', fontSize: '14px', fontWeight: '500' }}>Assigned Courses</label>

                {/* Search Bar */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                  <img
                    src="/assets/search (5).png"
                    alt="Search"
                    style={{
                      position: 'absolute',
                      left: '14px',
                      width: '16px',
                      height: '16px',
                      opacity: 0.6,
                      pointerEvents: 'none'
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Search courses..."
                    value={editStudentCourseSearch}
                    onChange={(e) => setEditStudentCourseSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 16px 10px 42px',
                      borderRadius: '999px',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: 'white',
                      fontFamily: 'Outfit',
                      fontSize: '13px',
                      outline: 'none',
                      transition: 'all 0.2s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.border = '1px solid rgba(43, 153, 0, 0.5)';
                      e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                    }}
                    onBlur={(e) => {
                      e.target.style.border = '1px solid rgba(255, 255, 255, 0.2)';
                      e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                    }}
                  />
                </div>

                <div style={{
                  maxHeight: '420px',
                  overflowY: 'auto',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.05)'
                }}>
                  {data.courses.length === 0 ? (
                    <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '14px', padding: '20px', textAlign: 'center' }}>
                      No courses available
                    </div>
                  ) : (
                    data.courses
                      .filter(course => {
                        const query = editStudentCourseSearch.toLowerCase();
                        const courseName = course.name.toLowerCase();
                        const profName = (course.professor?.name || '').toLowerCase();
                        const section = (course.section || '').toLowerCase();
                        return courseName.includes(query) || profName.includes(query) || section.includes(query);
                      })
                      .map(course => (
                        <div
                          key={course._id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '10px',
                            marginBottom: '8px',
                            borderRadius: '6px',
                            background: editStudentForm.courses.includes(course._id)
                              ? 'rgba(43, 153, 0, 0.15)'
                              : 'transparent',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onClick={() => handleToggleCourse(course._id)}
                          onMouseEnter={(e) => {
                            if (!editStudentForm.courses.includes(course._id)) {
                              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!editStudentForm.courses.includes(course._id)) {
                              e.currentTarget.style.background = 'transparent';
                            }
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={editStudentForm.courses.includes(course._id)}
                            onChange={() => handleToggleCourse(course._id)}
                            style={{
                              marginRight: '12px',
                              width: '18px',
                              height: '18px',
                              cursor: 'pointer',
                              accentColor: '#2B9900'
                            }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{
                              fontSize: '14px',
                              fontWeight: '500',
                              color: 'white',
                              marginBottom: '4px'
                            }}>
                              {course.name}
                            </div>
                            <div style={{
                              fontSize: '12px',
                              color: 'rgba(255, 255, 255, 0.6)'
                            }}>
                              Section {course.section} • {course.professor?.name || 'No professor assigned'}
                            </div>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
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
              onChange={e => setProfForm({ ...profForm, name: e.target.value })}
              required
              maxLength={300}
            />

            <label>Employee ID</label>
            <input
              type="text"
              value={profForm.employeeId}
              onChange={e => setProfForm({ ...profForm, employeeId: e.target.value })}
              required
              maxLength={300}
              placeholder="e.g., EMP001"
            />

            <label>Email</label>
            <input
              type="email"
              value={profForm.email}
              onChange={e => setProfForm({ ...profForm, email: e.target.value })}
              required
              maxLength={300}
            />

            <label>Phone</label>
            <input
              type="tel"
              value={profForm.phone}
              onChange={e => setProfForm({ ...profForm, phone: e.target.value })}
              required
              pattern="[0-9]{10}"
              title="10 digit mobile number"
              maxLength={300}
            />

            <label>Password</label>
            <input
              type="password"
              value={profForm.password}
              onChange={e => setProfForm({ ...profForm, password: e.target.value })}
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

        {/* Edit Course Modal */}
        <AdminModal
          isOpen={editCourseModalOpen}
          onClose={() => setEditCourseModalOpen(false)}
          title="Edit Course"
          actions={
            <>
              <button
                type="button"
                className="admin-modal-btn admin-modal-btn--secondary"
                onClick={() => setEditCourseModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="edit-course-modal-form"
                className="admin-modal-btn"
              >
                Save Changes
              </button>
            </>
          }
        >
          <form id="edit-course-modal-form" className="admin-modal-form" onSubmit={handleEditCourse}>
            <label>Name of the Course</label>
            <input
              type="text"
              value={editCourseForm.name}
              onChange={e => setEditCourseForm({ ...editCourseForm, name: e.target.value })}
              required
              placeholder="e.g., Operating Systems"
              maxLength={300}
            />

            <label>Professor Assigned</label>
            <select
              value={editCourseForm.professor}
              onChange={e => setEditCourseForm({ ...editCourseForm, professor: e.target.value })}
              required
            >
              <option value="">Select a Professor</option>
              {data.professors.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>

            <label>Section</label>
            <input
              type="text"
              value={editCourseForm.section}
              onChange={e => setEditCourseForm({ ...editCourseForm, section: e.target.value })}
              required
              placeholder="e.g., 1"
              maxLength={300}
            />

            <label>Total No. of Classes</label>
            <input
              type="number"
              value={editCourseForm.totalclasses}
              onChange={e => setEditCourseForm({ ...editCourseForm, totalclasses: e.target.value })}
              required
              min="1"
              max="300"
            />

            <label>Course's Credits</label>
            <input
              type="number"
              value={editCourseForm.credits}
              onChange={e => setEditCourseForm({ ...editCourseForm, credits: e.target.value })}
              required
              min="1"
              max="300"
            />
          </form>
        </AdminModal>

        {/* Delete Course Confirmation Modal */}
        {deleteConfirmOpen && (
          <div className="admin-modal-overlay">
            <div className="admin-modal">
              <h3>Delete Course?</h3>
              <p style={{ marginTop: '12px', marginBottom: '24px', color: 'rgba(255, 255, 255, 0.7)' }}>
                Are you sure you want to delete <strong style={{ color: '#2B9900' }}>{courseToDelete?.name}</strong>? This action cannot be undone.
              </p>
              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-modal-btn admin-modal-btn--secondary"
                  onClick={() => {
                    setDeleteConfirmOpen(false);
                    setCourseToDelete(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="admin-modal-btn"
                  style={{ background: '#ff4444' }}
                  onClick={handleDeleteCourse}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Student Confirmation Modal */}
        {deleteStudentConfirmOpen && (
          <div className="admin-modal-overlay">
            <div className="admin-modal">
              <h3>Delete Student?</h3>
              <p style={{ marginTop: '12px', marginBottom: '24px', color: 'rgba(255, 255, 255, 0.7)' }}>
                Are you sure you want to delete <strong style={{ color: '#2B9900' }}>{studentToDelete?.name}</strong>? This action cannot be undone.
              </p>
              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-modal-btn admin-modal-btn--secondary"
                  onClick={() => {
                    setDeleteStudentConfirmOpen(false);
                    setStudentToDelete(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="admin-modal-btn"
                  style={{ background: '#ff4444' }}
                  onClick={handleDeleteStudent}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Faculty Modal */}
        <AdminModal
          isOpen={editFacultyModalOpen}
          onClose={() => setEditFacultyModalOpen(false)}
          title="Edit Faculty"
          actions={
            <>
              <button
                type="button"
                className="admin-modal-btn admin-modal-btn--secondary"
                onClick={() => setEditFacultyModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="edit-faculty-modal-form"
                className="admin-modal-btn"
              >
                Save Changes
              </button>
            </>
          }
        >
          <form id="edit-faculty-modal-form" className="admin-modal-form" onSubmit={(e) => {
            e.preventDefault();
            handleEditFaculty();
          }}>
            <label>Name</label>
            <input
              type="text"
              value={editFacultyForm.name}
              onChange={e => setEditFacultyForm({ ...editFacultyForm, name: e.target.value })}
              required
              maxLength={300}
            />

            <label>Email</label>
            <input
              type="email"
              value={editFacultyForm.email}
              onChange={e => setEditFacultyForm({ ...editFacultyForm, email: e.target.value })}
              required
              maxLength={300}
            />

            <label>Phone</label>
            <input
              type="tel"
              value={editFacultyForm.phone}
              onChange={e => setEditFacultyForm({ ...editFacultyForm, phone: e.target.value })}
              maxLength={20}
            />

            <label>Password (leave blank to keep unchanged)</label>
            <input
              type="password"
              value={editFacultyForm.password}
              onChange={e => setEditFacultyForm({ ...editFacultyForm, password: e.target.value })}
              placeholder="Enter new password or leave blank"
              maxLength={300}
            />
          </form>
        </AdminModal>

        {/* Delete Faculty Confirmation Modal */}
        {deleteFacultyConfirmOpen && (
          <div className="admin-modal-overlay">
            <div className="admin-modal">
              <h3>Delete Faculty?</h3>
              <p style={{ marginTop: '12px', marginBottom: '24px', color: 'rgba(255, 255, 255, 0.7)' }}>
                Are you sure you want to delete <strong style={{ color: '#2B9900' }}>{facultyToDelete?.name}</strong>? This action cannot be undone.
              </p>
              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-modal-btn admin-modal-btn--secondary"
                  onClick={() => {
                    setDeleteFacultyConfirmOpen(false);
                    setFacultyToDelete(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="admin-modal-btn"
                  style={{ background: '#ff4444' }}
                  onClick={handleDeleteFaculty}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminDashboard;