import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Layout from '../components/Layout';
import '../styles/Askquestion.css';

const AskQuestion = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ title: '', desc: '', tags: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/forum/ask', formData);
      navigate('/forum/questions');
    } catch (error) {
      console.error("Error asking question:", error);
      alert("Failed to ask question");
    }
  };

  return (
    <Layout>
      <div className="ask_mainpage ask-question-page">
        <p className="welcome">Welcome {user?.name}</p>
        <p className="addq">Add Question</p>
        <hr className="hrhr" />
        <div className="mainpg">
          <div className="mainmain">
            <form onSubmit={handleSubmit}>
              <div className="hoho">
                <p>Title</p>
                <input type="text" placeholder="Title" name="title" value={formData.title} onChange={handleChange} required />
              </div>
              <div className="outfit po_userans">
                <div className="po_useransheading"><p>Describe your Question:</p></div>
                <div className="po_useranscontainer">
                  <div className="po_useranstools">
                    <img src="/assets/bold.png" alt="" />
                    <img src="/assets/italic.png" alt="" />
                    <img src="/assets/heading.png" alt="" />
                    <img src="/assets/codeansbox.png" alt="" />
                  </div>
                  <textarea className="po_useransbox" name="desc" value={formData.desc} onChange={handleChange} required></textarea>  
                </div>
              </div>
              <div className="hoho">
                <p>Tags</p>
                <input type="text" placeholder="Tags (comma separated)" name="tags" value={formData.tags} onChange={handleChange} required />
              </div>
              <button type="submit">
                <p>Submit</p>
              </button>
            </form>
          </div>
          
          <div className="db_notice">
            <div className="po_noticeboard">
              <p>Notice!</p>
              <hr className="noticeline" />
              <div className="po_noticenews">
                <div><img src="/assets/pin.png" alt="" /><p>Abhisarga night concert ticket sale is now live! </p></div>
                <div><img src="/assets/pin.png" alt="" /><p>Recharge Point now has Burgers because of a certain someone!</p></div>
                <div><img src="/assets/pin.png" alt="" /><p>Enigma , E-Cell , TedX are new Trend Setters!</p></div>
              </div>
              <hr className="noticeline" />
              <div className="po_noticenews">
                <div><img src="/assets/premium.png" alt="" /><p>Campus Connect now brings you Premium at Rupees 1000 ONLY!</p></div>
                <div><img src="/assets/premium.png" alt="" /><p>Get 30% OFF using student id verification!</p></div>
                <div><img src="/assets/premium.png" alt="" /><p>Campus Connect now can track your attendance for you!</p></div>
              </div>
            </div>
            <div className="po_ads">
              <p>Ads Come Here</p>   
            </div>
          </div>
        </div>
        <hr className="hrhr" />
      </div>
    </Layout>
  );
};

export default AskQuestion;
