import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  Share,
  ActivityIndicator
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useSession } from '../contexts/SessionContext';
import * as SessionService from '../services/session.service';

const SessionScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const { currentSession, setCurrentSession } = useSession();
  const { sessionId } = route.params;
  const [starting, setStarting] = useState(false);

  // Vérification robuste pour savoir si on est l'hôte
  const isHost = currentSession?.hostId?._id === user?._id || currentSession?.hostId === user?._id;

  useEffect(() => {
    // Recharger la session à chaque fois qu'on revient sur cet écran (pour mettre à jour le compteur de titres)
    const unsubscribe = navigation.addListener('focus', () => {
      loadSession();
    });
    return unsubscribe;
  }, [navigation]);

  const loadSession = async () => {
    try {
      const session = await SessionService.getSession(sessionId);
      setCurrentSession(session);
    } catch (error) {
      // Si la session est introuvable ou fermée
      // Alert.alert('Erreur', 'Session introuvable');
    }
  };

  const handleShareCode = async () => {
    try {
      await Share.share({
        message: `Rejoins ma session Spotify Party avec le code: ${currentSession.code}`
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleStartVoting = () => {
    navigation.navigate('Vote', { sessionId });
  };

  // 🚀 ACTION LANCER LA SOIRÉE (Hôte uniquement)
  const handleStartParty = async () => {
    if (!currentSession.approvedQueue || currentSession.approvedQueue.length === 0) {
      Alert.alert('Trop tôt !', 'Il faut d\'abord voter pour des musiques (0 titre validé).');
      return;
    }

    try {
      setStarting(true);
      await SessionService.startParty(sessionId);
      Alert.alert('C\'est parti !', 'La musique devrait se lancer sur votre téléphone.');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de lancer la musique. Vérifiez que Spotify est ouvert sur votre téléphone.');
    } finally {
      setStarting(false);
    }
  };

  const handleLeaveSession = async () => {
    Alert.alert(
      'Quitter',
      isHost ? 'En quittant, la session sera fermée pour tous.' : 'Êtes-vous sûr de vouloir quitter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Quitter',
          style: 'destructive',
          onPress: async () => {
            try {
              if (isHost) {
                await SessionService.closeSession(sessionId);
              } else {
                await SessionService.leaveSession(sessionId);
              }
              navigation.navigate('Home');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de quitter');
            }
          }
        }
      ]
    );
  };

  if (!currentSession) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* En-tête avec code */}
      <View style={styles.header}>
        <View style={styles.codeContainer}>
          <Text style={styles.codeLabel}>Code de session</Text>
          <Text style={styles.code}>{currentSession.code}</Text>
        </View>
        <TouchableOpacity style={styles.shareButton} onPress={handleShareCode}>
          <Text style={styles.shareButtonText}>📤 Partager</Text>
        </TouchableOpacity>
      </View>

      {/* Info session */}
      <View style={styles.infoContainer}>
        <Text style={styles.sessionName}>{currentSession.name}</Text>
        <Text style={styles.threshold}>
          {currentSession.approvedQueue?.length || 0} titres validés pour la soirée
        </Text>
        {isHost && (
          <View style={styles.hostBadge}>
            <Text style={styles.hostBadgeText}>👑 Vous êtes l'hôte</Text>
          </View>
        )}
      </View>

      {/* Participants */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Participants ({currentSession.participants?.length || 0})
        </Text>
        <FlatList
          data={currentSession.participants}
          horizontal
          keyExtractor={(item) => item.userId._id || item.userId}
          renderItem={({ item }) => (
            <View style={styles.participantCard}>
              <Text style={styles.participantEmoji}>👤</Text>
              <Text style={styles.participantName}>
                {item.userId.displayName || 'Invité'}
              </Text>
            </View>
          )}
          style={styles.participantsList}
        />
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        
        {/* BOUTON VOTE (Pour tout le monde) */}
        <TouchableOpacity
          style={styles.voteButton}
          onPress={handleStartVoting}
        >
          <Text style={styles.voteButtonText}>🗳️ Aller voter</Text>
        </TouchableOpacity>

        {/* 👇 BOUTON HOST : LANCER LA MUSIQUE */}
        {isHost && (
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartParty}
            disabled={starting}
          >
            {starting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.startButtonText}>🚀 LANCER LA SOIRÉE</Text>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.leaveButton}
          onPress={handleLeaveSession}
        >
          <Text style={styles.leaveButtonText}>
            {isHost ? 'Fermer la session' : 'Quitter'}
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
    padding: 20
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20
  },
  codeContainer: { flex: 1 },
  codeLabel: { color: '#B3B3B3', fontSize: 12, marginBottom: 5 },
  code: { color: '#1DB954', fontSize: 32, fontWeight: 'bold', letterSpacing: 4 },
  shareButton: { backgroundColor: '#282828', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 20 },
  shareButtonText: { color: '#FFF', fontSize: 14 },
  
  infoContainer: { backgroundColor: '#282828', padding: 20, borderRadius: 15, marginBottom: 20 },
  sessionName: { color: '#FFF', fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  threshold: { color: '#1DB954', fontSize: 16, fontWeight: 'bold' }, // Couleur verte pour les stats
  
  hostBadge: { backgroundColor: '#1DB954', alignSelf: 'flex-start', paddingVertical: 5, paddingHorizontal: 15, borderRadius: 15, marginTop: 10 },
  hostBadgeText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  
  section: { marginBottom: 20 },
  sectionTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  participantsList: { flexGrow: 0 },
  participantCard: { backgroundColor: '#282828', padding: 15, borderRadius: 10, marginRight: 10, alignItems: 'center', minWidth: 80 },
  participantEmoji: { fontSize: 30, marginBottom: 5 },
  participantName: { color: '#FFF', fontSize: 12, textAlign: 'center' },

  actions: { flex: 1, justifyContent: 'flex-end', gap: 15 },
  
  // Bouton de vote (gris foncé / discret)
  voteButton: {
    backgroundColor: '#282828',
    padding: 18,
    borderRadius: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#B3B3B3'
  },
  voteButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },

  // Bouton Lancer la soirée (Vert flashy)
  startButton: {
    backgroundColor: '#1DB954', 
    padding: 20,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: "#1DB954",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6
  },
  startButtonText: { color: '#FFF', fontSize: 20, fontWeight: 'bold', textTransform: 'uppercase' },

  // Bouton Quitter (Rouge / Discret)
  leaveButton: {
    backgroundColor: 'transparent', // Plus discret
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 10
  },
  leaveButtonText: { color: '#FF4444', fontSize: 16, fontWeight: 'bold' }
});

export default SessionScreen;