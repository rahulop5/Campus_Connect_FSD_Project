import { useState, useEffect } from 'react';
import api from '../api/axios';
import Layout from '../components/Layout';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import '../styles/Bellgraph.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Bellgraph = () => {
  const [subjects, setSubjects] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [currentSubjectName, setCurrentSubjectName] = useState('');

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await api.get('/student/bellgraph');
        setSubjects(res.data.bellgraphSubjects);
        if (res.data.bellgraphSubjects && res.data.bellgraphSubjects.length > 0) {
          handleSubjectClick(res.data.bellgraphSubjects[0]);
        }
      } catch (error) {
        console.error("Error fetching subjects:", error);
      }
    };
    fetchSubjects();
  }, []);

  const handleSubjectClick = async (subject) => {
    setSelectedCourseId(subject.courseId);
    setCurrentSubjectName(subject.name);
    try {
      const res = await api.get(`/student/bellgraph-data/${subject.courseId}`);
      setChartData({
        labels: res.data.x,
        datasets: [
          {
            label: 'Bell Curve',
            data: res.data.y,
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderWidth: 2,
            tension: 0.3,
          },
        ],
      });
    } catch (error) {
      console.error("Error fetching graph data:", error);
    }
  };

  return (
    <Layout>
      <div className="bellgraph-page">
        <div className="subjects-list">
          <h3>Your Courses</h3>
          <ul>
            {subjects.map((sub) => (
              <li 
                key={sub.courseId} 
                onClick={() => handleSubjectClick(sub)}
                className={selectedCourseId === sub.courseId ? 'selected' : ''}
                style={{ cursor: 'pointer', padding: '10px', borderBottom: '1px solid #ccc', backgroundColor: selectedCourseId === sub.courseId ? '#e0f7fa' : 'transparent' }}
              >
                {sub.name}
              </li>
            ))}
          </ul>
        </div>
        <div className="chart-container" style={{ marginTop: '20px' }}>
          <h2>{currentSubjectName}</h2>
          {chartData ? (
            <Line options={{ responsive: true }} data={chartData} />
          ) : (
            <p>Loading chart...</p>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Bellgraph;
