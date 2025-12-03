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
            borderWidth: 2,
            fill: false,
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
        <div className="bg_subjects">
          {subjects.map((sub) => (
            <div 
              key={sub.courseId} 
              className="subject"
              id={selectedCourseId === sub.courseId ? 'selected_subject' : ''}
              onClick={() => handleSubjectClick(sub)}
              style={{ cursor: 'pointer' }}
            >
              <p>{sub.name}</p>
            </div>
          ))}
        </div>

        <div className="bg_main">
          <div className="bg_graph">
            <p>Bell Graph Curve for <span id="currentSubject">{currentSubjectName}</span></p>
            <div style={{ width: '800px', height: '400px' }}>
              {chartData ? (
                <Line 
                  options={{ 
                    responsive: true, 
                    maintainAspectRatio: false,
                    scales: {
                      x: { title: { display: true, text: "Grade" } },
                      y: { title: { display: true, text: "Frequency" } },
                    }
                  }} 
                  data={chartData} 
                />
              ) : (
                <p style={{color: 'white'}}>Loading chart...</p>
              )}
            </div>
          </div>

          <div className="bg_graphright">
            <div>
              <p>Your Grade</p>
              <p>O</p> {/* Placeholder for userinfo/grade */}
            </div>
            <div className="bg_details">
              <div><p>Allotted Credits</p><p><span>4</span></p></div>
              <div><p>Total Hours Assigned</p><p><span>46</span>hrs</p></div>
              <div><p>Total Enrollments</p><p><span>146</span></p></div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Bellgraph;
