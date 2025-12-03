import { useState, useEffect } from 'react';
import api from '../api/axios';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import '../styles/Elections.css';

const Elections = () => {
  const { user } = useAuth();
  const [election, setElection] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [newQuote, setNewQuote] = useState('');

  const fetchElection = async () => {
    try {
      const res = await api.get('/election');
      setElection(res.data.election);
      setHasVoted(res.data.hasVoted);
    } catch (error) {
      console.error("Error fetching election:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchElection();
  }, []);

  const handleVote = async (candidateId) => {
    if (hasVoted) return;
    if (!window.confirm("Are you sure you want to vote for this candidate? You cannot change your vote later.")) return;

    try {
      await api.post('/election/vote', { candidateId });
      setHasVoted(true);
      fetchElection(); // Refresh data
      alert("Vote cast successfully!");
    } catch (error) {
      alert(error.response?.data?.message || "Error casting vote");
    }
  };

  const handleUpdateQuote = async () => {
    try {
      await api.post('/election/manifesto', { manifesto: newQuote });
      setShowQuoteModal(false);
      fetchElection(); // Refresh data
    } catch (error) {
      alert(error.response?.data?.message || "Error updating quote");
    }
  };

  const openQuoteModal = (currentQuote) => {
    setNewQuote(currentQuote);
    setShowQuoteModal(true);
  };

  if (loading) return <div style={{color:'white', textAlign:'center', marginTop:'100px'}}>Loading...</div>;

  return (
    <Layout>
      <div className="elections-page">
        <div className="elections-header">
          <h1>Student Council Elections</h1>
          <p>Cast your vote for the future of our campus</p>
        </div>

        {(!election || election.status === 'inactive') ? (
          <div className="no-election">
            <img src="/assets/vote-box.png" alt="No Election" onError={(e) => e.target.style.display='none'} />
            <h2>No Ongoing Election</h2>
            <p>Please check back later for upcoming student council elections.</p>
          </div>
        ) : (
          <div className="candidates-grid">
            {election.candidates.map((candidate) => {
              const isMe = user.id === candidate.student._id;
              return (
                <div key={candidate.student._id} className="candidate-card">
                  <img 
                    src={candidate.student.pfp || "/assets/pfp 1.png"} 
                    alt={candidate.student.name} 
                    className="candidate-img" 
                  />
                  <div className="candidate-info">
                    <h3 className="candidate-name">{candidate.student.name}</h3>
                    <p className="candidate-details">{candidate.student.branch} • UG{candidate.student.ug}</p>
                  </div>
                  
                  <div className="candidate-quote">
                    "{candidate.manifesto || "No quote added yet."}"
                  </div>

                  {isMe ? (
                    <button className="edit-quote-btn" onClick={() => openQuoteModal(candidate.manifesto)}>
                      Edit My Quote
                    </button>
                  ) : (
                    <button 
                      className="vote-btn" 
                      onClick={() => handleVote(candidate.student._id)}
                      disabled={hasVoted}
                    >
                      {hasVoted ? "Voted" : "Vote"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Edit Quote Modal */}
        {showQuoteModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Update Your Campaign Quote</h3>
              <textarea 
                value={newQuote} 
                onChange={(e) => setNewQuote(e.target.value)}
                placeholder="Enter your manifesto or quote here..."
                maxLength={200}
              />
              <div className="modal-actions">
                <button className="cancel-btn" onClick={() => setShowQuoteModal(false)}>Cancel</button>
                <button className="save-btn" onClick={handleUpdateQuote}>Save</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Elections;
