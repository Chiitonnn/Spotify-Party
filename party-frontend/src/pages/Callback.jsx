import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function Callback({ onUserLoaded }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const userParam = searchParams.get('user');
    
    if (userParam) {
      try {
        // Décoder et parser les infos user
        const user = JSON.parse(decodeURIComponent(userParam));
        console.log('✅ User récupéré:', user);
        
        // Sauvegarder dans le localStorage via le hook
        onUserLoaded(user);
        
        // Rediriger vers la home
        navigate('/');
      } catch (err) {
        console.error('❌ Erreur parsing user:', err);
        navigate('/');
      }
    } else {
      console.warn('⚠️ Pas de paramètre user dans l\'URL');
      navigate('/');
    }
  }, [searchParams, navigate, onUserLoaded]);

  return (
    <div style={styles.container}>
      <div style={styles.loading}>
        <h2>🎵 Connexion réussie !</h2>
        <p>Redirection...</p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loading: {
    textAlign: 'center',
    color: '#667eea',
  }
};