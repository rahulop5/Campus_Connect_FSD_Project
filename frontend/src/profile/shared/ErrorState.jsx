import React from 'react';

const ErrorState = ({ error, onRetry }) => {
  return (
    <div className="bodyContainer">
      <div style={{ color: '#ff6b6b', fontSize: '18px', textAlign: 'center', padding: '20px' }}>
        <p>{error}</p>
        <button
          onClick={onRetry}
          style={{
            padding: '10px 20px',
            marginTop: '10px',
            backgroundColor: '#2B9900',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    </div>
  );
};

export default ErrorState;
