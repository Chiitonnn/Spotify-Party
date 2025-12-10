import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { roomService } from '../services/api';
import SpotifyPlayer from '../components/SpotifyPlayer';

export default function Room({ user }) {
  const { code } = useParams();
  const navigate = useNavigate();
  
  const [roomState, setRoomState] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasJoined, setHasJoined] = useState(false);
  const [error, setError] = useState('');
  const [deviceId, setDeviceId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!code || code === 'undefined') {
      console.error('❌ Code de room invalide:', code);
      setError('Code de room invalide');
      setLoading(false);
    }
  }, [code]);

  const fetchRoomData = async () => {
    if (!code || code === 'undefined') return;
    
    try {
      const state = await roomService.getRoomState(code);
      const participantsData = await roomService.getParticipants(code);
      
      setRoomState(state);
      setParticipants(participantsData.participants || []);
      setLoading(false);
      setError('');
    } catch (err) {
      console.error('Erreur fetchRoomData:', err);
      setError('Impossible de charger la room');
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!user || !code || code === 'undefined') return;
    
    try {
      await roomService.joinRoom(code, user.spotify_id);
      setHasJoined(true);
      fetchRoomData();
    } catch (err) {
      console.error('Erreur join:', err);
      setError('Impossible de rejoindre la room');
    }
  };

  const handleVote = async (isLike) => {
    if (!user || !roomState?.current_track?.uri) return;
    try {
      await roomService.vote(code, user.spotify_id, isLike);
      fetchRoomData();
    } catch (err) {
      console.error('Erreur vote:', err);
    }
  };

  const handleRandomTrack = async () => {
    try {
      await roomService.getRandomTrack(code);
      fetchRoomData();
    } catch (err) {
      console.error('Erreur random:', err);
    }
  };

  const handleNextRound = async () => {
    try {
      await roomService.nextRound(code);
      fetchRoomData();
    } catch (err) {
      console.error('Erreur next round:', err);
    }
  };

  const handlePlayTrack = async () => {
    if (!deviceId) {
      alert('⚠️ Le lecteur Spotify n\'est pas prêt. Attends quelques secondes et réessaye.');
      return;
    }
    
    try {
      console.log('🎵 Lancement de la musique sur device:', deviceId);
      const result = await roomService.playTrack(code, deviceId);
      if (result.status === 'playing') {
        setIsPlaying(true);
        console.log('✅ Musique lancée !');
      } else {
        alert('❌ Erreur lors du lancement de la musique');
      }
    } catch (err) {
      console.error('Erreur play:', err);
      alert('❌ Impossible de lancer la musique. Vérifie que tu as Spotify Premium.');
    }
  };

  const handlePause = async () => {
    if (!deviceId) return;
    try {
      await roomService.pauseTrack(code, deviceId);
      setIsPlaying(false);
    } catch (err) {
      console.error('Erreur pause:', err);
    }
  };

  const handleResume = async () => {
    if (!deviceId) return;
    try {
      await roomService.resumeTrack(code, deviceId);
      setIsPlaying(true);
    } catch (err) {
      console.error('Erreur resume:', err);
    }
  };

  useEffect(() => {
    if (user && hasJoined && code && code !== 'undefined') {
      fetchRoomData();
      const interval = setInterval(fetchRoomData, 3000);
      return () => clearInterval(interval);
    }
  }, [code, user, hasJoined]);

  useEffect(() => {
    if (user && code && code !== 'undefined') {
      fetchRoomData();
    }
  }, [user, code]);

  if (!code || code === 'undefined') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2>❌ Code de room invalide</h2>
          <button onClick={() => navigate('/')} style={styles.btn}>Retour à l'accueil</button>
        </div>
      </div>
    );
  }

  if (loading) return <div style={styles.loading}>Chargement...</div>;

  if (!user) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2>Connexion requise</h2>
          <button onClick={() => navigate('/')} style={styles.btn}>Retour</button>
        </div>
      </div>
    );
  }

  if (!hasJoined && user) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.roomTitle}>Room {code}</h1>
          {error && <div style={styles.error}>{error}</div>}
          <button onClick={handleJoinRoom} style={styles.btn}>🚪 Rejoindre</button>
          <button onClick={() => navigate('/')} style={styles.btnSecondary}>Annuler</button>
        </div>
      </div>
    );
  }

  const isHost = roomState?.room && participants.length > 0 && 
                 participants[0]?.user_id === user.id;
  
  const canPlay = roomState?.likes >= roomState?.room.like_threshold;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1>Room: {code}</h1>
          <p style={styles.shareText}>Partage ce code avec tes amis !</p>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.participantCount}>
            👥 {participants.length} participant{participants.length > 1 ? 's' : ''}
          </div>
          {isHost && <div style={styles.hostBadge}>👑 Hôte</div>}
        </div>
      </div>

      {/* Lecteur Spotify - Visible uniquement pour l'hôte */}
      {isHost && user && (
        <SpotifyPlayer 
          accessToken={user.access_token} 
          onReady={(id) => {
            console.log('🎵 Device ID reçu:', id);
            setDeviceId(id);
          }}
        />
      )}

      {error && <div style={styles.error}>{error}</div>}

      {roomState?.current_track?.uri ? (
        <div style={styles.trackCard}>
          {roomState.current_track.image_url && (
            <img src={roomState.current_track.image_url} alt="Cover" style={styles.image} />
          )}
          <h2 style={styles.trackName}>{roomState.current_track.name}</h2>
          <p style={styles.trackArtist}>{roomState.current_track.artists}</p>
          
          <div style={styles.progressSection}>
            <div style={styles.progressBar}>
              <div 
                style={{
                  ...styles.progressFill,
                  width: `${Math.min((roomState.likes / roomState.room.like_threshold) * 100, 100)}%`,
                  backgroundColor: canPlay ? '#1DB954' : '#667eea'
                }}
              />
            </div>
            <div style={styles.voteCount}>
              👍 {roomState.likes} / {roomState.room.like_threshold}
              {canPlay && <span style={styles.readyBadge}>✅ Prêt !</span>}
            </div>
          </div>
          
          <div style={styles.voteButtons}>
            <button onClick={() => handleVote(false)} style={styles.dislikeBtn}>👎 Dislike</button>
            <button onClick={() => handleVote(true)} style={styles.likeBtn}>👍 Like</button>
          </div>
        </div>
      ) : (
        <div style={styles.trackCard}>
          <p style={styles.noTrack}>🎵 Aucune musique sélectionnée</p>
          <p style={styles.noTrackSub}>L'hôte peut choisir une musique aléatoire</p>
        </div>
      )}

      {isHost && (
        <div style={styles.controls}>
          <h3 style={styles.controlsTitle}>🎮 Contrôles Hôte</h3>
          
          <div style={styles.controlButtons}>
            <button onClick={handleRandomTrack} style={styles.controlBtn}>
              🎲 Musique aléatoire
            </button>
            <button 
              onClick={handleNextRound} 
              style={styles.controlBtn}
              disabled={!roomState?.current_track?.uri}
            >
              ⏭️ Tour suivant
            </button>
          </div>

          {/* Contrôles de lecture */}
          {roomState?.current_track?.uri && canPlay && (
            <div style={styles.playbackControls}>
              {!isPlaying ? (
                <button 
                  onClick={handlePlayTrack} 
                  style={styles.playBtn}
                  disabled={!deviceId}
                >
                  ▶️ Lancer la musique
                </button>
              ) : (
                <div style={styles.playbackButtons}>
                  <button onClick={handlePause} style={styles.playbackBtn}>
                    ⏸️ Pause
                  </button>
                  <button onClick={handleResume} style={styles.playbackBtn}>
                    ▶️ Reprendre
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div style={styles.participants}>
        <h3>👥 Participants</h3>
        <div style={styles.participantsList}>
          {participants.map((p, i) => (
            <div key={i} style={styles.participant}>
              <span>{p.display_name || p.spotify_id}</span>
              {i === 0 && <span style={styles.hostBadgeSmall}>👑</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: '800px', margin: '0 auto', padding: '2rem' },
  loading: { textAlign: 'center', marginTop: '3rem', fontSize: '1.5rem', color: '#667eea' },
  card: { 
    backgroundColor: 'white', 
    padding: '2rem', 
    borderRadius: '15px', 
    textAlign: 'center',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
  },
  roomTitle: { fontSize: '2rem', color: '#333', marginBottom: '1.5rem' },
  header: { 
    backgroundColor: 'white', 
    padding: '1.5rem', 
    borderRadius: '15px', 
    marginBottom: '1rem', 
    display: 'flex', 
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
  },
  headerRight: { display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' },
  shareText: { color: '#666', fontSize: '0.9rem', margin: '0.5rem 0 0 0' },
  participantCount: { 
    backgroundColor: '#f0f0f0', 
    padding: '0.5rem 1rem', 
    borderRadius: '20px',
    fontSize: '0.9rem',
    fontWeight: 'bold'
  },
  hostBadge: { 
    backgroundColor: '#FFD700', 
    color: '#333',
    padding: '0.3rem 0.8rem', 
    borderRadius: '15px',
    fontSize: '0.8rem',
    fontWeight: 'bold'
  },
  hostBadgeSmall: { fontSize: '0.8rem', marginLeft: '0.5rem' },
  trackCard: { 
    backgroundColor: 'white', 
    padding: '2rem', 
    borderRadius: '15px', 
    marginBottom: '2rem', 
    textAlign: 'center',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
  },
  image: { width: '250px', borderRadius: '10px', marginBottom: '1.5rem' },
  trackName: { fontSize: '1.8rem', color: '#333', margin: '0 0 0.5rem 0' },
  trackArtist: { fontSize: '1.2rem', color: '#666', margin: '0 0 1.5rem 0' },
  noTrack: { fontSize: '1.5rem', color: '#667eea', margin: '0 0 0.5rem 0' },
  noTrackSub: { fontSize: '1rem', color: '#999', margin: 0 },
  progressSection: { marginBottom: '1.5rem' },
  progressBar: { 
    height: '25px', 
    backgroundColor: '#f0f0f0', 
    borderRadius: '15px', 
    overflow: 'hidden',
    marginBottom: '1rem'
  },
  progressFill: { height: '100%', transition: 'width 0.3s ease, background-color 0.3s ease' },
  voteCount: { fontSize: '1.3rem', fontWeight: 'bold', color: '#667eea', display: 'flex', gap: '1rem', justifyContent: 'center', alignItems: 'center' },
  readyBadge: { backgroundColor: '#1DB954', color: 'white', padding: '0.3rem 0.8rem', borderRadius: '15px', fontSize: '0.9rem' },
  voteButtons: { display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' },
  likeBtn: { 
    padding: '1rem 2.5rem', 
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white', 
    border: 'none', 
    borderRadius: '50px', 
    cursor: 'pointer', 
    fontSize: '1.1rem',
    fontWeight: 'bold',
    boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
  },
  dislikeBtn: { 
    padding: '1rem 2.5rem', 
    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    color: 'white', 
    border: 'none', 
    borderRadius: '50px', 
    cursor: 'pointer', 
    fontSize: '1.1rem',
    fontWeight: 'bold',
    boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
  },
  controls: { 
    backgroundColor: 'white', 
    padding: '1.5rem', 
    borderRadius: '15px', 
    marginBottom: '2rem',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
  },
  controlsTitle: { 
    fontSize: '1.3rem', 
    color: '#333', 
    marginBottom: '1rem',
    textAlign: 'center'
  },
  controlButtons: { display: 'flex', gap: '1rem', marginBottom: '1rem' },
  controlBtn: { 
    flex: 1,
    padding: '1rem', 
    background: 'linear-gradient(135deg, #1DB954 0%, #1ed760 100%)',
    color: 'white', 
    border: 'none', 
    borderRadius: '10px', 
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 'bold',
    boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
  },
  playbackControls: { borderTop: '1px solid #eee', paddingTop: '1rem', marginTop: '1rem' },
  playBtn: {
    width: '100%',
    padding: '1.2rem',
    background: 'linear-gradient(135deg, #1DB954 0%, #1ed760 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '50px',
    cursor: 'pointer',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    boxShadow: '0 4px 15px rgba(29, 185, 84, 0.3)'
  },
  playbackButtons: { display: 'flex', gap: '1rem' },
  playbackBtn: {
    flex: 1,
    padding: '1rem',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 'bold'
  },
  btn: { 
    padding: '1rem 2rem', 
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white', 
    border: 'none', 
    borderRadius: '50px', 
    cursor: 'pointer', 
    width: '100%',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    marginBottom: '0.5rem',
    boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
  },
  btnSecondary: { 
    padding: '0.8rem 2rem', 
    backgroundColor: 'transparent',
    color: '#666', 
    border: 'none', 
    cursor: 'pointer',
    fontSize: '0.9rem'
  },
  participants: { 
    backgroundColor: 'white', 
    padding: '1.5rem', 
    borderRadius: '15px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
  },
  participantsList: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '0.5rem',
    marginTop: '1rem'
  },
  participant: { 
    padding: '0.8rem', 
    backgroundColor: '#f8f8f8', 
    borderRadius: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  error: { 
    padding: '1rem', 
    backgroundColor: '#fee', 
    color: '#c00', 
    borderRadius: '10px', 
    marginBottom: '1rem',
    textAlign: 'center'
  }
};