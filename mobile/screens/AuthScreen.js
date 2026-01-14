import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert
} from 'react-native';
import { openSpotifyAuth } from '../services/auth.service';
// 👇 IMPORT IMPORTANT : On a besoin du contexte
import { useAuth } from '../contexts/AuthContext';

const AuthScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  
  // 👇 On récupère la fonction login du contexte
  const { login } = useAuth();

  const handleLogin = async () => {
    setLoading(true);
    
    try {
      console.log('🎬 Lancement de l\'authentification...');
      
      // 1. On lance l'auth Spotify (ça ouvre le navigateur)
      const result = await openSpotifyAuth();
      
      console.log('✅ Auth réussie pour:', result.user.displayName);
      
      // 2. CORRECTION CRITIQUE ICI :
      // On ne navigue plus manuellement avec navigation.replace('Home').
      // On met à jour le Contexte. App.js va détecter le changement
      // et afficher automatiquement l'AppNavigator (et donc le Home).
      
      if (result.token) {
        // Ton AuthContext attend juste le token (string), pas l'objet complet
        await login(result.token);
      } else {
        throw new Error('Pas de token reçu');
      }
      
    } catch (error) {
      console.error('Auth error:', error);
      
      if (error.message === 'Authentification annulée') {
        console.log('ℹ️ Utilisateur a annulé l\'authentification');
      } else {
        Alert.alert(
          'Erreur d\'authentification',
          error.message || 'Une erreur est survenue lors de la connexion',
          [{ text: 'OK' }]
        );
      }
    } finally {
      // On arrête le chargement seulement si ça a échoué.
      // Si ça a réussi, le composant va être démonté de toute façon.
      setLoading(false); 
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Spotify Party</Text>
        <Text style={styles.subtitle}>
          Votez pour les musiques que vous voulez écouter
        </Text>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.buttonText}>Se connecter avec Spotify</Text>
              <Text style={styles.spotifyIcon}>♫</Text>
            </>
          )}
        </TouchableOpacity>

        {loading && (
          <Text style={styles.loadingText}>
            Connexion en cours...
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#1DB954',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 60,
    opacity: 0.8,
  },
  button: {
    backgroundColor: '#1DB954',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 300,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  spotifyIcon: {
    color: '#fff',
    fontSize: 20,
    marginLeft: 10,
  },
  loadingText: {
    color: '#fff',
    marginTop: 20,
    opacity: 0.7,
  },
});

export default AuthScreen;