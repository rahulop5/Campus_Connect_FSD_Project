import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import api from '../api/axios';
import Layout from '../components/Layout';
import '../styles/Problemslvfrm.css';

const ForumList = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [selectedSortBy, setSelectedSortBy] = useState('recent');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [hoveredUser, setHoveredUser] = useState(null);
  const [userDetails, setUserDetails] = useState({});

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

  const toggleFilters = () => {
    setFiltersVisible(!filtersVisible);
  };

  const handleUserHover = async (userId) => {
    if (!userId || userDetails[userId]) {
      setHoveredUser(userId);
      return;
    }
    
    setHoveredUser(userId);
    
    try {
      const res = await api.get(`/student/user/${userId}`);
      setUserDetails(prev => ({
        ...prev,
        [userId]: res.data
      }));
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  };

  const handleUserLeave = () => {
    setHoveredUser(null);
  };

  // Filter and sort questions
  const getFilteredQuestions = () => {
    let filtered = [...questions];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(q => 
        q.heading?.toLowerCase().includes(query) || 
        q.desc?.toLowerCase().includes(query) ||
        q.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (selectedFilter !== 'all') {
      if (selectedFilter === 'answered') {
        filtered = filtered.filter(q => q.answers && q.answers.length > 0);
      } else if (selectedFilter === 'unanswered') {
        filtered = filtered.filter(q => !q.answers || q.answers.length === 0);
      }
    }

    // Sort
    if (selectedSortBy === 'recent') {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (selectedSortBy === 'votes') {
      filtered.sort((a, b) => (b.votes || 0) - (a.votes || 0));
    } else if (selectedSortBy === 'answers') {
      filtered.sort((a, b) => (b.answers?.length || 0) - (a.answers?.length || 0));
    }

    return filtered;
  };

  const filteredQuestions = getFilteredQuestions();

  return (
    <Layout>
      <div className="forum-page">
        <div className="forum-container">
          {/* Header Section */}
          <div className="forum-header">
            <div className="forum-title-section">
              <h1 className="forum-title">
                Q&A <span className="green-accent">Forum</span>
              </h1>
              <p className="forum-subtitle">
                {loading ? "Loading..." : `${filteredQuestions.length} Questions`}
              </p>
            </div>
            <Link to="/forum/ask" className="ask-question-btn">
              <span>+</span> Ask Question
            </Link>
          </div>

          {/* Search and Filter Section */}
          <div className="forum-search-section">
            <div className={`search-filter-container ${filtersVisible ? 'filters-open' : ''}`}>
              <div className="search-bar">
                <svg className="search-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM18 18l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <input
                  type="text"
                  placeholder="Search questions, tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
              
              <div className="filter-panel">
                <div className="filter-group">
                  <label>Sort By</label>
                  <div className="filter-options">
                    <button 
                      className={selectedSortBy === 'recent' ? 'active' : ''}
                      onClick={() => setSelectedSortBy('recent')}
                    >
                      Recent
                    </button>
                    <button 
                      className={selectedSortBy === 'votes' ? 'active' : ''}
                      onClick={() => setSelectedSortBy('votes')}
                    >
                      Votes
                    </button>
                    <button 
                      className={selectedSortBy === 'answers' ? 'active' : ''}
                      onClick={() => setSelectedSortBy('answers')}
                    >
                      Answers
                    </button>
                  </div>
                </div>
                <div className="filter-group">
                  <label>Filter By</label>
                  <div className="filter-options">
                    <button 
                      className={selectedFilter === 'all' ? 'active' : ''}
                      onClick={() => setSelectedFilter('all')}
                    >
                      All
                    </button>
                    <button 
                      className={selectedFilter === 'answered' ? 'active' : ''}
                      onClick={() => setSelectedFilter('answered')}
                    >
                      Answered
                    </button>
                    <button 
                      className={selectedFilter === 'unanswered' ? 'active' : ''}
                      onClick={() => setSelectedFilter('unanswered')}
                    >
                      Unanswered
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <button className="filter-toggle-btn" onClick={toggleFilters}>
              <img src="/assets/filter (1).png" alt="Filter" />
            </button>
          </div>

          {/* Questions List */}
          <div className="questions-list">
            {loading ? (
              <div className="loading-state">Loading questions...</div>
            ) : filteredQuestions.length === 0 ? (
              <div className="empty-state">
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                  <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="2" opacity="0.2"/>
                  <path d="M32 20v16M32 44h.02" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                </svg>
                <p>No questions found</p>
              </div>
            ) : (
              filteredQuestions.map((q) => (
                <div key={q._id} className="question-card">
                  <div className="question-stats">
                    <div className="stat-item">
                      <span className="stat-value">{q.votes || 0}</span>
                      <span className="stat-label">votes</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-value">{q.answers?.length || 0}</span>
                      <span className="stat-label">answers</span>
                    </div>
                  </div>

                  <div className="question-content">
                    <Link to={`/forum/question/${q._id}`} className="question-link">
                      <h3 className="question-heading">{q.heading}</h3>
                    </Link>
                    <div
                      className="question-description"
                      dangerouslySetInnerHTML={{
                        __html: q.desc ? sanitizeHtml(q.desc) : 'No description available.'
                      }}
                    />
                    {q.tags && q.tags.length > 0 && (
                      <div className="question-tags">
                        {q.tags.map((tag, idx) => (
                          <span key={idx} className="tag">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="question-meta">
                    <div 
                      className="question-author"
                      onMouseEnter={() => handleUserHover(q.asker?._id)}
                      onMouseLeave={handleUserLeave}
                    >
                      <img src="/assets/duck_with_A_gun 1.png" alt={q.asker?.name || "User"} />
                      <span>{q.asker?.name || "Anonymous"}</span>
                      {q.asker?.role === 'Professor' && (
                        <span className="faculty-badge">Faculty</span>
                      )}
                      
                      {hoveredUser === q.asker?._id && (
                        <div className="user-dropdown">
                          <div className="dropdown-header">
                            <img src="/assets/duck_with_A_gun 1.png" alt={q.asker?.name} />
                            <div>
                              <h4>{q.asker?.name || "Anonymous"}</h4>
                              <p className="user-role">{q.asker?.role || "Student"}</p>
                            </div>
                          </div>
                          {userDetails[q.asker?._id] && (
                            <div className="dropdown-body">
                              {userDetails[q.asker._id].roll && (
                                <div className="dropdown-item">
                                  <span className="item-label">Roll Number:</span>
                                  <span className="item-value">{userDetails[q.asker._id].roll}</span>
                                </div>
                              )}
                              {userDetails[q.asker._id].branch && (
                                <div className="dropdown-item">
                                  <span className="item-label">Branch:</span>
                                  <span className="item-value">{userDetails[q.asker._id].branch}</span>
                                </div>
                              )}
                              {userDetails[q.asker._id].ug && (
                                <div className="dropdown-item">
                                  <span className="item-label">Year:</span>
                                  <span className="item-value">UG{userDetails[q.asker._id].ug}</span>
                                </div>
                              )}
                              {userDetails[q.asker._id].section && (
                                <div className="dropdown-item">
                                  <span className="item-label">Section:</span>
                                  <span className="item-value">{userDetails[q.asker._id].section}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
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
