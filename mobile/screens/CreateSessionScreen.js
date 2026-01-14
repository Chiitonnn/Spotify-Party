import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useSession } from '../contexts/SessionContext';
import * as SpotifyService from '../services/spotify.service';
import * as SessionService from '../services/session.service';

const CreateSessionScreen = ({ navigation }) => {
  const { setCurrentSession } = useSession();
  const [sessionName, setSessionName] = useState('Spotify Party');
  const [votingThreshold, setVotingThreshold] = useState('5');
  const [trackLimit, setTrackLimit] = useState('20');
  
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylists, setSelectedPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlaylists();
  }, []);

  const loadPlaylists = async () => {
    try {
      const data = await SpotifyService.getUserPlaylists();
      setPlaylists(data);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les playlists');
    } finally {
      setLoading(false);
    }
  };

  const togglePlaylist = (playlistId) => {
    setSelectedPlaylists(prev =>
      prev.includes(playlistId)
        ? prev.filter(id => id !== playlistId)
        : [...prev, playlistId]
    );
  };

  const handleCreate = async () => {
    if (selectedPlaylists.length === 0) {
      Alert.alert('Attention', 'Sélectionnez au moins une playlist.');
      return;
    }

    try {
      setLoading(true);
      const session = await SessionService.createSession({
        name: sessionName,
        playlistIds: selectedPlaylists,
        votingThreshold: parseInt(votingThreshold),
        trackLimit: parseInt(trackLimit)
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
      
      {/* Header simple */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nouvelle Session</Text>
        <View style={{width: 24}} /> 
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Nom de la soirée</Text>
        <TextInput
          style={styles.input}
          value={sessionName}
          onChangeText={setSessionName}
          placeholder="Ex: Soirée vendredi"
          placeholderTextColor="#666"
        />

        <View style={styles.row}>
          <View style={{flex: 1}}>
            <Text style={styles.label}>Votes requis</Text>
            <TextInput
              style={styles.input}
              value={votingThreshold}
              onChangeText={setVotingThreshold}
              keyboardType="numeric"
            />
          </View>
          <View style={{width: 15}} />
          <View style={{flex: 1}}>
            <Text style={styles.label}>Pool Musiques</Text>
            <TextInput
              style={styles.input}
              value={trackLimit}
              onChangeText={setTrackLimit}
              keyboardType="numeric"
            />
          </View>
        </View>

        <Text style={[styles.label, {marginTop: 20}]}>
          Choisir les playlists ({selectedPlaylists.length})
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator color="#1DB954" style={{marginTop: 50}} />
      ) : (
        <FlatList
          data={playlists}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          renderItem={({ item }) => {
            const isSelected = selectedPlaylists.includes(item.id);
            return (
              <TouchableOpacity
                style={[styles.playlistItem, isSelected && styles.playlistSelected]}
                onPress={() => togglePlaylist(item.id)}
                activeOpacity={0.7}
              >
                <View style={styles.iconBox}>
                  <Ionicons name="musical-notes" size={20} color={isSelected ? "#000" : "#B3B3B3"} />
                </View>
                <View style={{flex: 1}}>
                  <Text style={[styles.playlistName, isSelected && {color: '#1DB954'}]}>
                    {item.name}
                  </Text>
                  <Text style={styles.playlistTracks}>{item.tracksCount} titres</Text>
                </View>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={24} color="#1DB954" />
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreate}
          disabled={loading}
        >
          {loading ? (
             <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.createButtonText}>Créer la session</Text>
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
    marginBottom: 20
  },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  backBtn: { padding: 5 },
  
  form: { paddingHorizontal: 20, marginBottom: 10 },
  label: { color: '#B3B3B3', fontSize: 14, marginBottom: 8, fontWeight: '600' },
  input: {
    backgroundColor: '#1E1E1E',
    color: '#FFF',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333'
  },
  row: { flexDirection: 'row' },
  
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#282828'
  },
  playlistSelected: {
    borderColor: '#1DB954',
    backgroundColor: 'rgba(29, 185, 84, 0.1)'
  },
  iconBox: {
    width: 40, height: 40,
    borderRadius: 8,
    backgroundColor: '#282828',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15
  },
  playlistName: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  playlistTracks: { color: '#666', fontSize: 12, marginTop: 4 },
  
  footer: {
    padding: 20,
    backgroundColor: '#000',
    borderTopWidth: 1,
    borderTopColor: '#1E1E1E'
  },
  createButton: {
    backgroundColor: '#1DB954',
    padding: 18,
    borderRadius: 30,
    alignItems: 'center'
  },
  createButtonText: { color: '#000', fontSize: 18, fontWeight: 'bold' }
});

export default CreateSessionScreen;