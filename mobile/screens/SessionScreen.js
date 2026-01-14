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

  useEffect(() => {
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
      // Gérer l'erreur silencieusement ou rediriger
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

  const handleStartParty = async () => {
    if (!currentSession.approvedQueue || currentSession.approvedQueue.length === 0) {
      Alert.alert('Trop tôt !', 'Aucune musique validée pour le moment.');
      return;
    }

    try {
      setStarting(true);
      await SessionService.startParty(sessionId);
      Alert.alert('Succès', 'La musique se lance sur votre appareil !');
    } catch (error) {
      Alert.alert('Erreur', 'Vérifiez que Spotify est ouvert sur votre téléphone.');
    } finally {
      setStarting(false);
    }
  };

  const handleLeaveSession = async () => {
    Alert.alert(
      'Quitter',
      isHost ? 'Fermer la session pour tout le monde ?' : 'Voulez-vous quitter ?',
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* HEADER : INFO SESSION */}
      <View style={styles.header}>
        <View>
          <Text style={styles.subtitle}>Session en cours</Text>
          <Text style={styles.title}>{currentSession.name}</Text>
        </View>
        <TouchableOpacity onPress={handleLeaveSession} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* TICKET CODE */}
      <View style={styles.codeCard}>
        <Text style={styles.codeLabel}>CODE D'ACCÈS</Text>
        <TouchableOpacity onPress={handleShareCode} style={styles.codeRow}>
          <Text style={styles.code}>{currentSession.code}</Text>
          <Ionicons name="copy-outline" size={24} color="#1DB954" />
        </TouchableOpacity>
        <Text style={styles.codeInstruction}>Partagez ce code pour inviter des amis</Text>
      </View>

      {/* STATS RAPIDES */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{currentSession.approvedQueue?.length || 0}</Text>
          <Text style={styles.statLabel}>Validées</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{currentSession.participants?.length || 0}</Text>
          <Text style={styles.statLabel}>Invités</Text>
        </View>
      </View>

      {/* LISTE PARTICIPANTS */}
      <Text style={styles.sectionTitle}>Participants</Text>
      <FlatList
        data={currentSession.participants}
        keyExtractor={(item) => item.userId._id || item.userId}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: 0, paddingBottom: 20 }}
        renderItem={({ item }) => (
          <View style={styles.participantItem}>
            <View style={styles.avatar}>
              <Text style={{fontSize: 20}}>👤</Text>
            </View>
            <Text style={styles.participantName} numberOfLines={1}>
              {item.userId.displayName || 'Invité'}
            </Text>
          </View>
        )}
      />

      {/* FOOTER ACTIONS */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.voteButton}
          onPress={handleStartVoting}
        >
          <Ionicons name="thumbs-up" size={20} color="#FFF" />
          <Text style={styles.voteButtonText}>Commencer à voter</Text>
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
                <Text style={styles.startButtonText}>LANCER LA SOIRÉE</Text>
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
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 50,
    paddingHorizontal: 20
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30
  },
  subtitle: { color: '#1DB954', fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
  title: { color: '#FFF', fontSize: 28, fontWeight: 'bold' },
  closeBtn: { padding: 10, backgroundColor: '#282828', borderRadius: 20 },

  codeCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#333'
  },
  codeLabel: { color: '#666', fontSize: 12, fontWeight: 'bold', marginBottom: 10, letterSpacing: 2 },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  code: { color: '#FFF', fontSize: 42, fontWeight: 'bold', letterSpacing: 5 },
  codeInstruction: { color: '#B3B3B3', fontSize: 12, marginTop: 15 },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#121212',
    borderRadius: 15,
    padding: 20,
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 30
  },
  statItem: { alignItems: 'center' },
  statValue: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  statLabel: { color: '#666', fontSize: 12 },
  divider: { width: 1, height: '100%', backgroundColor: '#333' },

  sectionTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  participantItem: { alignItems: 'center', marginRight: 20, width: 70 },
  avatar: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#282828', justifyContent: 'center', alignItems: 'center',
    marginBottom: 8, borderWidth: 2, borderColor: '#1DB954'
  },
  participantName: { color: '#B3B3B3', fontSize: 12, textAlign: 'center' },

  footer: {
    marginBottom: 30,
    gap: 15
  },
  voteButton: {
    backgroundColor: '#282828',
    padding: 18,
    borderRadius: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10
  },
  voteButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

  startButton: {
    backgroundColor: '#1DB954',
    padding: 18,
    borderRadius: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#1DB954',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10
  },
  startButtonText: { color: '#000', fontSize: 16, fontWeight: 'bold' }
});

export default SessionScreen;