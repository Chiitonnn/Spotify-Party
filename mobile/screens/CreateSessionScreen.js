import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useSession } from '../contexts/SessionContext';
import * as SpotifyService from '../services/spotify.service';
import * as SessionService from '../services/session.service';

const CreateSessionScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { setCurrentSession } = useSession();
  const [sessionName, setSessionName] = useState('Ma Session');
  const [votingThreshold, setVotingThreshold] = useState('5');
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
    if (!user.isPremium) {
      Alert.alert('Premium requis', 'Vous devez avoir Spotify Premium pour être hôte');
      return;
    }

    if (selectedPlaylists.length === 0) {
      Alert.alert('Erreur', 'Sélectionnez au moins une playlist');
      return;
    }

    try {
      setLoading(true);
      const session = await SessionService.createSession({
        name: sessionName,
        playlistIds: selectedPlaylists,
        votingThreshold: parseInt(votingThreshold)
      });

      setCurrentSession(session);
      navigation.replace('Session', { sessionId: session._id });
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de créer la session');
    } finally {
      setLoading(false);
    }
  };

  if (loading && playlists.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1DB954" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>Nom de la session</Text>
        <TextInput
          style={styles.input}
          value={sessionName}
          onChangeText={setSessionName}
          placeholder="Ex: Soirée vendredi"
          placeholderTextColor="#666"
        />

        <Text style={styles.label}>Votes requis pour lancer</Text>
        <TextInput
          style={styles.input}
          value={votingThreshold}
          onChangeText={setVotingThreshold}
          keyboardType="numeric"
          placeholder="5"
          placeholderTextColor="#666"
        />

        <Text style={styles.label}>Sélectionnez vos playlists</Text>
      </View>

      <FlatList
        data={playlists}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.playlistItem,
              selectedPlaylists.includes(item.id) && styles.playlistSelected
            ]}
            onPress={() => togglePlaylist(item.id)}
          >
            <Text style={styles.playlistName}>{item.name}</Text>
            <Text style={styles.playlistTracks}>{item.tracksCount} titres</Text>
          </TouchableOpacity>
        )}
        style={styles.list}
      />

      <TouchableOpacity
        style={styles.createButton}
        onPress={handleCreate}
        disabled={loading}
      >
        <Text style={styles.createButtonText}>
          {loading ? 'Création...' : 'Créer la session'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000'
  },
  form: {
    padding: 20
  },
  label: {
    color: '#FFF',
    fontSize: 16,
    marginBottom: 10,
    marginTop: 10
  },
  input: {
    backgroundColor: '#282828',
    color: '#FFF',
    padding: 15,
    borderRadius: 10,
    fontSize: 16
  },
  list: {
    flex: 1,
    paddingHorizontal: 20
  },
  playlistItem: {
    backgroundColor: '#282828',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10
  },
  playlistSelected: {
    backgroundColor: '#1DB954',
    borderWidth: 2,
    borderColor: '#FFF'
  },
  playlistName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold'
  },
  playlistTracks: {
    color: '#B3B3B3',
    fontSize: 12,
    marginTop: 5
  },
  createButton: {
    backgroundColor: '#1DB954',
    margin: 20,
    padding: 18,
    borderRadius: 25,
    alignItems: 'center'
  },
  createButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold'
  }
});

export default CreateSessionScreen;