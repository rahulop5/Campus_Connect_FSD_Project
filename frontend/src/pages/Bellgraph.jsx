import { useState, useEffect } from 'react';
import api from '../api/axios';
import Layout from '../components/Layout';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import '../styles/Bellgraph.css';

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
      // Transform data for Recharts
      const transformedData = res.data.x.map((grade, index) => ({
        grade: grade,
        frequency: res.data.y[index]
      }));
      setChartData(transformedData);
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
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart 
                    data={chartData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorFrequency" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2B9900" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#2B9900" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                    <XAxis 
                      dataKey="grade" 
                      stroke="rgba(255, 255, 255, 0.7)"
                      tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 12 }}
                      label={{ value: 'Grade', position: 'insideBottom', offset: -5, fill: '#fff' }}
                    />
                    <YAxis 
                      stroke="rgba(255, 255, 255, 0.7)"
                      tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 12 }}
                      label={{ value: 'Frequency', angle: -90, position: 'insideLeft', fill: '#fff' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0, 0, 0, 0.9)', 
                        border: '1px solid #2B9900',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                      labelStyle={{ color: '#2B9900', fontWeight: 'bold' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="frequency" 
                      stroke="#2B9900" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorFrequency)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
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
