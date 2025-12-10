import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  Share
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useSession } from '../contexts/SessionContext';
import * as SessionService from '../services/session.service';

const SessionScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const { currentSession, setCurrentSession, participants } = useSession();
  const [loading, setLoading] = useState(false);
  const { sessionId } = route.params;

  const isHost = currentSession?.hostId._id === user._id;

  useEffect(() => {
    if (!currentSession) {
      loadSession();
    }
  }, []);

  const loadSession = async () => {
    try {
      const session = await SessionService.getSession(sessionId);
      setCurrentSession(session);
    } catch (error) {
      Alert.alert('Erreur', 'Session introuvable');
      navigation.goBack();
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
          {currentSession.votingThreshold} votes requis pour lancer une track
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
          keyExtractor={(item) => item.userId._id}
          renderItem={({ item }) => (
            <View style={styles.participantCard}>
              <Text style={styles.participantEmoji}>👤</Text>
              <Text style={styles.participantName}>
                {item.userId.displayName}
              </Text>
            </View>
          )}
          style={styles.participantsList}
        />
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStartVoting}
        >
          <Text style={styles.startButtonText}>🎵 Commencer à voter</Text>
        </TouchableOpacity>

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
    marginBottom: 30
  },
  codeContainer: {
    flex: 1
  },
  codeLabel: {
    color: '#B3B3B3',
    fontSize: 12,
    marginBottom: 5
  },
  code: {
    color: '#1DB954',
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 4
  },
  shareButton: {
    backgroundColor: '#282828',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20
  },
  shareButtonText: {
    color: '#FFF',
    fontSize: 14
  },
  infoContainer: {
    backgroundColor: '#282828',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20
  },
  sessionName: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10
  },
  threshold: {
    color: '#B3B3B3',
    fontSize: 14
  },
  hostBadge: {
    backgroundColor: '#1DB954',
    alignSelf: 'flex-start',
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 15,
    marginTop: 10
  },
  hostBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold'
  },
  section: {
    marginBottom: 20
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15
  },
  participantsList: {
    flexGrow: 0
  },
  participantCard: {
    backgroundColor: '#282828',
    padding: 15,
    borderRadius: 10,
    marginRight: 10,
    alignItems: 'center',
    minWidth: 80
  },
  participantEmoji: {
    fontSize: 30,
    marginBottom: 5
  },
  participantName: {
    color: '#FFF',
    fontSize: 12,
    textAlign: 'center'
  },
  actions: {
    flex: 1,
    justifyContent: 'flex-end',
    gap: 10
  },
  startButton: {
    backgroundColor: '#1DB954',
    padding: 18,
    borderRadius: 25,
    alignItems: 'center'
  },
  startButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold'
  },
  leaveButton: {
    backgroundColor: '#282828',
    padding: 18,
    borderRadius: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF4444'
  },
  leaveButtonText: {
    color: '#FF4444',
    fontSize: 16,
    fontWeight: 'bold'
  }
});

export default SessionScreen;