import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert
} from 'react-native';
import { useSession } from '../contexts/SessionContext';
import * as SessionService from '../services/session.service';

const JoinSessionScreen = ({ navigation }) => {
  const { setCurrentSession } = useSession();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (code.length < 4) {
      Alert.alert('Erreur', 'Entrez un code valide');
      return;
    }

    try {
      setLoading(true);
      const session = await SessionService.joinSession(code.toUpperCase());
      setCurrentSession(session);
      navigation.replace('Session', { sessionId: session._id });
    } catch (error) {
      Alert.alert('Erreur', 'Session introuvable ou inactive');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Rejoindre une session</Text>
        <Text style={styles.subtitle}>
          Entrez le code partagé par l'hôte
        </Text>

        <TextInput
          style={styles.input}
          value={code}
          onChangeText={(text) => setCode(text.toUpperCase())}
          placeholder="CODE"
          placeholderTextColor="#666"
          autoCapitalize="characters"
          maxLength={6}
          autoFocus
        />

        <TouchableOpacity
          style={styles.joinButton}
          onPress={handleJoin}
          disabled={loading || code.length < 4}
        >
          <Text style={styles.joinButtonText}>
            {loading ? 'Connexion...' : 'Rejoindre'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    padding: 20
  },
  content: {
    alignItems: 'center'
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 10
  },
  subtitle: {
    fontSize: 16,
    color: '#B3B3B3',
    marginBottom: 40,
    textAlign: 'center'
  },
  input: {
    backgroundColor: '#282828',
    color: '#FFF',
    fontSize: 32,
    fontWeight: 'bold',
    padding: 20,
    borderRadius: 15,
    textAlign: 'center',
    width: '100%',
    marginBottom: 30,
    letterSpacing: 8
  },
  joinButton: {
    backgroundColor: '#1DB954',
    paddingVertical: 18,
    paddingHorizontal: 60,
    borderRadius: 25
  },
  joinButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold'
  }
});

export default JoinSessionScreen;