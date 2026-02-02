import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchElection, voteCandidate, updateManifesto } from '../store/slices/electionSlice';
import Layout from '../components/Layout';
import CandidateCard from '../components/CandidateCard';
import '../styles/Elections.css';

const Elections = () => {
  const { user } = useSelector((state) => state.auth);
  const { electionMeta: election, candidates, hasVoted, votedRoles, loading } = useSelector((state) => state.election);
  const dispatch = useDispatch();
  
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [newQuote, setNewQuote] = useState('');

  useEffect(() => {
    dispatch(fetchElection());
  }, [dispatch]);

  const handleVote = async (candidateId, candidateRole) => {
    if (!window.confirm("Are you sure you want to vote for this candidate? You cannot change your vote later.")) return;

    // Edge case: Verify candidate role is valid (frontend check)
    const ELECTION_ROLES = [
      'SDC President',
      'SLC President',
      'SDC Technical Secretary',
      'SDC Non-technical Secretary',
      'SLC Secretary',
      'SDC Treasurer'
    ];

    if (!candidateRole || !ELECTION_ROLES.includes(candidateRole)) {
      alert("Invalid candidate role. Please contact administrator.");
      return;
    }

    // Edge case: Check if user has already voted for this role
    if (votedRoles.includes(candidateRole)) {
      alert("You have already voted for this position.");
      return;
    }

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

  const isEnded = election?.status === 'ended';
  const sortedCandidates = [...candidates].sort((a, b) => (b.votes || 0) - (a.votes || 0));
  const totalVotes = sortedCandidates.reduce((sum, c) => sum + (c.votes || 0), 0);

  return (
    <Layout>
      <div className="elections-page">
        <div className="elections-header">
          <h1>{election?.title || 'Student Council Elections'}</h1>
          <p>{election?.description || 'Cast your vote for the future of our campus'}</p>
          {election && (
            <span className={`election-status badge-${isEnded ? 'ended' : 'active'}`}>
              {isEnded ? 'Ended' : 'Active'}
            </span>
          )}
          {hasVoted && !isEnded && (
            <div className="voted-indicator">You have voted</div>
          )}
        </div>

        {!election ? (
          <div className="no-election">
            <img src="/assets/vote-box.png" alt="No Election" onError={(e) => e.target.style.display='none'} />
            <h2>No Ongoing Election</h2>
            <p>Please check back later for upcoming student council elections.</p>
          </div>
        ) : isEnded ? (
          <div className="results-section">
            <h2 className="results-title">Election Results</h2>
            <div className="results-list">
              {sortedCandidates.map((candidate) => {
                const percentage = totalVotes > 0 ? Math.round((candidate.votes / totalVotes) * 100) : 0;
                return (
                  <div key={candidate.id || candidate.name} className="result-card">
                    <div className="result-header">
                      <img
                        src={candidate.image || '/assets/pfp 1.png'}
                        alt={candidate.name}
                        className="result-avatar"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      <div className="result-info">
                        <h3 className="result-name">{candidate.name}</h3>
                        <p className="result-meta">
                          {candidate.department}{candidate.year ? ` • ${candidate.year}` : ''}
                        </p>
                      </div>
                      <div className="result-votes">{candidate.votes} votes</div>
                    </div>
                    <div className="result-bar">
                      <div className="result-bar-fill" style={{ width: `${percentage}%` }} />
                    </div>
                    <div className="result-percent">{percentage}%</div>
                  </div>
                );
              })}
              {sortedCandidates.length === 0 && (
                <div className="no-election">
                  <h2>No candidates found</h2>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="role-groups">
            {Object.entries(
              candidates.reduce((acc, candidate) => {
                const role = candidate.role || 'Other';
                if (!acc[role]) acc[role] = [];
                acc[role].push(candidate);
                return acc;
              }, {})
            ).map(([role, roleCandidates]) => {
              const hasVotedForRole = votedRoles.includes(role);
              return (
                <div key={role} className="role-group">
                  <div className="role-header">
                    <h2 className="role-title">{role}</h2>
                    {hasVotedForRole && (
                      <div className="role-voted-indicator">You have voted for this position</div>
                    )}
                  </div>
                  <div className="candidates-grid">
                    {roleCandidates.map((candidate) => {
                      const isMe = user.id === candidate.studentId;
                      const actionLabel = isMe ? 'Edit My Quote' : (hasVotedForRole ? 'Voted' : 'Vote');
                      return (
                        <CandidateCard
                          key={candidate.id || candidate.name}
                          image={candidate.image}
                          name={candidate.name}
                          department={candidate.department || 'Department'}
                          year={candidate.year || 'Year'}
                          manifesto={candidate.manifesto}
                          onVote={isMe ? () => openQuoteModal(candidate.manifesto) : () => handleVote(candidate.id, candidate.role)}
                          actionLabel={actionLabel}
                          isSelected={false}
                          isDisabled={isEnded || (!isMe && hasVotedForRole)}
                        />
                      );
                    })}
                  </div>
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
