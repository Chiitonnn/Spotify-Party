import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSession } from '../contexts/SessionContext';
import * as SessionService from '../services/session.service';

const JoinSessionScreen = ({ navigation }) => {
  const { setCurrentSession } = useSession();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (code.length < 4) {
      Alert.alert('Erreur', 'Le code doit contenir au moins 4 caractères');
      return;
    }

    try {
      setLoading(true);
      const session = await SessionService.joinSession(code.toUpperCase());
      setCurrentSession(session);
      navigation.replace('Session', { sessionId: session._id });
    } catch (error) {
      Alert.alert('Oups', 'Session introuvable ou code incorrect.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        
        <SafeAreaView style={styles.safeArea}>
          {/* HEADER FIXE EN HAUT */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={28} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* CONTENU QUI REMONTE */}
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.content}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="keypad" size={40} color="#1DB954" />
            </View>

            <Text style={styles.title}>Rejoindre une Session</Text>
            <Text style={styles.subtitle}>
              Entrez le code unique de l'hôte
            </Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={code}
                onChangeText={(text) => setCode(text.toUpperCase())}
                placeholder="CODE"
                placeholderTextColor="#555"
                autoCapitalize="characters"
                maxLength={6}
                autoCorrect={false}
                autoFocus={true}
                selectionColor="#1DB954"
              />
            </View>

            <TouchableOpacity
              style={[
                styles.joinButton, 
                (loading || code.length < 4) && styles.buttonDisabled
              ]}
              onPress={handleJoin}
              disabled={loading || code.length < 4}
            >
              <Text style={styles.joinButtonText}>
                {loading ? 'Recherche...' : 'REJOINDRE LA SESSION'}
              </Text>
            </TouchableOpacity>

          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000'
  },
  safeArea: {
    flex: 1
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10, // Petit espace sous la barre de statut
    marginBottom: 20,
    alignItems: 'flex-start'
  },
  backBtn: {
    padding: 10,
    marginLeft: -10 // Pour aligner visuellement avec le bord
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start', // 👈 On aligne vers le haut
    alignItems: 'center',
    paddingTop: 40, // On pousse un peu vers le bas pour ne pas coller au header
    paddingHorizontal: 20
  },
  iconContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#121212',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#282828'
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 10,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 16,
    color: '#B3B3B3',
    textAlign: 'center',
    marginBottom: 50
  },
  inputContainer: {
    width: '100%',
    maxWidth: 300,
    marginBottom: 30
  },
  input: {
    backgroundColor: '#1E1E1E',
    color: '#FFF',
    fontSize: 32, // Légèrement réduit pour être moins agressif
    fontWeight: 'bold',
    paddingVertical: 18,
    borderRadius: 15,
    textAlign: 'center',
    letterSpacing: 6,
    borderWidth: 1,
    borderColor: '#333'
  },
  joinButton: {
    backgroundColor: '#1DB954',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 50,
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
    shadowColor: '#1DB954',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10
  },
  buttonDisabled: {
    backgroundColor: '#282828',
    shadowOpacity: 0
  },
  joinButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase'
  }
});

export default JoinSessionScreen;