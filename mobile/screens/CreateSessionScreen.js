import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSession } from '../contexts/SessionContext';
import * as SessionService from '../services/session.service';

const CreateSessionScreen = ({ navigation }) => {
  const { setCurrentSession } = useSession();
  const [sessionName, setSessionName] = useState('Spotify Party');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!sessionName.trim()) {
      Alert.alert('Attention', 'Donnez un nom à votre soirée.');
      return;
    }

    try {
      setLoading(true);
      
      // On envoie des valeurs par défaut pour satisfaire l'ancien backend
      const session = await SessionService.createSession({
        name: sessionName,
        playlistIds: [], // Plus besoin de playlists !
        votingThreshold: 1, // On s'en fiche maintenant
        trackLimit: 50 // Pareil
      });

      setCurrentSession(session);
      navigation.replace('Session', { sessionId: session._id });
    } catch (error) {
      console.error(error);
      Alert.alert('Erreur', 'Impossible de créer la session.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nouvelle Session</Text>
        <View style={{width: 24}} /> 
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="radio" size={60} color="#1DB954" />
        </View>

        <Text style={styles.title}>Créez votre salon</Text>
        <Text style={styles.subtitle}>
          Vos invités pourront rejoindre avec un code et ajouter leurs sons.
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>Nom de la soirée</Text>
          <TextInput
            style={styles.input}
            value={sessionName}
            onChangeText={setSessionName}
            placeholder="Ex: Soirée de Titouan"
            placeholderTextColor="#666"
            autoFocus={true}
            selectionColor="#1DB954"
          />
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreate}
          disabled={loading}
        >
          {loading ? (
             <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.createButtonText}>CRÉER LE SALON</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', paddingTop: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 40
  },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  backBtn: { padding: 5 },
  
  content: {
    flex: 1,
    paddingHorizontal: 30,
    alignItems: 'center'
  },
  iconContainer: {
    width: 120, height: 120,
    borderRadius: 60,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#282828'
  },
  title: { color: '#FFF', fontSize: 28, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { color: '#B3B3B3', fontSize: 14, textAlign: 'center', marginBottom: 40, lineHeight: 20 },
  
  form: { width: '100%' },
  label: { color: '#B3B3B3', fontSize: 14, marginBottom: 8, fontWeight: '600' },
  input: {
    backgroundColor: '#1E1E1E',
    color: '#FFF',
    padding: 20,
    borderRadius: 15,
    fontSize: 18,
    borderWidth: 1,
    borderColor: '#333'
  },
  
  footer: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#000',
  },
  createButton: {
    backgroundColor: '#1DB954',
    padding: 18,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#1DB954',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10
  },
  createButtonText: { color: '#000', fontSize: 16, fontWeight: 'bold', textTransform: 'uppercase' }
});

export default CreateSessionScreen;