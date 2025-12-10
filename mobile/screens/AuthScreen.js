import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Linking
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import * as AuthService from '../services/auth.service';

const AuthScreen = () => {
  const { login } = useAuth();

  useEffect(() => {
    // Écouter les URL de callback
    const handleUrl = async ({ url }) => {
      const token = url.split('token=')[1]?.split('&')[0];
      if (token) {
        await login(token);
      }
    };

    const subscription = Linking.addEventListener('url', handleUrl);

    // Vérifier si l'app a été ouverte avec une URL
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl({ url });
    });

    return () => subscription.remove();
  }, []);

  const handleLogin = async () => {
    try {
      await AuthService.openSpotifyAuth();
    } catch (error) {
      console.error('Auth error:', error);
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

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Se connecter avec Spotify</Text>
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
    marginBottom: 20
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