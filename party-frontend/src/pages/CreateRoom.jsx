import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { roomService } from '../services/api';

export default function CreateRoom({ user }) {
  const navigate = useNavigate();
  const [threshold, setThreshold] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!user) {
      setError('Vous devez être connecté');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const room = await roomService.createRoom(user.spotify_id, threshold);
      console.log('✅ Room créée:', room);
      
      // Vérifier que le code existe
      if (!room.code) {
        console.error('❌ Pas de code dans la réponse:', room);
        setError('Erreur: pas de code de room reçu');
        setLoading(false);
        return;
      }
      
      // Rediriger vers la room
      console.log(`🚀 Redirection vers /room/${room.code}`);
      navigate(`/room/${room.code}`);
    } catch (err) {
      console.error('Erreur création room:', err);
      setError('Erreur lors de la création de la room');
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🎉 Créer une Room</h1>
        <p style={styles.subtitle}>Configure ta room avant de commencer</p>

        <div style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>
              Seuil de likes pour jouer la musique
            </label>
            <div style={styles.thresholdSelector}>
              <button
                onClick={() => setThreshold(Math.max(1, threshold - 1))}
                style={styles.thresholdBtn}
              >
                −
              </button>
              <span style={styles.thresholdValue}>{threshold}</span>
              <button
                onClick={() => setThreshold(threshold + 1)}
                style={styles.thresholdBtn}
              >
                +
              </button>
            </div>
            <p style={styles.hint}>
              Il faudra {threshold} like{threshold > 1 ? 's' : ''} pour qu'une musique soit jouée
            </p>
          </div>

          {error && (
            <div style={styles.error}>{error}</div>
          )}

          <button
            onClick={handleCreate}
            disabled={loading}
            style={{
              ...styles.createBtn,
              opacity: loading ? 0.5 : 1
            }}
          >
            {loading ? 'Création...' : '✨ Créer la Room'}
          </button>

          <button
            onClick={() => navigate('/')}
            style={styles.cancelBtn}
          >
            Annuler
          </button>
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
    maxWidth: '500px',
    width: '100%',
  },
  title: {
    fontSize: '2rem',
    textAlign: 'center',
    color: '#333',
    marginBottom: '0.5rem',
  },
  subtitle: {
    fontSize: '1rem',
    textAlign: 'center',
    color: '#666',
    marginBottom: '2rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  label: {
    fontSize: '1.1rem',
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  thresholdSelector: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '2rem',
  },
  thresholdBtn: {
    width: '50px',
    height: '50px',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    cursor: 'pointer',
    boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
  },
  thresholdValue: {
    fontSize: '3rem',
    fontWeight: 'bold',
    color: '#667eea',
    minWidth: '80px',
    textAlign: 'center',
  },
  hint: {
    fontSize: '0.9rem',
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  createBtn: {
    padding: '1rem 2rem',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: 'white',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: '50px',
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
    marginTop: '1rem',
  },
  cancelBtn: {
    padding: '0.8rem 2rem',
    fontSize: '1rem',
    color: '#666',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
  },
  error: {
    padding: '1rem',
    backgroundColor: '#fee',
    color: '#c00',
    borderRadius: '10px',
    textAlign: 'center',
  }
};