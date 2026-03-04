import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useSelector, useDispatch } from 'react-redux';
import { fetchDashboardData } from '../store/slices/adminSlice';
import api from '../api/axios';
import Layout from '../components/Layout';
import DarkVeil from '../components/DarkVeil';
import '../styles/CourseDetails.css';

const CourseDetails = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const [course, setCourse] = useState(null);
    const [students, setStudents] = useState([]);
    const [faculty, setFaculty] = useState([]);
    const [activeTab, setActiveTab] = useState('students');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [editForm, setEditForm] = useState({});

    const allowedEditRoles = ['Admin', 'Professor', 'college_admin', 'super_admin', 'faculty'];
    const canEdit = allowedEditRoles.includes(user?.role);
    const dispatch = useDispatch();
    const { students: allStudents, professors: allProfessors } = useSelector((state) => state.admin);
    const [assignStudentId, setAssignStudentId] = useState('');
    const [assignProfessorId, setAssignProfessorId] = useState('');

    useEffect(() => {
        if (canEdit && (allStudents.length === 0 || allProfessors.length === 0)) {
            dispatch(fetchDashboardData());
        }
        fetchCourseDetails();
    }, [courseId, canEdit, dispatch]);

    const fetchCourseDetails = async () => {
        try {
            const res = await api.get(`/admin/course/${courseId}`);
            setCourse(res.data.course);
            setStudents(res.data.students || []);
            setFaculty(res.data.faculty || []);
            setEditForm({
                name: res.data.course.name,
                credits: res.data.course.credits,
                totalclasses: res.data.course.totalclasses,
                section: res.data.course.section
            });
            setLoading(false);
        } catch (error) {
            console.error('Error fetching course details:', error);
            setLoading(false);
        }
    };

    const handleEdit = async () => {
        if (editMode) {
            try {
                // Determine if we need to change professor
                const updatedForm = { ...editForm };
                if (assignProfessorId && assignProfessorId !== course?.professor?._id) {
                    updatedForm.professor = assignProfessorId;
                }

                await api.put(`/admin/course/${courseId}`, updatedForm);
                // Refetch to get populated fields correctly
                await fetchCourseDetails();
                setEditMode(false);
            } catch (error) {
                console.error('Error updating course:', error);
            }
        } else {
            setAssignProfessorId(course?.professor?._id || '');
            setEditMode(true);
        }
    };

    const handleAddStudent = async () => {
        if (!assignStudentId) return;
        try {
            await api.post('/admin/assign/course-student', {
                course: courseId,
                student: assignStudentId
            });
            setAssignStudentId('');
            await fetchCourseDetails();
        } catch (error) {
            console.error('Error adding student:', error);
            alert(error.response?.data?.message || 'Failed to add student');
        }
    };

    const handleRemoveStudent = async (studentId) => {
        if (!window.confirm('Are you sure you want to remove this student from the course?')) return;
        try {
            await api.post('/admin/remove/course', {
                course: courseId,
                student: studentId,
                removeType: 'student'
            });
            await fetchCourseDetails();
        } catch (error) {
            console.error('Error removing student:', error);
            alert(error.response?.data?.message || 'Failed to remove student');
        }
    };

    const filteredData = () => {
        const data = activeTab === 'students' ? students : faculty;
        if (!searchQuery) return data;
        return data.filter(item =>
            item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.rollnumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.email?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    };

    if (loading) {
        return (
            <Layout>
                <div className="course-details-loading">Loading...</div>
            </Layout>
        );
    }

    if (!course) {
        return (
            <Layout>
                <div className="course-details-error">Course not found</div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="course-details-page">
                <div className="plasma-background">
                    <DarkVeil hueShift={120} speed={0.5} noiseIntensity={0.8} />
                </div>

                <div className="course-details-container">
                    {/* Header with Back Button */}
                    <div className="course-details-header">
                        <button className="back-button" onClick={() => navigate(-1)}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Back to Main Menu
                        </button>
                    </div>

                    {/* Course Header Card */}
                    <div className="course-header-card">
                        <div className="course-icon">
                            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                                <rect width="48" height="48" rx="12" fill="rgba(43, 153, 0, 0.15)" />
                                <path d="M24 14L32 18V28C32 31.314 28.418 34 24 34C19.582 34 16 31.314 16 28V18L24 14Z" stroke="#2B9900" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M24 24V34" stroke="#2B9900" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <div className="course-info">
                            {editMode ? (
                                <input
                                    type="text"
                                    className="course-name-edit"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                />
                            ) : (
                                <>
                                    <h1 className="course-name">{course.name}</h1>
                                    <p className="course-code">{course.section}</p>
                                </>
                            )}
                        </div>
                        <div className="course-stats">
                            <div className="stat-item">
                                <span className="stat-label">Course Type</span>
                                <span className="stat-value">Program Elective</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Professor</span>
                                {editMode ? (
                                    <select
                                        className="stat-value-edit"
                                        style={{ background: 'rgba(255, 255, 255, 0.1)', color: 'white', border: '1px solid rgba(255, 255, 255, 0.2)', padding: '4px', borderRadius: '4px' }}
                                        value={assignProfessorId}
                                        onChange={(e) => setAssignProfessorId(e.target.value)}
                                    >
                                        <option value="">-- Select Professor --</option>
                                        {allProfessors.map(prof => (
                                            <option key={prof._id} value={prof._id} style={{ color: 'black' }}>
                                                {prof.name}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <span className="stat-value">{faculty.length > 0 ? faculty[0].name : 'Unassigned'}</span>
                                )}
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Credits</span>
                                {editMode ? (
                                    <input
                                        type="number"
                                        className="stat-value-edit"
                                        value={editForm.credits}
                                        onChange={(e) => setEditForm({ ...editForm, credits: e.target.value })}
                                    />
                                ) : (
                                    <span className="stat-value">{course.credits}</span>
                                )}
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">No. of Students</span>
                                <span className="stat-value">{students.length}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Faculty Count</span>
                                <span className="stat-value">{faculty.length}</span>
                            </div>
                        </div>
                    </div>

                    {/* Course Participants Section */}
                    <div className="course-participants">
                        <h2 className="participants-title">Course Participants</h2>

                        <div className="participants-controls">
                            <div className="tab-selector">
                                <button
                                    className={activeTab === 'faculty' ? 'active' : ''}
                                    onClick={() => setActiveTab('faculty')}
                                >
                                    Faculty
                                </button>
                                <button
                                    className={activeTab === 'students' ? 'active' : ''}
                                    onClick={() => setActiveTab('students')}
                                >
                                    Students
                                </button>
                            </div>

                            <div className="participants-actions">
                                {canEdit && activeTab === 'students' && (
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <select
                                            value={assignStudentId}
                                            onChange={(e) => setAssignStudentId(e.target.value)}
                                            style={{
                                                background: 'rgba(255, 255, 255, 0.05)',
                                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                                color: 'white',
                                                padding: '8px 12px',
                                                borderRadius: '8px',
                                                outline: 'none',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <option value="" style={{ color: 'black' }}>Add Student to Course...</option>
                                            {allStudents
                                                // Filter out students already in the course
                                                .filter(s => !students.some(es => es._id === s._id))
                                                .map(student => (
                                                    <option key={student._id} value={student._id} style={{ color: 'black' }}>
                                                        {student.name} ({student.rollnumber})
                                                    </option>
                                                ))}
                                        </select>
                                        <button
                                            className="edit-btn"
                                            style={{ background: '#2B9900', border: 'none', padding: '8px 16px', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}
                                            onClick={handleAddStudent}
                                            disabled={!assignStudentId}
                                        >
                                            Add
                                        </button>
                                    </div>
                                )}
                                {canEdit && (
                                    <button className="edit-btn" onClick={handleEdit}>
                                        {editMode ? 'Save' : 'Edit'}
                                    </button>
                                )}
                                <div className="search-box">
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                        <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
                                        <path d="M14 14L18 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Participants Table */}
                        <div className="participants-table-wrapper">
                            <table className="participants-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Name</th>
                                        <th>{activeTab === 'students' ? 'Roll No.' : 'Email'}</th>
                                        {canEdit && activeTab === 'students' && <th>Actions</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData().map((participant, index) => (
                                        <tr key={participant._id}>
                                            <td>{index + 1}</td>
                                            <td>
                                                <div className="participant-info">
                                                    <div className="participant-avatar">
                                                        {participant.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="participant-name">{participant.name}</div>
                                                        <div className="participant-email">{participant.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="roll-number">
                                                {activeTab === 'students' ? participant.rollnumber : participant.email}
                                            </td>
                                            {canEdit && activeTab === 'students' && (
                                                <td>
                                                    <button
                                                        onClick={() => handleRemoveStudent(participant._id)}
                                                        style={{
                                                            background: 'rgba(255, 68, 68, 0.15)',
                                                            color: '#ff4444',
                                                            border: '1px solid rgba(255, 68, 68, 0.3)',
                                                            padding: '6px 12px',
                                                            borderRadius: '6px',
                                                            cursor: 'pointer',
                                                            fontSize: '13px',
                                                            fontWeight: '500'
                                                        }}
                                                    >
                                                        Remove
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default CourseDetails;
