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
  StatusBar
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

  const loadSession = async () => {
    try {
      const session = await SessionService.getSession(sessionId);
      setCurrentSession(session);
    } catch (error) {
      console.error("Erreur rafraîchissement session:", error);
    }
  };
  
  useEffect(() => {
    // Chargement initial immédiat au montage du composant
    loadSession();

    // ⚡ NOUVEAUTÉ : Plus de polling HTTP `setInterval` ici ! 
    // Le système est maintenant 100% Temps Réel grâce aux WebSockets connectés dans le SessionContext.

    // On garde l'écouteur de focus pour forcer un refresh quand on revient de l'écran de recherche
    const unsubscribe = navigation.addListener('focus', () => {
      loadSession();
    });

    // Nettoyage complet : on enlève l'écouteur quand on quitte l'écran
    return () => {
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

  // 🔄 NOUVEAU : Fonction pour réorganiser la file
  const moveTrack = async (index, direction) => {
    if (!isHost) {
      Alert.alert('Désolé', 'Seul l\'hôte peut réorganiser la file d\'attente.');
      return;
    }

    const newQueue = [...currentSession.approvedQueue];
    
    // Logique d'échange
    if (direction === 'up' && index > 0) {
      [newQueue[index - 1], newQueue[index]] = [newQueue[index], newQueue[index - 1]];
    } else if (direction === 'down' && index < newQueue.length - 1) {
      [newQueue[index + 1], newQueue[index]] = [newQueue[index], newQueue[index + 1]];
    } else {
      return; // On ne fait rien si on est déjà tout en haut/bas
    }

    // 1. Mise à jour visuelle instantanée (Optimistic UI)
    setCurrentSession({ ...currentSession, approvedQueue: newQueue });

    // 2. Sauvegarde en base de données
    try {
      await SessionService.updateQueueOrder(sessionId, newQueue);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sauvegarder l\'ordre.');
      loadSession(); // On annule en cas d'erreur
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

      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.subtitle}>SALON EN COURS</Text>
          <Text style={styles.title}>{currentSession.name}</Text>
        </View>
        <TouchableOpacity onPress={handleLeaveSession} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* CODE & STATS (Compacts) */}
      <View style={styles.infoRow}>
        <TouchableOpacity onPress={handleShareCode} style={styles.codeBadge}>
          <Text style={styles.codeText}>{currentSession.code}</Text>
          <Ionicons name="copy-outline" size={16} color="#1DB954" style={{marginLeft: 8}} />
        </TouchableOpacity>
        
        <View style={styles.participantsBadge}>
          <Ionicons name="people" size={16} color="#B3B3B3" />
          <Text style={styles.participantsText}>{currentSession.participants?.length || 1} Invités</Text>
        </View>
      </View>

      {/* FILE D'ATTENTE */}
      <View style={styles.queueHeader}>
        <Text style={styles.sectionTitle}>File d'attente ({queue.length})</Text>
        {isHost && queue.length > 1 && (
          <Text style={styles.queueSubtitle}>Vous pouvez réorganiser ↕️</Text>
        )}
      </View>

      <FlatList
        data={queue}
        keyExtractor={(item, index) => `${item.uri}-${index}`}
        style={styles.queueList}
        ListEmptyComponent={
          <View style={styles.emptyQueue}>
            <Ionicons name="musical-notes-outline" size={40} color="#333" />
            <Text style={styles.emptyText}>La file est vide.</Text>
            <Text style={styles.emptySubtext}>Cherchez une musique pour commencer !</Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <View style={styles.trackItem}>
            {/* Numéro */}
            <Text style={styles.trackIndex}>{index + 1}</Text>
            
            {/* Infos Musique */}
            <View style={styles.trackInfo}>
              <Text style={styles.trackName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.trackArtist} numberOfLines={1}>{item.artist}</Text>
            </View>

            {/* Contrôles (Hôte uniquement) */}
            {isHost && (
              <View style={styles.trackControls}>
                <TouchableOpacity 
                  onPress={() => moveTrack(index, 'up')} 
                  disabled={index === 0}
                  style={styles.arrowBtn}
                >
                  <Ionicons name="chevron-up" size={24} color={index === 0 ? "#333" : "#FFF"} />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => moveTrack(index, 'down')} 
                  disabled={index === queue.length - 1}
                  style={styles.arrowBtn}
                >
                  <Ionicons name="chevron-down" size={24} color={index === queue.length - 1 ? "#333" : "#FFF"} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      />

      {/* FOOTER ACTIONS */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.searchButton} onPress={handleAddTrack}>
          <Ionicons name="search" size={20} color="#FFF" />
          <Text style={styles.searchButtonText}>Ajouter un titre</Text>
        </TouchableOpacity>

        {isHost && (
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartParty}
            disabled={starting}
          >
            {starting ? (
              <ActivityIndicator color="#000" />
            ) : (
              <>
                <Text style={styles.startButtonText}>LANCER LA LECTURE</Text>
                <Ionicons name="play" size={20} color="#000" />
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', paddingTop: 50, paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  subtitle: { color: '#1DB954', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
  title: { color: '#FFF', fontSize: 28, fontWeight: 'bold', marginTop: 5 },
  closeBtn: { padding: 10, backgroundColor: '#282828', borderRadius: 20 },

  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 30, gap: 15 },
  codeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E1E1E', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, borderWidth: 1, borderColor: '#333' },
  codeText: { color: '#FFF', fontSize: 18, fontWeight: 'bold', letterSpacing: 3 },
  participantsBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#121212', paddingVertical: 12, paddingHorizontal: 15, borderRadius: 20 },
  participantsText: { color: '#B3B3B3', fontSize: 14, marginLeft: 8 },

  queueHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  queueSubtitle: { color: '#666', fontSize: 12 },
  
  queueList: { flex: 1 },
  trackItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#121212', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#282828' },
  trackIndex: { color: '#666', fontSize: 16, fontWeight: 'bold', width: 30 },
  trackInfo: { flex: 1, paddingRight: 10 },
  trackName: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  trackArtist: { color: '#B3B3B3', fontSize: 14 },
  trackControls: { flexDirection: 'row', alignItems: 'center' },
  arrowBtn: { padding: 5 },

  emptyQueue: { alignItems: 'center', justifyContent: 'center', marginTop: 50 },
  emptyText: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginTop: 15, marginBottom: 5 },
  emptySubtext: { color: '#666', fontSize: 14 },

  footer: { paddingTop: 20, paddingBottom: 30, gap: 15 },
  searchButton: { backgroundColor: '#282828', padding: 18, borderRadius: 30, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#444' },
  searchButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  startButton: { backgroundColor: '#1DB954', padding: 18, borderRadius: 30, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  startButtonText: { color: '#000', fontSize: 16, fontWeight: 'bold' }
});

export default SessionScreen;