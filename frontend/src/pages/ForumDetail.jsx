import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router';
import { useSelector } from 'react-redux';
import api from '../api/axios';
import Layout from '../components/Layout';
import '../styles/Problemopen.css';

const ForumDetail = () => {
  const { id } = useParams();
  const { user } = useSelector((state) => state.auth);
  const [question, setQuestion] = useState(null);
  const [userVotes, setUserVotes] = useState({});
  const [answerText, setAnswerText] = useState('');
  const [loading, setLoading] = useState(true);
  const viewRequestRef = useRef(null);

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

  const fetchQuestion = async ({ incrementView = false } = {}) => {
    try {
      const res = await api.get(`/forum/question/${id}?increment=${incrementView ? '1' : '0'}`);
      setQuestion(res.data.question);
      
      // Build user votes map
      const votes = {};
      if (res.data.question.voters) {
        res.data.question.voters.forEach(voter => {
          if (String(voter.userId) === String(user?._id)) votes[id] = voter.voteType;
        });
      }
      if (res.data.question.answers) {
        res.data.question.answers.forEach(answer => {
          if (answer.voters) {
            answer.voters.forEach(voter => {
              if (String(voter.userId) === String(user?._id)) votes[answer._id] = voter.voteType;
            });
          }
        });
      }
      setUserVotes(votes);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching question:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (viewRequestRef.current) {
      clearTimeout(viewRequestRef.current);
    }
    viewRequestRef.current = setTimeout(() => {
      fetchQuestion({ incrementView: true });
    }, 0);

    return () => {
      if (viewRequestRef.current) {
        clearTimeout(viewRequestRef.current);
      }
    };
  }, [id]);

  const handleSubmitAnswer = async () => {
    if (!answerText.trim()) return alert("Please type an answer!");
    try {
      await api.post('/forum/submit-answer', { questionId: id, answerText });
      setAnswerText('');
      fetchQuestion(); // Refresh without incrementing views
    } catch (error) {
      console.error("Error submitting answer:", error);
      alert("Failed to submit answer");
    }
  };

  const handleVote = async (type, itemId, isAnswer = false) => {
    if (!user) {
      alert('Please login to vote');
      return;
    }

    const endpoint = isAnswer 
      ? (type === 'up' ? '/forum/upvote-answer' : '/forum/downvote-answer')
      : (type === 'up' ? '/forum/upvote-question' : '/forum/downvote-question');
    
    const body = isAnswer ? { questionId: id, answerId: itemId } : { id: itemId };

    try {
      const res = await api.post(endpoint, body);
      
      // Update user votes
      setUserVotes(prev => {
        const next = { ...prev };
        if (res.data.userVote) {
          next[itemId] = res.data.userVote;
        } else {
          delete next[itemId];
        }
        return next;
      });
      
      // Update votes count
      if (isAnswer) {
        setQuestion(prev => ({
          ...prev,
          answers: prev.answers.map(ans => 
            ans._id === itemId ? { ...ans, votes: res.data.votes } : ans
          )
        }));
      } else {
        setQuestion(prev => ({ ...prev, votes: res.data.votes }));
      }
    } catch (error) {
      console.error("Error voting:", error);
    }
  };

  if (loading) return <Layout>Loading...</Layout>;
  if (!question) return <Layout>Question not found</Layout>;

  return (
    <Layout>
      <div className="mainpage forum-detail-page">
        <div className="toptop">
          <div className="top">
            <div className="searchques">
              <h1 className="outfit" id="questionHeading">{question.heading}</h1>
            </div>
          </div>
          <div className="po_qdetails outfit">
            <p id="viewsText">Viewed {question.views} times</p>
          </div>
          <div className="searchquesinput">
            <div className="outfit po_reward">
              <p id="rewardText">A Reward of +{question.wealth} wealth is offered ✨</p>
            </div>
          </div>
        </div>

        <hr />

        <div className="po_main">
          <div className="po_question">
            <div className="po_qelab">
              <div className="updownvote">
                <div className={`upvote-triangle ${userVotes[question._id] === 'upvote' ? 'active' : ''}`} onClick={() => handleVote('up', question._id)}></div>
                <div className="po_qnoofvotes outfit"><p>{question.votes}</p></div>
                <div className={`downvote-triangle ${userVotes[question._id] === 'downvote' ? 'active' : ''}`} onClick={() => handleVote('down', question._id)}></div>
                <div><img src="/assets/save.png" alt="" className="po_save" /></div>
              </div>

              <div className="po_qdesc outfit">
                <div
                  className="rich-text"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(question.desc) }}
                />
                <div className="po_qtags">
                  {(question.tags || []).map((tag, idx) => (
                    <div key={idx}><p>{tag}</p></div>
                  ))}
                </div>
                <div className="po_user">
                  <div className="po_useruser">
                    <img src="/assets/duck_with_A_gun 1.png" alt="" />
                    <p>{question.asker?.name || "Anonymous"}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="outfit">
              <div className="po_ansheading">
                <p>Answers :</p>
              </div>
              <div id="answersContainer">
                {(question.answers || []).map((ans) => (
                  <div key={ans._id}>
                    <div className="po_anselab">
                      <div className="ansupdownvote">
                        <div className={`upvote-triangle ${userVotes[ans._id] === 'upvote' ? 'active' : ''}`} onClick={() => handleVote('up', ans._id, true)}></div>
                        <div className="po_qnoofvotes outfit"><p>{ans.votes}</p></div>
                        <div className={`downvote-triangle ${userVotes[ans._id] === 'downvote' ? 'active' : ''}`} onClick={() => handleVote('down', ans._id, true)}></div>
                      </div>
                      <div className="po_ansdesc outfit">
                          <div
                            className="rich-text"
                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(ans.desc) }}
                          />
                      </div>
                    </div>
                    <hr className="hr_answer" />
                  </div>
                ))}
              </div>
            </div>

            <div className="outfit po_userans">
              <div className="po_useransheading"><p>Answer to the Question :</p></div>
              <div className="po_useranscontainer">
                <div className="po_useranstools">
                  <img src="/assets/bold.png" alt="" />
                  <img src="/assets/italic.png" alt="" />
                  <img src="/assets/heading.png" alt="" />
                  <img src="/assets/codeansbox.png" alt="" />
                  <div id="submit-answer-btn" onClick={handleSubmitAnswer} style={{cursor: 'pointer'}}><p>Submit</p></div>
                </div>
                <textarea 
                  className="po_useransbox" 
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                ></textarea>
              </div>
            </div>
          </div>

          <div className="po_notice outfit">
            <div className="po_noticeboard">
              <p>Notice!</p>
              <hr className="noticeline" />
              <div className="po_noticenews">
                <div><img src="/assets/pin.png" alt="" /><p>Abhisarga night concert ticket sale is now live!</p></div>
                <div><img src="/assets/pin.png" alt="" /><p>Recharge Point now has Burgers because of a certain someone!</p></div>
                <div><img src="/assets/pin.png" alt="" /><p>Enigma , E-Cell , TedX are new Trend Setters!</p></div>
              </div>
              <hr className="noticeline" />
              <div className="po_noticenews">
                <div><img src="/assets/premium.png" alt="" /><p>Campus Connect Premium at ₹1000 ONLY!</p></div>
                <div><img src="/assets/premium.png" alt="" /><p>Get 30% OFF using student ID verification!</p></div>
                <div><img src="/assets/premium.png" alt="" /><p>Campus Connect can now track your attendance for you!</p></div>
              </div>
            </div>
            <div className="po_ads"><h1>Ads Come here</h1></div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ForumDetail;
