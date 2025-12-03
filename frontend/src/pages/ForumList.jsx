import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import api from '../api/axios';
import Layout from '../components/Layout';
import '../styles/Problemslvfrm.css';

const ForumList = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await api.get('/forum/questions');
        setQuestions(res.data.questions || []);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching questions:", error);
        setLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  return (
    <Layout>
      <div className="maincon forum-list-page">
        <div className="mainpage">
          <div className="toptop">
            <div className="top">
              <div className="searchques">
                <h1 className="outfit">Trending <span>Q</span>uestions</h1>
                <p className="outfit" id="quesCount">
                  {loading ? "Loading questions..." : `Available Questions - ${questions.length.toLocaleString()}`}
                </p>
              </div>
              <div className="askaques">
                <Link to="/forum/ask" style={{ textDecoration: 'none' }}>
                  <button className="outfit">Ask a Question</button>
                </Link>
              </div>
            </div>

            <div className="searchquesinput">
              <div className="input-container">
                <div className="input">
                  <form onSubmit={(e) => e.preventDefault()}>
                    <div className="advsearch">
                      <input type="text" id="searchInput" placeholder="Search a Question" />
                      <button type="submit"><img src="/assets/search.png" alt="" /></button>
                    </div>
                  </form>
                </div>
                <div className="hidden-div">
                  <p>Filters will go here</p>
                </div>
              </div>
              <div className="filter">
                <button><img src="/assets/filter (1).png" alt="" /></button>
              </div>
            </div>
          </div>

          <hr />

          <div className="problems" id="problemsContainer">
            {questions.length === 0 && !loading ? (
              <p>No questions found.</p>
            ) : (
              questions.map((q) => (
                <div key={q._id}>
                  <div className="problem outfit">
                    <div className="votes">
                      <p className="votesCount">{q.votes} votes</p>
                      <p className="answersCount">{q.answers.length} answers</p>
                      <p className="viewsCount">{q.views} views</p>
                    </div>
                    <div className="main">
                      <Link className="questionLink" to={`/forum/question/${q._id}`} style={{ textDecoration: 'none' }}>
                        <h4 className="questionHeading">{q.heading}</h4>
                      </Link>
                      <p className="questionDesc">{(q.desc?.slice(0, 100) || "") + "..."}</p>
                      <div className="tags">
                        {(q.tags || []).map((tag, idx) => (
                          <div key={idx}><p>{tag}</p></div>
                        ))}
                      </div>
                    </div>
                    <div className="user">
                      <div className="useruser">
                        <img src="/assets/duck_with_A_gun 1.png" alt="" />
                        <p className="askerName">{q.asker?.name || "Unknown"}</p>
                      </div>
                    </div>
                  </div>
                  <hr className="problemline" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ForumList;
