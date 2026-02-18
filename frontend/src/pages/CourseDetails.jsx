import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useSelector } from 'react-redux';
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

    const canEdit = user?.role === 'Professor' || user?.role === 'Admin';

    useEffect(() => {
        fetchCourseDetails();
    }, [courseId]);

    const fetchCourseDetails = async () => {
        try {
            const res = await api.get(`/courses/${courseId}`);
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
                await api.put(`/courses/${courseId}`, editForm);
                setCourse({ ...course, ...editForm });
                setEditMode(false);
            } catch (error) {
                console.error('Error updating course:', error);
            }
        } else {
            setEditMode(true);
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
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData().map((participant, index) => (
                                        <tr key={participant._id} onClick={() => {
                                            if (activeTab === 'students' && (user?.role === 'Admin' || user?.role === 'Professor')) {
                                                navigate(`/student/${participant._id}`);
                                            }
                                        }}>
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
