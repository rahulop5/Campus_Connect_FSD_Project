import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useSelector } from 'react-redux';
import api from '../api/axios';
import Layout from '../components/Layout';
import DarkVeil from '../components/DarkVeil';
import '../styles/StudentPreview.css';

const StudentPreview = () => {
    const { studentId } = useParams();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Only admin and professor can access this page
    const canView = user?.role === 'Professor' || user?.role === 'Admin';

    useEffect(() => {
        if (!canView) {
            navigate('/dashboard');
            return;
        }
        fetchStudentDetails();
    }, [studentId, canView]);

    const fetchStudentDetails = async () => {
        try {
            const res = await api.get(`/students/${studentId}`);
            setStudent(res.data.student);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching student details:', error);
            setLoading(false);
        }
    };

    const getGradeColor = (grade) => {
        if (grade >= 90) return '#2B9900';
        if (grade >= 75) return '#48FF00';
        if (grade >= 60) return '#FFD700';
        if (grade >= 50) return '#FFA500';
        return '#FF4444';
    };

    const getAttendanceColor = (attendance) => {
        if (attendance >= 85) return '#2B9900';
        if (attendance >= 75) return '#48FF00';
        if (attendance >= 65) return '#FFD700';
        return '#FF4444';
    };

    const filteredCourses = () => {
        if (!student?.courses) return [];
        if (!searchQuery) return student.courses;
        return student.courses.filter(course =>
            course.courseName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.courseCode?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    };

    if (loading) {
        return (
            <Layout>
                <div className="student-preview-loading">Loading...</div>
            </Layout>
        );
    }

    if (!student) {
        return (
            <Layout>
                <div className="student-preview-error">Student not found</div>
            </Layout>
        );
    }

    const currentYear = new Date().getFullYear();
    const yearOfGraduation = student.yearOfGraduation || currentYear + 4;

    return (
        <Layout>
            <div className="student-preview-page">
                <div className="plasma-background">
                    <DarkVeil hueShift={120} speed={0.5} noiseIntensity={0.8} />
                </div>

                <div className="student-preview-container">
                    {/* Header with Back Button */}
                    <div className="student-preview-header">
                        <button className="back-button" onClick={() => navigate(-1)}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Back
                        </button>
                    </div>

                    {/* Student Profile Card */}
                    <div className="student-profile-card">
                        <div className="student-avatar-section">
                            <div className="student-avatar-large">
                                {student.profilePicture ? (
                                    <img src={student.profilePicture} alt={student.name} />
                                ) : (
                                    <span>{student.name?.charAt(0).toUpperCase()}</span>
                                )}
                            </div>
                            <div className="student-basic-info">
                                <h1 className="student-name">{student.name}</h1>
                                <p className="student-email">{student.email}</p>
                            </div>
                        </div>

                        <div className="student-info-grid">
                            <div className="info-card">
                                <div className="info-label">Roll Number</div>
                                <div className="info-value">{student.rollnumber}</div>
                            </div>
                            <div className="info-card">
                                <div className="info-label">Batch</div>
                                <div className="info-value">{student.section || 'N/A'}</div>
                            </div>
                            <div className="info-card">
                                <div className="info-label">Branch</div>
                                <div className="info-value">{student.branch || 'N/A'}</div>
                            </div>
                            <div className="info-card">
                                <div className="info-label">Year of Graduation</div>
                                <div className="info-value">{yearOfGraduation}</div>
                            </div>
                            <div className="info-card">
                                <div className="info-label">Total Courses Enrolled</div>
                                <div className="info-value highlight">{student.courses?.length || 0}</div>
                            </div>
                            <div className="info-card">
                                <div className="info-label">Phone</div>
                                <div className="info-value">{student.phone || 'N/A'}</div>
                            </div>
                        </div>
                    </div>

                    {/* Enrolled Courses Section */}
                    <div className="enrolled-courses-section">
                        <div className="section-header">
                            <h2 className="section-title">Enrolled Courses</h2>
                            <div className="search-box">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
                                    <path d="M14 14L18 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Search courses..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="courses-table-wrapper">
                            <table className="courses-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Course Name</th>
                                        <th>Course Code</th>
                                        <th>Predicted Grade</th>
                                        <th>Attendance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredCourses().length === 0 ? (
                                        <tr>
                                            <td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>
                                                No courses found
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredCourses().map((course, index) => (
                                            <tr key={course.courseId || index}>
                                                <td>{index + 1}</td>
                                                <td>
                                                    <div className="course-name-cell">
                                                        <div className="course-icon-small">
                                                            {course.courseName?.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span>{course.courseName || 'N/A'}</span>
                                                    </div>
                                                </td>
                                                <td className="course-code">{course.courseCode || 'N/A'}</td>
                                                <td>
                                                    <span
                                                        className="grade-badge"
                                                        style={{
                                                            backgroundColor: `${getGradeColor(course.grade || 0)}20`,
                                                            color: getGradeColor(course.grade || 0),
                                                            border: `1px solid ${getGradeColor(course.grade || 0)}40`
                                                        }}
                                                    >
                                                        {course.grade ? `${course.grade}%` : 'N/A'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="attendance-cell">
                                                        <div className="attendance-bar-container">
                                                            <div
                                                                className="attendance-bar-fill"
                                                                style={{
                                                                    width: `${course.attendance || 0}%`,
                                                                    backgroundColor: getAttendanceColor(course.attendance || 0)
                                                                }}
                                                            ></div>
                                                        </div>
                                                        <span
                                                            className="attendance-text"
                                                            style={{ color: getAttendanceColor(course.attendance || 0) }}
                                                        >
                                                            {course.attendance ? `${course.attendance}%` : 'N/A'}
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default StudentPreview;
