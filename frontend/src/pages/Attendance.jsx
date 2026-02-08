import { useState, useEffect } from 'react';
import api from '../api/axios';
import Layout from '../components/Layout';
import Beams from '../components/Beams';
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
        <div className="beams-background">
          <Beams
            beamWidth={2.3}
            beamHeight={16}
            beamNumber={20}
            lightColor="#00990a"
            speed={2.5}
            noiseIntensity={1}
            scale={0.2}
            rotation={30}
          />
        </div>
        <div className="attendance-content">
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
                    <div className="attendance-main-row">
                      <div className="chart-container" style={{ background: 'none', backdropFilter: 'none' }}>
                        <svg 
                          width="140" 
                          height="140" 
                          className="attendance-chart"
                        >
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
                              stroke: '#ffffff'
                            }}
                          />
                        </svg>
                        <div className="chart-label">
                          <span className="percentage-value">{percentage}%</span>
                        </div>
                      </div>
                      
                      <div className="attendance-square-grid-section">
                        <div className="attendance-square-grid">
                          {Array.from({ length: course.totalClasses || 0 }).map((_, i) => (
                            <div
                              key={i}
                              className={`attendance-square ${i < (course.attendedClasses || 0) ? 'filled' : 'empty'}`}
                            />
                          ))}
                        </div>
                        
                        <div className="classes-text">
                          {course.attendedClasses || 0} / {course.totalClasses || 0}
                        </div>
                      </div>
                    </div>
                    
                    <div className="status-badge-container">
                      <span className="status-label">Status</span>
                      <span 
                        className="status-badge"
                        style={{ color: statusColor, borderColor: statusColor }}
                      >
                        {course.attendanceStatus}
                      </span>
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
      </div>
    </Layout>
  );
};

export default Attendance;
