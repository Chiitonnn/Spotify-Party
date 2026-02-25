import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  StatusBar,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { openSpotifyAuth } from '../services/auth.service';
import { useAuth } from '../contexts/AuthContext';

const { width } = Dimensions.get('window');

const AuthScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    setLoading(true);
    try {
      const result = await openSpotifyAuth();
      if (result.token) {
        await login(result.token);
      } else {
        throw new Error('Pas de token reçu');
      }
    } catch (error) {
      if (error.message !== 'Authentification annulée') {
        Alert.alert('Erreur', error.message || 'Une erreur est survenue');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.content}>
        {/* Logo Musical */}
        <View style={styles.iconContainer}>
          <Ionicons name="musical-notes" size={80} color="#1DB954" />
        </View>

        <Text style={styles.title}>Spotify Party</Text>
        <Text style={styles.subtitle}>
          Devenez le DJ démocratique de votre soirée.
        </Text>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <>
              {/* J'ai supprimé l'icône ici pour enlever le '?' */}
              <Text style={styles.buttonText}>SE CONNECTER AVEC SPOTIFY</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      
      <Text style={styles.footerText}>Version 1.0.0</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    padding: 30
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center'
  },
  iconContainer: {
    marginBottom: 30,
    width: 150,
    height: 150,
    backgroundColor: '#121212',
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#282828'
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 10,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 16,
    color: '#B3B3B3',
    textAlign: 'center',
    marginBottom: 60,
    maxWidth: '80%',
    lineHeight: 24
  },
  button: {
    backgroundColor: '#1DB954',
    paddingVertical: 18,
    paddingHorizontal: 30,
    borderRadius: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    elevation: 5,
    shadowColor: '#1DB954',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: {
    color: '#000', // Noir sur vert pour le contraste officiel Spotify
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  footerText: {
    color: '#333',
    textAlign: 'center',
    marginBottom: 20
  }
});

export default AuthScreen;