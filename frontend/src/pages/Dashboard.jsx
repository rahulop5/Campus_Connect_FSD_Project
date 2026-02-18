import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import ProfessorDashboard from './ProfessorDashboard';
import AdminDashboard from './AdminDashboard';
import Layout from '../components/Layout';
import { useEffect, useState } from 'react';
import api from '../api/axios';
import '../styles/Dashboard.css';

const StudentDashboard = () => {
  const [data, setData] = useState(null);
  const navigate = useNavigate();

  const sanitizeHtml = (html = '') => {
    if (typeof window === 'undefined') return '';
    const parser = new DOMParser();
    const doc = parser.parseFromString(String(html), 'text/html');
    const allowed = new Set(['B', 'STRONG', 'I', 'EM', 'H3', 'PRE', 'CODE', 'BR', 'P', 'UL', 'OL', 'LI']);

    const cleanNode = (node) => {
      Array.from(node.children).forEach((child) => {
        if (!allowed.has(child.tagName)) {
          const fragment = doc.createDocumentFragment();
          while (child.firstChild) {
            fragment.appendChild(child.firstChild);
          }
          child.replaceWith(fragment);
        } else {
          Array.from(child.attributes).forEach((attr) => child.removeAttribute(attr.name));
          cleanNode(child);
        }
      });
    };

    cleanNode(doc.body);
    return doc.body.innerHTML;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/student/dashboard');
        setData(res.data);
      } catch (error) {
        console.error("Error fetching dashboard data", error);
      }
    };
    fetchData();
  }, []);

  if (!data) return <Layout>Loading...</Layout>;

  const getGradeLetter = (predgrade) => {
    if (predgrade >= 90) return "O";
    if (predgrade >= 80) return "A";
    if (predgrade >= 70) return "B";
    if (predgrade >= 60) return "C";
    if (predgrade >= 50) return "D";
    if (predgrade >= 40) return "P";
    return "F";
  };

  const gradeOrder = ["O", "A", "B", "C", "D", "P", "F"];

  return (
    <Layout>
      <div id="dashboard-container" className="student-dashboard-page">
        <div className="db_mainpage">
          <div className="db_mainmain">
            <p>Welcome {data.name}</p>

            <div className="db_clubs">
              <div className="db_banners">
                <img src="/assets/abhisarga_banner.png" alt="" />
              </div>
              <div className="db_date">
                <p className="db_dateblack">{data.dayOfWeek}</p>
                <p>{data.day}</p>
                <p className="db_dateblack">{data.month}, {data.year}</p>
              </div>
            </div>

            <div className="db_attengrade">
              {data.courses && data.courses.slice(0, 3).map((course, index) => {
                const gradeLetter = getGradeLetter(course.grade?.predgrade || 0);
                const radius = 40;
                const circumference = 2 * Math.PI * radius;
                const offset = circumference * (1 - (course.attendancePercentage || 0) / 100);

                return (
                  <div
                    key={index}
                    className="db_subject"
                    onClick={() => navigate(`/course/${course.courseId}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="db_grade">
                      <p>{course.subject}</p>
                      <p>Predicted Grade</p>
                      <p>
                        {gradeOrder.map((g) => (
                          <span key={g} style={g === gradeLetter ? { color: 'var(--accent-color)', fontWeight: 'bold' } : {}}>
                            {g === gradeLetter ? <span>{g}</span> : g}{" "}
                          </span>
                        ))}
                      </p>
                    </div>
                    <div className="db_attendance">
                      <p>Attendance</p>
                      <div className="progress-container">
                        <svg width="100" height="100">
                          <circle cx="50" cy="50" r="40" className="background-circle"></circle>
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            className="progress-ring progress-circle"
                            style={{ strokeDasharray: circumference, strokeDashoffset: offset }}
                          ></circle>
                        </svg>
                        <div className="progress-text">{course.attendancePercentage}%</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="db_topq">
              <p>Top Questions of the Week</p>
              <div>
                {data.questions && data.questions.slice(0, 3).map((q, index) => (
                  <div key={index} className="problem">
                    <div className="votes">
                      <p>{q.votes} votes</p>
                      <p>{q.answers.length} answers</p>
                      <p>{q.views} views</p>
                    </div>
                    <div className="main">
                      <h4>{q.heading}</h4>
                      <div
                        className="question-description"
                        dangerouslySetInnerHTML={{
                          __html: q.desc ? sanitizeHtml(q.desc) : ''
                        }}
                      />
                      <div className="tags">
                        {q.tags.map((tag, i) => (
                          <div key={i}><p>{tag}</p></div>
                        ))}
                      </div>
                    </div>
                    <div className="user">
                      <div className="useruser">
                        <img src="/assets/duck_with_A_gun 1.png" alt="" />
                        <p>{q.asker?.name || 'Unknown'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="db_notice">
            <div className="po_noticeboard">
              <p>Notice!</p>
              <hr className="noticeline" />
              <div className="po_noticenews">
                <div>
                  <img src="/assets/pin.png" alt="" />
                  <p>Abhisarga night concert ticket sale is now live!</p>
                </div>
                <div>
                  <img src="/assets/pin.png" alt="" />
                  <p>Recharge Point now has Burgers because of a certain someone!</p>
                </div>
                <div>
                  <img src="/assets/pin.png" alt="" />
                  <p>Enigma, E-Cell, TedX are new Trend Setters!</p>
                </div>
              </div>
              <hr className="noticeline" />
              <div className="po_noticenews">
                <div>
                  <img src="/assets/premium.png" alt="" />
                  <p>Campus Connect now brings you Premium at Rupees 1000 ONLY!</p>
                </div>
                <div>
                  <img src="/assets/premium.png" alt="" />
                  <p>Get 30% OFF using student id verification!</p>
                </div>
                <div>
                  <img src="/assets/premium.png" alt="" />
                  <p>Campus Connect now can track your attendance for you!</p>
                </div>
              </div>
            </div>
            <div className="ads">
              <p>Ads Come Here</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  // console.log(user);
  if (!user) return <div>Loading...</div>;

  if (user.role === 'Student') return <StudentDashboard />;
  if (user.role === 'Professor') return <ProfessorDashboard />;
  if (user.role === 'Admin') return <AdminDashboard />;

  return <div>Unknown Role</div>;
};

export default Dashboard;
