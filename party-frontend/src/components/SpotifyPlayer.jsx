import React, { useState, useEffect } from 'react';

export default function SpotifyPlayer({ accessToken, onReady, onPlayerStateChange }) {
  const [player, setPlayer] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!accessToken) return;

    // Charger le script Spotify Web Playback SDK
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);

    // Callback appelé quand le SDK est chargé
    window.onSpotifyWebPlaybackSDKReady = () => {
      const spotifyPlayer = new window.Spotify.Player({
        name: 'Spotify Party Player',
        getOAuthToken: cb => { cb(accessToken); },
        volume: 0.5
      });

      // Événements du player
      spotifyPlayer.addListener('ready', ({ device_id }) => {
        console.log('✅ Player prêt avec Device ID:', device_id);
        setDeviceId(device_id);
        setIsReady(true);
        if (onReady) onReady(device_id);
      });

      spotifyPlayer.addListener('not_ready', ({ device_id }) => {
        console.log('❌ Device ID déconnecté', device_id);
        setIsReady(false);
      });

      spotifyPlayer.addListener('player_state_changed', state => {
        if (!state) return;
        console.log('🎵 État du player:', state);
        if (onPlayerStateChange) onPlayerStateChange(state);
      });

      // Erreurs
      spotifyPlayer.addListener('initialization_error', ({ message }) => {
        console.error('Erreur initialisation:', message);
      });

      spotifyPlayer.addListener('authentication_error', ({ message }) => {
        console.error('Erreur authentification:', message);
      });

      spotifyPlayer.addListener('account_error', ({ message }) => {
        console.error('Erreur compte (Premium requis?):', message);
      });

      spotifyPlayer.addListener('playback_error', ({ message }) => {
        console.error('Erreur lecture:', message);
      });

      // Connecter le player
      spotifyPlayer.connect().then(success => {
        if (success) {
          console.log('✅ Player connecté à Spotify');
        }
      });

      setPlayer(spotifyPlayer);
    };

    return () => {
      if (player) {
        player.disconnect();
      }
    };
  }, [accessToken]);

  return (
    <div style={styles.container}>
      {isReady ? (
        <div style={styles.status}>
          <span style={styles.indicator}>🟢</span>
          <span>Lecteur Spotify prêt</span>
        </div>
      ) : (
        <div style={styles.status}>
          <span style={styles.indicator}>🟡</span>
          <span>Connexion au lecteur Spotify...</span>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '0.5rem',
    backgroundColor: '#f8f8f8',
    borderRadius: '8px',
    marginBottom: '1rem',
  },
  status: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.9rem',
    color: '#666',
  },
  indicator: {
    fontSize: '1.2rem',
  }
};