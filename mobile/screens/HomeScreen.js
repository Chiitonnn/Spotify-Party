import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

const HomeScreen = ({ navigation }) => {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.welcome}>Bienvenue, {user?.displayName}!</Text>
          <TouchableOpacity onPress={logout}>
            <Text style={styles.logout}>Déconnexion</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={() => navigation.navigate('CreateSession')}
          >
            <Text style={styles.buttonIcon}>🎧</Text>
            <Text style={styles.buttonText}>Créer une session</Text>
            <Text style={styles.buttonSubtext}>Vous êtes l'hôte</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => navigation.navigate('JoinSession')}
          >
            <Text style={styles.buttonIcon}>🎵</Text>
            <Text style={styles.buttonText}>Rejoindre</Text>
            <Text style={styles.buttonSubtext}>Entrer un code</Text>
          </TouchableOpacity>
        </View>

        {!user?.isPremium && (
          <View style={styles.premiumNotice}>
            <Text style={styles.premiumText}>
              ⚠️ Vous devez avoir Spotify Premium pour être hôte
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000'
  },
  content: {
    flex: 1,
    padding: 20
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40
  },
  welcome: {
    fontSize: 20,
    color: '#FFF',
    fontWeight: 'bold'
  },
  logout: {
    color: '#1DB954',
    fontSize: 14
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 20
  },
  button: {
    padding: 30,
    borderRadius: 15,
    alignItems: 'center'
  },
  primaryButton: {
    backgroundColor: '#1DB954'
  },
  secondaryButton: {
    backgroundColor: '#282828',
    borderWidth: 2,
    borderColor: '#1DB954'
  },
  buttonIcon: {
    fontSize: 40,
    marginBottom: 10
  },
  buttonText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5
  },
  buttonSubtext: {
    color: '#B3B3B3',
    fontSize: 14
  },
  premiumNotice: {
    backgroundColor: '#282828',
    padding: 15,
    borderRadius: 10,
    marginTop: 20
  },
  premiumText: {
    color: '#FFA500',
    textAlign: 'center',
    fontSize: 12
  }
});

export default HomeScreen;
