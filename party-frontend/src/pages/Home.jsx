import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';

export default function Home({ user }) {
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState('');

  if (!user) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>🎵 Bienvenue sur Spotify Party</h1>
          <p style={styles.subtitle}>
            Connectez-vous avec Spotify pour créer ou rejoindre une room
          </p>
          
          <button 
            onClick={authService.login}
            style={styles.spotifyBtn}
          >
            <span style={styles.spotifyIcon}>♪</span>
            Se connecter avec Spotify
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>👋 Salut {user.display_name || 'Toi'} !</h1>
        <p style={styles.subtitle}>Que veux-tu faire ?</p>

        <div style={styles.actions}>
          <button
            onClick={() => navigate('/create-room')}
            style={{ ...styles.actionBtn, ...styles.createBtn }}
          >
            <span style={styles.btnIcon}>🎉</span>
            <div>
              <div style={styles.btnTitle}>Créer une Room</div>
              <div style={styles.btnSubtitle}>Commence une nouvelle partie</div>
            </div>
          </button>

          <div style={styles.joinSection}>
            <input
              type="text"
              placeholder="Code de la room (ex: ABC123)"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              style={styles.input}
              maxLength={6}
            />
            <button
              onClick={() => {
                if (roomCode.length === 6) {
                  navigate(`/room/${roomCode}`);
                }
              }}
              disabled={roomCode.length !== 6}
              style={{
                ...styles.actionBtn,
                ...styles.joinBtn,
                opacity: roomCode.length === 6 ? 1 : 0.5
              }}
            >
              <span style={styles.btnIcon}>🚪</span>
              <div>
                <div style={styles.btnTitle}>Rejoindre</div>
                <div style={styles.btnSubtitle}>Entre le code reçu</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: 'calc(100vh - 100px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '20px',
    padding: '3rem',
    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
    maxWidth: '600px',
    width: '100%',
  },
  title: {
    fontSize: '2.5rem',
    textAlign: 'center',
    color: '#333',
    marginBottom: '1rem',
  },
  subtitle: {
    fontSize: '1.2rem',
    textAlign: 'center',
    color: '#666',
    marginBottom: '2rem',
  },
  spotifyBtn: {
    width: '100%',
    padding: '1rem 2rem',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: 'white',
    background: 'linear-gradient(135deg, #1DB954 0%, #1ed760 100%)',
    border: 'none',
    borderRadius: '50px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    boxShadow: '0 4px 15px rgba(29, 185, 84, 0.3)',
    transition: 'transform 0.2s',
  },
  spotifyIcon: {
    fontSize: '1.5rem',
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  actionBtn: {
    width: '100%',
    padding: '1.5rem',
    fontSize: '1rem',
    fontWeight: 'bold',
    color: 'white',
    border: 'none',
    borderRadius: '15px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
    transition: 'transform 0.2s',
  },
  createBtn: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  joinBtn: {
    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  },
  btnIcon: {
    fontSize: '2rem',
  },
  btnTitle: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
  },
  btnSubtitle: {
    fontSize: '0.9rem',
    opacity: 0.9,
  },
  joinSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  input: {
    padding: '1rem',
    fontSize: '1.2rem',
    borderRadius: '10px',
    border: '2px solid #e0e0e0',
    textAlign: 'center',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    letterSpacing: '0.2rem',
  }
};