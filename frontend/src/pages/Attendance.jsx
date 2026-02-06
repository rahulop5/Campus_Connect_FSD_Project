import { useState, useEffect } from 'react';
import api from '../api/axios';
import Layout from '../components/Layout';
import '../styles/Attendance.css';

const Attendance = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const res = await api.get('/student/attendance');
        setData(res.data);
      } catch (error) {
        console.error("Error fetching attendance:", error);
      }
    };
    fetchAttendance();
  }, []);

  if (!data) return <Layout>Loading...</Layout>;

  const getStatusColor = (status) => {
    if (status === 'Good') return '#2B9900';
    if (status === 'At Risk') return '#FFD400';
    if (status === 'Critical') return '#980000';
    return '#FFD400';
  };

  return (
    <Layout>
      <div className="attendance-page">
        <div className="attendance-header">
          <h1>{data.name}'s Attendance</h1>
        </div>
        
        <div className="attendance-grid">
          {data.courses && data.courses.length > 0 ? (
            data.courses.map((course, index) => {
              const statusColor = getStatusColor(course.attendanceStatus);
              const percentage = course.attendancePercentage || 0;
              const radius = 55;
              const circumference = 2 * Math.PI * radius;
              const offset = circumference * (1 - percentage / 100);
              
              return (
                <div className="attendance-card" key={index}>
                  <div className="card-header">
                    <h2>{course.subject}</h2>
                  </div>
                  
                  <div className="card-body">
                    <div className="chart-container">
                      <svg width="140" height="140" className="attendance-chart">
                        <circle
                          cx="70"
                          cy="70"
                          r={radius}
                          className="chart-background"
                        />
                        <circle
                          cx="70"
                          cy="70"
                          r={radius}
                          className="chart-progress"
                          style={{
                            strokeDasharray: circumference,
                            strokeDashoffset: offset,
                            stroke: statusColor
                          }}
                        />
                      </svg>
                      <div className="chart-label">
                        <span className="percentage-value">{percentage}%</span>
                      </div>
                    </div>
                    
                    <div className="card-stats">
                      <div className="stat-item">
                        <span className="stat-label">Status</span>
                        <span 
                          className="stat-value status-badge"
                          style={{ color: statusColor, borderColor: statusColor }}
                        >
                          {course.attendanceStatus}
                        </span>
                      </div>
                      
                      <div className="stat-divider"></div>
                      
                      <div className="stat-item">
                        <span className="stat-label">Classes</span>
                        <span className="stat-value">
                          {course.attendedClasses || 0} / {course.totalClasses || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="no-data">
              <p>No courses found.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Attendance;
