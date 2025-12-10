import React from 'react';

export default function TrackCard({ track, likes, threshold }) {
  if (!track || !track.uri) {
    return (
      <div style={styles.card}>
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>🎵 Aucune musique sélectionnée</p>
          <p style={styles.emptySubtext}>Attendez qu'une musique soit proposée...</p>
        </div>
      </div>
    );
  }

  const progress = threshold > 0 ? (likes / threshold) * 100 : 0;
  const isReady = likes >= threshold;

  return (
    <div style={styles.card}>
      {track.image_url && (
        <img 
          src={track.image_url} 
          alt={track.name}
          style={styles.image}
        />
      )}
      
      <div style={styles.info}>
        <h2 style={styles.trackName}>{track.name}</h2>
        <p style={styles.artist}>{track.artists}</p>
        
        <div style={styles.voteSection}>
          <div style={styles.progressBar}>
            <div 
              style={{
                ...styles.progressFill,
                width: `${Math.min(progress, 100)}%`,
                backgroundColor: isReady ? '#1DB954' : '#667eea'
              }}
            />
          </div>
          
          <div style={styles.voteInfo}>
            <span style={styles.voteCount}>
              👍 {likes} / {threshold}
            </span>
            {isReady && (
              <span style={styles.readyBadge}>✅ Prêt à jouer !</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: 'white',
    borderRadius: '15px',
    padding: '2rem',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    marginBottom: '2rem',
  },
  emptyState: {
    textAlign: 'center',
    padding: '2rem',
  },
  emptyText: {
    fontSize: '1.5rem',
    color: '#667eea',
    margin: '0 0 0.5rem 0',
  },
  emptySubtext: {
    color: '#666',
    margin: 0,
  },
  image: {
    width: '100%',
    maxWidth: '300px',
    borderRadius: '10px',
    marginBottom: '1.5rem',
    display: 'block',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  info: {
    textAlign: 'center',
  },
  trackName: {
    fontSize: '1.8rem',
    color: '#333',
    margin: '0 0 0.5rem 0',
  },
  artist: {
    fontSize: '1.2rem',
    color: '#666',
    margin: '0 0 1.5rem 0',
  },
  voteSection: {
    marginTop: '1.5rem',
  },
  progressBar: {
    height: '30px',
    backgroundColor: '#f0f0f0',
    borderRadius: '15px',
    overflow: 'hidden',
    marginBottom: '1rem',
  },
  progressFill: {
    height: '100%',
    transition: 'width 0.3s ease',
    borderRadius: '15px',
  },
  voteInfo: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '1rem',
  },
  voteCount: {
    fontSize: '1.3rem',
    fontWeight: 'bold',
    color: '#667eea',
  },
  readyBadge: {
    backgroundColor: '#1DB954',
    color: 'white',
    padding: '0.5rem 1rem',
    borderRadius: '20px',
    fontSize: '0.9rem',
    fontWeight: 'bold',
  }
};