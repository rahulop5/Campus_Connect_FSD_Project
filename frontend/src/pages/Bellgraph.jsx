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
            label: 'Grade Distribution',
            data: res.data.y,
            borderColor: '#2B9900',
            backgroundColor: 'rgba(43, 153, 0, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: '#2B9900',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointHoverRadius: 6,
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
            <h2 className="graph-title">Grade Distribution: <span>{currentSubjectName}</span></h2>
            <div className="chart-wrapper">
              {chartData ? (
                <Line 
                  options={{ 
                    responsive: true, 
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: true,
                        labels: {
                          color: '#fff',
                          font: { size: 14, family: 'Outfit' }
                        }
                      },
                      tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#2B9900',
                        bodyColor: '#fff',
                        borderColor: '#2B9900',
                        borderWidth: 1,
                        padding: 12,
                        displayColors: false
                      }
                    },
                    scales: {
                      x: { 
                        title: { 
                          display: true, 
                          text: "Grade",
                          color: '#fff',
                          font: { size: 14, family: 'Outfit' }
                        },
                        ticks: { color: 'rgba(255, 255, 255, 0.7)' },
                        grid: { color: 'rgba(255, 255, 255, 0.05)' }
                      },
                      y: { 
                        title: { 
                          display: true, 
                          text: "Frequency",
                          color: '#fff',
                          font: { size: 14, family: 'Outfit' }
                        },
                        ticks: { color: 'rgba(255, 255, 255, 0.7)' },
                        grid: { color: 'rgba(255, 255, 255, 0.05)' }
                      },
                    }
                  }} 
                  data={chartData} 
                />
              ) : (
                <p className="loading-text">Loading chart...</p>
              )}
            </div>
          </div>

          <div className="bg_graphright">
            <div className="grade-display">
              <p>Your Grade</p>
              <p className="grade-value">O</p>
            </div>
            <div className="bg_details">
              <div className="detail-item"><p>Allotted Credits</p><p><span>4</span></p></div>
              <div className="detail-item"><p>Total Hours</p><p><span>46</span>hrs</p></div>
              <div className="detail-item"><p>Enrollments</p><p><span>146</span></p></div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Bellgraph;
