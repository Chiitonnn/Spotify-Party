import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  StatusBar,
  Keyboard,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SpotifyService from '../services/spotify.service';
import * as SessionService from '../services/session.service';

const VoteScreen = ({ navigation, route }) => {
  const { sessionId } = route.params;
  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addingTrackId, setAddingTrackId] = useState(null);
  const [hasSearched, setHasSearched] = useState(false); 

  // --- NOUVEAUX STATES POUR LE SCROLL INFINI ---
  const [offset, setOffset] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true); // Est-ce qu'il reste des musiques à charger ?

  // --- ANIMATION SUCCÈS ---
  const [successTrackId, setSuccessTrackId] = useState(null);
  const fillAnims = useRef({}).current; // map trackId -> Animated.Value

  const getOrCreateFillAnim = (trackId) => {
    if (!fillAnims[trackId]) {
      fillAnims[trackId] = new Animated.Value(0);
    }
    return fillAnims[trackId];
  };

  const triggerSuccessAnimation = (trackId) => {
    const anim = getOrCreateFillAnim(trackId);
    anim.setValue(0);
    setSuccessTrackId(trackId);
    Animated.sequence([
      Animated.timing(anim, { toValue: 1, duration: 500, useNativeDriver: false }),
      Animated.delay(900),
      Animated.timing(anim, { toValue: 0, duration: 300, useNativeDriver: false }),
    ]).start(() => {
      setSuccessTrackId(null);
    });
  };

  // Première recherche
  const handleSearch = async () => {
    if (!query.trim()) return;
    Keyboard.dismiss();
    setLoading(true);
    setHasSearched(true);
    setResults([]); 
    
    setOffset(0);
    setHasMore(true);

    try {
      // 🚀 ON PASSE LE sessionId ICI
      const tracks = await SpotifyService.searchTracks(query, 0, sessionId);
      setResults(tracks || []);
      if (tracks && tracks.length < 50) setHasMore(false);
    } catch (error) {
      console.error(error);
      Alert.alert('Erreur', 'Impossible de chercher la musique.');
    } finally {
      setLoading(false);
    }
  };

  // Charger la suite quand on arrive en bas
  const loadMoreTracks = async () => {
    if (isLoadingMore || !hasMore || loading || !query.trim()) return;

    setIsLoadingMore(true);
    const nextOffset = offset + 50;

    try {
      // 🚀 ET ICI AUSSI
      const moreTracks = await SpotifyService.searchTracks(query, nextOffset, sessionId);
      setResults(prevResults => [...prevResults, ...moreTracks]);
      setOffset(nextOffset);
      if (moreTracks.length < 50) setHasMore(false);
    } catch (error) {
      console.error('Erreur Scroll Infini:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleTextChange = (text) => {
    setQuery(text);
    if (hasSearched) setHasSearched(false); 
  };

  const handleAddTrack = async (track) => {
    try {
      setAddingTrackId(track.id);
      
      // Bloquer si la limite est déjà atteinte (la réponse serveur peut aussi renvoyer une erreur)
      // On laisse le serveur trancher mais on peut afficher un message clair
      await SessionService.addToQueue(sessionId, {
        trackUri: track.uri,
        trackName: track.name,
        artistName: track.artists.join(', '),
        albumImage: track.albumImage
      });
      
      triggerSuccessAnimation(track.id);
    } catch (error) {
      const msg = error.error || '';
      if (msg.toLowerCase().includes('limit') || msg.toLowerCase().includes('limite') || msg.toLowerCase().includes('maximum')) {
        Alert.alert('File complète', `Le nombre maximum de sons a été atteint pour cette session.`);
      } else {
        Alert.alert('Oups', msg || 'Impossible d\'ajouter la musique.');
      }
    } finally {
      setAddingTrackId(null);
    }
  };
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ajouter un titre</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* SEARCH BAR */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#B3B3B3" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={handleTextChange}
          onSubmitEditing={handleSearch}
          placeholder="Rechercher un titre, un artiste..."
          placeholderTextColor="#B3B3B3"
          autoFocus={true}
          returnKeyType="search"
          selectionColor="#1DB954"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(''); setHasSearched(false); setResults([]); }}>
            <Ionicons name="close-circle" size={20} color="#B3B3B3" />
          </TouchableOpacity>
        )}
      </View>

      {/* RESULTATS */}
      {loading ? (
        <ActivityIndicator size="large" color="#1DB954" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item, index) => `${item.id}-${index}`} // Évite les bugs d'ID en doublon sur le scroll
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          
          // 👇 C'EST ICI QUE LA MAGIE DU SCROLL INFINI OPÈRE 👇
          onEndReached={loadMoreTracks}
          onEndReachedThreshold={0.5} // Se déclenche quand on est à la moitié de la fin de la liste
          
          ListFooterComponent={
            isLoadingMore ? (
              <ActivityIndicator size="small" color="#1DB954" style={{ marginVertical: 20 }} />
            ) : null
          }
          
          ListEmptyComponent={
            !loading && hasSearched && query ? (
              <Text style={styles.emptyText}>Aucun résultat pour "{query}".</Text>
            ) : null
          }
          renderItem={({ item }) => {
            const isSuccess = successTrackId === item.id;
            const fillAnim = getOrCreateFillAnim(item.id);
            const bgColor = fillAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['#121212', '#1DB954'],
            });
            const borderColor = fillAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['#282828', '#17a349'],
            });
            return (
              <Animated.View style={[styles.trackItem, { backgroundColor: bgColor, borderColor }]}>
                <Image source={{ uri: item.albumImage }} style={styles.albumImage} />
                <View style={styles.trackInfo}>
                  <Animated.Text
                    style={[
                      styles.trackName,
                      { color: fillAnim.interpolate({ inputRange: [0, 1], outputRange: ['#FFF', '#000'] }) }
                    ]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Animated.Text>
                  <Animated.Text
                    style={[
                      styles.artistName,
                      { color: fillAnim.interpolate({ inputRange: [0, 1], outputRange: ['#B3B3B3', 'rgba(0,0,0,0.65)'] }) }
                    ]}
                    numberOfLines={1}
                  >
                    {item.artists.join(', ')}
                  </Animated.Text>
                </View>
                <TouchableOpacity
                  style={[styles.addButton, isSuccess && styles.addButtonSuccess]}
                  onPress={() => handleAddTrack(item)}
                  disabled={addingTrackId === item.id || isSuccess}
                >
                  {addingTrackId === item.id ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : isSuccess ? (
                    <Ionicons name="checkmark" size={22} color="#1DB954" />
                  ) : (
                    <Ionicons name="add" size={24} color="#FFF" />
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', paddingTop: 50 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20
  },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  backBtn: { padding: 5, marginLeft: -5 },
  
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    marginHorizontal: 20,
    paddingHorizontal: 15,
    borderRadius: 12,
    marginBottom: 20,
    height: 50,
    borderWidth: 1,
    borderColor: '#333'
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, color: '#FFF', fontSize: 16 },
  
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: '#121212',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#282828'
  },
  albumImage: { width: 50, height: 50, borderRadius: 6, marginRight: 15 },
  trackInfo: { flex: 1, justifyContent: 'center', marginRight: 10 },
  trackName: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  artistName: { color: '#B3B3B3', fontSize: 14 },
  
  addButton: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: '#1DB954',
    justifyContent: 'center',
    alignItems: 'center'
  },
  addButtonSuccess: {
    backgroundColor: '#000',
  },
  emptyText: { color: '#B3B3B3', textAlign: 'center', marginTop: 50, fontSize: 16 }
});

export default VoteScreen;