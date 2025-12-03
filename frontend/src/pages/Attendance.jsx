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

  return (
    <Layout>
      <div className="at_mainpage attendance-page">
        <p>{data.name}'s Attendance</p>
        <div className="at_courses" id="at_courses_container">
          {data.courses && data.courses.length > 0 ? (
            data.courses.map((course, index) => (
              <div className="at_course" key={index}>
                <div className="subject">
                  <p>{course.subject}</p>
                </div>
                <div className="line"></div>                
                <div className="status">
                  <p>Attendance Status</p>
                  <p className="statusValue" id={course.attendanceColor}>{course.attendanceStatus}</p>
                </div>
                <div className="line"></div>
                <div className="percentage">
                  <p>Attendance Percentage</p>
                  <p className="percentageValue" id={course.attendanceColor}>{course.attendancePercentage}%</p>
                </div>
              </div>
            ))
          ) : (
            <div className="at_course"><p>No courses found.</p></div>
          )}
        </div>
        <div className="at_ads"></div>
      </div>
    </Layout>
  );
};

export default Attendance;
