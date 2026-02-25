import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  Share,
  ActivityIndicator,
  StatusBar,
  Image,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useSession } from '../contexts/SessionContext';
import * as SessionService from '../services/session.service';

const SessionScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const { currentSession, setCurrentSession } = useSession();
  const { sessionId } = route.params;
  const [starting, setStarting] = useState(false);

  const isHost = currentSession?.hostId?._id === user?._id || currentSession?.hostId === user?._id;

  // --- LOGIQUE (CONSERVÉE) ---
  const loadSession = async () => {
    try {
      const session = await SessionService.getSession(sessionId);
      setCurrentSession(session);
    } catch (error) {
      console.error("Erreur rafraîchissement session:", error);
    }
  };
  
  useEffect(() => {
    loadSession();
    const interval = setInterval(() => {
      loadSession();
    }, 5000);

    const unsubscribe = navigation.addListener('focus', () => {
      loadSession();
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [navigation, sessionId]);

  const handleShareCode = async () => {
    try {
      await Share.share({
        message: `Rejoins ma session Spotify Party avec le code: ${currentSession.code}`
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddTrack = () => {
    navigation.navigate('Vote', { sessionId });
  };

  const handleStartParty = async () => {
    if (!currentSession.approvedQueue || currentSession.approvedQueue.length === 0) {
      Alert.alert('File d\'attente vide', 'Ajoutez au moins une musique avant de lancer la soirée.');
      return;
    }
    try {
      setStarting(true);
      await SessionService.startParty(sessionId);
      Alert.alert('Succès ! 🎧', 'La musique se lance sur votre appareil.');
    } catch (error) {
      Alert.alert('Attention', error.error || 'Vérifiez que Spotify est ouvert sur votre téléphone.');
    } finally {
      setStarting(false);
    }
  };

  const moveTrack = async (index, direction) => {
    if (!isHost) {
      Alert.alert('Désolé', 'Seul l\'hôte peut réorganiser la file d\'attente.');
      return;
    }
    const newQueue = [...currentSession.approvedQueue];
    if (direction === 'up' && index > 0) {
      [newQueue[index - 1], newQueue[index]] = [newQueue[index], newQueue[index - 1]];
    } else if (direction === 'down' && index < newQueue.length - 1) {
      [newQueue[index + 1], newQueue[index]] = [newQueue[index], newQueue[index + 1]];
    } else return;

    setCurrentSession({ ...currentSession, approvedQueue: newQueue });
    try {
      await SessionService.updateQueueOrder(sessionId, newQueue);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sauvegarder l\'ordre.');
      loadSession();
    }
  };

  const handleLeaveSession = async () => {
    Alert.alert(
      'Quitter',
      isHost ? 'Fermer le salon pour tout le monde ?' : 'Voulez-vous quitter le salon ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: isHost ? 'Fermer' : 'Quitter',
          style: 'destructive',
          onPress: async () => {
            try {
              if (isHost) await SessionService.closeSession(sessionId);
              else await SessionService.leaveSession(sessionId);
              navigation.navigate('Home');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de quitter');
            }
          }
        }
      ]
    );
  };

  if (!currentSession) return <View style={styles.container} />;
  const queue = currentSession.approvedQueue || [];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }}>
        
        {/* HEADER CUSTOM */}
        <View style={styles.header}>
          <View>
            <Text style={styles.sessionStatus}>SESSION EN COURS</Text>
            <Text style={styles.sessionTitle}>{currentSession.name}</Text>
          </View>
          <TouchableOpacity onPress={handleLeaveSession} style={styles.closeIconButton}>
            <Ionicons name="close" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* INFO CARDS (Code & Participants) */}
        <View style={styles.badgesRow}>
          <TouchableOpacity onPress={handleShareCode} style={styles.badgeCode}>
            <Text style={styles.badgeCodeText}>{currentSession.code}</Text>
            <Ionicons name="copy-outline" size={16} color="#1DB954" style={{ marginLeft: 10 }} />
          </TouchableOpacity>
          
          <View style={styles.badgeGuests}>
            <Ionicons name="people-outline" size={18} color="#B3B3B3" />
            <Text style={styles.badgeGuestsText}>{currentSession.participants?.length || 1} Invités</Text>
          </View>
        </View>

        {/* SECTION FILE D'ATTENTE */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitleText}>File d'attente ({queue.length})</Text>
          {isHost && queue.length > 1 && (
            <Text style={styles.reorderHint}>Maintenez pour réorganiser</Text>
          )}
        </View>

        <FlatList
          data={queue}
          keyExtractor={(item, index) => `${item.uri}-${index}`}
          contentContainerStyle={{ paddingBottom: 150 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="musical-notes-outline" size={60} color="#1A1A1A" />
              <Text style={styles.emptyText}>La file d'attente est vide</Text>
              <Text style={styles.emptySub}>Ajoutez vos premiers titres pour la soirée !</Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <View style={styles.trackCard}>
              {/* Image Album (Spotify Style) */}
              <Image 
                source={{ uri: item.albumImage || 'https://via.placeholder.com/150' }} 
                style={styles.albumArt} 
              />
              
              <View style={styles.trackDetails}>
                <Text style={styles.trackNameText} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.trackArtistText} numberOfLines={1}>{item.artist}</Text>
              </View>

              {/* Contrôles d'Hôte */}
              {isHost && (
                <View style={styles.reorderControls}>
                  <TouchableOpacity onPress={() => moveTrack(index, 'up')} disabled={index === 0}>
                    <Ionicons name="chevron-up" size={22} color={index === 0 ? "#222" : "#555"} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => moveTrack(index, 'down')} disabled={index === queue.length - 1}>
                    <Ionicons name="chevron-down" size={22} color={index === queue.length - 1 ? "#222" : "#555"} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        />

        {/* FOOTER FLOTTANT ACTION */}
        <View style={styles.floatingFooter}>
          <TouchableOpacity style={styles.addTrackButton} onPress={handleAddTrack}>
            <Ionicons name="search" size={20} color="#FFF" />
            <Text style={styles.addTrackText}>Ajouter un titre</Text>
          </TouchableOpacity>

          {isHost && (
            <TouchableOpacity 
              style={styles.launchButton} 
              onPress={handleStartParty}
              disabled={starting}
            >
              {starting ? (
                <ActivityIndicator color="#000" />
              ) : (
                <>
                  <Text style={styles.launchButtonText}>LANCER LA LECTURE</Text>
                  <Ionicons name="play" size={18} color="#000" />
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    marginBottom: 20
  },
  sessionStatus: { color: '#1DB954', fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 4 },
  sessionTitle: { color: '#FFF', fontSize: 26, fontWeight: 'bold' },
  closeIconButton: { padding: 10, backgroundColor: '#121212', borderRadius: 25, borderWidth: 1, borderColor: '#282828' },

  badgesRow: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 35, gap: 12 },
  badgeCode: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#121212', 
    paddingVertical: 12, paddingHorizontal: 18, borderRadius: 16,
    borderWidth: 1, borderColor: '#282828'
  },
  badgeCodeText: { color: '#FFF', fontSize: 18, fontWeight: '800', letterSpacing: 2 },
  badgeGuests: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#0A0A0A', 
    paddingHorizontal: 15, borderRadius: 16, borderWidth: 1, borderColor: '#1A1A1A'
  },
  badgeGuestsText: { color: '#B3B3B3', fontSize: 13, marginLeft: 8, fontWeight: '600' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 15 },
  sectionTitleText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  reorderHint: { color: '#555', fontSize: 11 },

  trackCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#000',
    paddingVertical: 10, paddingHorizontal: 20, marginBottom: 2
  },
  albumArt: { width: 50, height: 50, borderRadius: 4, marginRight: 15 },
  trackDetails: { flex: 1, justifyContent: 'center' },
  trackNameText: { color: '#FFF', fontSize: 15, fontWeight: '600', marginBottom: 3 },
  trackArtistText: { color: '#B3B3B3', fontSize: 13 },
  reorderControls: { flexDirection: 'column', alignItems: 'center', gap: 2 },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60, paddingHorizontal: 40 },
  emptyText: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 8 },
  emptySub: { color: '#666', fontSize: 14, textAlign: 'center', lineHeight: 20 },

  floatingFooter: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20, paddingBottom: 35, paddingTop: 20,
    backgroundColor: 'rgba(0,0,0,0.9)', gap: 12
  },
  addTrackButton: {
    backgroundColor: '#121212', height: 55, borderRadius: 30,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10,
    borderWidth: 1, borderColor: '#282828'
  },
  addTrackText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
  launchButton: {
    backgroundColor: '#1DB954', height: 60, borderRadius: 30,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10,
    shadowColor: '#1DB954', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8
  },
  launchButtonText: { color: '#000', fontSize: 15, fontWeight: '900', letterSpacing: 0.5 }
});

export default SessionScreen;