import { useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useSelector } from 'react-redux';
import api from '../api/axios';
import Layout from '../components/Layout';
import '../styles/Askquestion.css';

const AskQuestion = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ title: '', desc: '', tags: '' });
  const [formatState, setFormatState] = useState({ bold: false, italic: false });
  const editorRef = useRef(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const updateFormatState = () => {
    setFormatState({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
    });
  };

  const syncDesc = () => {
    const html = editorRef.current?.innerHTML || '';
    setFormData((prev) => ({ ...prev, desc: html }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const descText = editorRef.current?.textContent?.trim() || '';
    const descHtml = editorRef.current?.innerHTML || '';
    if (!descText) {
      alert('Please describe your question');
      return;
    }
    try {
      await api.post('/forum/ask', { ...formData, desc: descHtml });
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
            <form onSubmit={handleSubmit} className='ask_question_form' >
              <div className="hoho">
                <p>Title</p>
                <input type="text" placeholder="Title" name="title" value={formData.title} onChange={handleChange} required maxLength={300} />
              </div>
              <div className="outfit po_userans">
                <div className="po_useransheading"><p>Describe your Question:</p></div>
                <div className="po_useranscontainer">
                  <div className="po_useranstools">
                    <button
                      type="button"
                      className={`tool-btn ${formatState.bold ? 'active' : ''}`}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        document.execCommand('bold');
                        updateFormatState();
                        editorRef.current?.focus();
                      }}
                      aria-label="Bold"
                      title="Bold"
                    >
                      <img src="/assets/bold.png" alt="Bold" className="tool-icon" />
                    </button>
                    <button
                      type="button"
                      className={`tool-btn ${formatState.italic ? 'active' : ''}`}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        document.execCommand('italic');
                        updateFormatState();
                        editorRef.current?.focus();
                      }}
                      aria-label="Italic"
                      title="Italic"
                    >
                      <img src="/assets/italic.png" alt="Italic" className="tool-icon" />
                    </button>
                    <button
                      type="button"
                      className="tool-btn heading-btn"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        document.execCommand('formatBlock', false, 'h3');
                        editorRef.current?.focus();
                      }}
                      aria-label="Heading"
                      title="Heading"
                    >
                      <span>Heading</span>
                      <img src="/assets/heading.png" alt="" className="heading-icon" />
                    </button>
                    <button
                      type="button"
                      className="tool-btn"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        document.execCommand('formatBlock', false, 'pre');
                        editorRef.current?.focus();
                      }}
                      aria-label="Code Block"
                      title="Code Block"
                    >
                      <img src="/assets/codeansbox.png" alt="Code Block" className="tool-icon" />
                    </button>
                  </div>
                  <div
                    ref={editorRef}
                    className="po_useransbox"
                    contentEditable
                    suppressContentEditableWarning
                    role="textbox"
                    aria-multiline="true"
                    data-placeholder="Describe your question here..."
                    onInput={syncDesc}
                    onKeyUp={updateFormatState}
                    onMouseUp={updateFormatState}
                    onFocus={updateFormatState}
                  />
                </div>
              </div>
              <div className="hoho">
                <p>Tags</p>
                <input type="text" placeholder="Tags (comma separated)" name="tags" value={formData.tags} onChange={handleChange} required maxLength={300} />
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
