import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import * as AuthService from '../services/auth.service';

const AuthScreen = () => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (loading) return; // Empêcher les clics multiples
    
    setLoading(true);
    try {
      console.log('🚀 Starting Spotify authentication...');
      
      // 1. Ouvrir l'authentification Spotify (gère tout: ouverture, callback, parsing)
      const result = await AuthService.openSpotifyAuth();
      
      console.log('✅ Auth successful, token received');
      
      // 2. Connecter l'utilisateur avec le token (déjà sauvegardé dans openSpotifyAuth)
      if (result && result.token) {
        const success = await login(result.token);
        if (!success) {
          throw new Error('Failed to login with token');
        }
        console.log('✅ User logged in successfully');
      } else {
        throw new Error('No token received from authentication');
      }
    } catch (error) {
      console.error('❌ Login failed:', error);
      
      // Ne pas afficher d'alerte si l'utilisateur a annulé
      if (error.message !== 'Authentication cancelled') {
        Alert.alert(
          'Erreur d\'authentification',
          error.message || 'Impossible de se connecter à Spotify. Veuillez réessayer.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>🎵</Text>
        <Text style={styles.title}>Spotify Party</Text>
        <Text style={styles.subtitle}>
          Votez pour la musique en soirée !
        </Text>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <View style={styles.buttonContent}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={[styles.buttonText, { marginLeft: 10 }]}>
                Connexion...
              </Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>Se connecter avec Spotify</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.info}>
          Connectez-vous pour créer ou rejoindre une session
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center'
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40
  },
  logo: {
    fontSize: 80,
    marginBottom: 20
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1DB954',
    marginBottom: 10
  },
  subtitle: {
    fontSize: 18,
    color: '#B3B3B3',
    textAlign: 'center',
    marginBottom: 50
  },
  button: {
    backgroundColor: '#1DB954',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginBottom: 20,
    minWidth: 250,
    alignItems: 'center'
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold'
  },
  info: {
    color: '#B3B3B3',
    textAlign: 'center',
    fontSize: 12
  }
});

export default AuthScreen;