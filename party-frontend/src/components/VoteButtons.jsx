import React, { useState } from 'react';

export default function VoteButtons({ onVote, disabled }) {
  const [voting, setVoting] = useState(false);

  const handleVote = async (isLike) => {
    setVoting(true);
    await onVote(isLike);
    setVoting(false);
  };

  return (
    <div style={styles.container}>
      <button
        onClick={() => handleVote(false)}
        disabled={disabled || voting}
        style={{
          ...styles.button,
          ...styles.dislikeBtn,
          opacity: disabled || voting ? 0.5 : 1,
        }}
      >
        <span style={styles.icon}>👎</span>
        <span>Dislike</span>
      </button>

      <button
        onClick={() => handleVote(true)}
        disabled={disabled || voting}
        style={{
          ...styles.button,
          ...styles.likeBtn,
          opacity: disabled || voting ? 0.5 : 1,
        }}
      >
        <span style={styles.icon}>👍</span>
        <span>Like</span>
      </button>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    marginTop: '1.5rem',
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '1rem 2rem',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '50px',
    cursor: 'pointer',
    transition: 'all 0.3s',
    boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
  },
  icon: {
    fontSize: '1.5rem',
  },
  likeBtn: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
  },
  dislikeBtn: {
    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    color: 'white',
  }
};