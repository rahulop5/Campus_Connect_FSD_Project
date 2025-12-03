import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchElection, voteCandidate, updateManifesto } from '../store/slices/electionSlice';
import Layout from '../components/Layout';
import '../styles/Elections.css';

const Elections = () => {
  const { user } = useSelector((state) => state.auth);
  const { electionData: election, hasVoted, loading } = useSelector((state) => state.election);
  const dispatch = useDispatch();
  
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [newQuote, setNewQuote] = useState('');

  useEffect(() => {
    dispatch(fetchElection());
  }, [dispatch]);

  const handleVote = async (candidateId) => {
    if (hasVoted) return;
    if (!window.confirm("Are you sure you want to vote for this candidate? You cannot change your vote later.")) return;

    const result = await dispatch(voteCandidate(candidateId));
    if (voteCandidate.fulfilled.match(result)) {
      alert("Vote cast successfully!");
    } else {
      alert(result.payload || "Error casting vote");
    }
  };

  const handleUpdateQuote = async () => {
    const result = await dispatch(updateManifesto(newQuote));
    if (updateManifesto.fulfilled.match(result)) {
      setShowQuoteModal(false);
    } else {
      alert(result.payload || "Error updating quote");
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
                maxLength={300}
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
