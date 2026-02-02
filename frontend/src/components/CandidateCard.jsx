import PropTypes from 'prop-types';

const CandidateCard = ({
  image,
  name,
  department,
  year,
  manifesto,
  onVote,
  actionLabel,
  isSelected,
  isDisabled
}) => {
  const buttonLabel = isSelected ? 'Selected' : actionLabel;
  return (
    <div className={`candidate-card ${isSelected ? 'candidate-card--selected' : ''}`}>
      <img
        src={image || '/assets/pfp 1.png'}
        alt={name}
        className="candidate-img"
        onError={(e) => { e.target.style.display = 'none'; }}
      />
      <div className="candidate-info">
        <h3 className="candidate-name">{name}</h3>
        <p className="candidate-details">{department} • {year}</p>
      </div>

      <div className="candidate-quote candidate-quote--clamp">
        "{manifesto || 'No manifesto added yet.'}"
      </div>

      <button
        className={`vote-btn ${isSelected ? 'vote-btn--selected' : ''}`}
        onClick={onVote}
        disabled={isDisabled}
      >
        {buttonLabel}
      </button>
    </div>
  );
};

CandidateCard.propTypes = {
  image: PropTypes.string,
  name: PropTypes.string.isRequired,
  department: PropTypes.string.isRequired,
  year: PropTypes.string.isRequired,
  manifesto: PropTypes.string,
  onVote: PropTypes.func.isRequired,
  actionLabel: PropTypes.string,
  isSelected: PropTypes.bool,
  isDisabled: PropTypes.bool
};

CandidateCard.defaultProps = {
  image: '',
  manifesto: '',
  actionLabel: 'Vote',
  isSelected: false,
  isDisabled: false
};

export default CandidateCard;
