import React from 'react';

export default function Header({ user, onLogout }) {
  return (
    <header style={styles.header}>
      <div style={styles.container}>
        <h1 style={styles.title}>🎵 Spotify Party</h1>
        {user && (
          <div style={styles.userInfo}>
            <span style={styles.userName}>👤 {user.display_name || user.spotify_id}</span>
            <button onClick={onLogout} style={styles.logoutBtn}>
              Déconnexion
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

const styles = {
  header: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '1rem 0',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: 'white',
    margin: 0,
    fontSize: '1.8rem',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  userName: {
    color: 'white',
    fontSize: '1rem',
  },
  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '0.9rem',
  }
};