import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  PanResponder,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSession } from '../contexts/SessionContext';
import * as VoteService from '../services/vote.service';

const { width } = Dimensions.get('window');
const VOTE_TIMER_DURATION = 10;
const SWIPE_THRESHOLD = 120;

const VoteScreen = ({ navigation, route }) => {
  const { sessionId } = route.params;
  const { currentSession, votes } = useSession();
  const [currentTrack, setCurrentTrack] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [isVoting, setIsVoting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(VOTE_TIMER_DURATION);
  const timerRef = useRef(null);

  const [votedTrackIds, setVotedTrackIds] = useState(new Set());
  const [isFinished, setIsFinished] = useState(false);

  const pan = useRef(new Animated.ValueXY()).current;

  // 1. Initialisation
  useEffect(() => {
    initializeScreen();
    return () => clearInterval(timerRef.current);
  }, []);

  // 2. Timer Logic
  useEffect(() => {
    if (loading || !currentTrack || isFinished) return;
    
    setTimeLeft(VOTE_TIMER_DURATION);
    
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          if (!isVoting) handleTimeOut(); // Auto-skip
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [currentTrack]); // Se relance quand la track change

  // --- LOGIQUE SWIPE (CORRIGÉE AVEC useMemo) ---
  // Le PanResponder est recréé à chaque fois que currentTrack change
  // pour être sûr d'avoir les bonnes données (ID, etc.)
  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: Animated.event(
      [null, { dx: pan.x, dy: pan.y }],
      { useNativeDriver: false }
    ),
    onPanResponderRelease: (e, gesture) => {
      // On vérifie isVoting ici aussi pour éviter les conflits
      if (isVoting) return;

      if (gesture.dx > SWIPE_THRESHOLD) {
        forceSwipe('right');
      } else if (gesture.dx < -SWIPE_THRESHOLD) {
        forceSwipe('left');
      } else {
        resetPosition();
      }
    }
  }), [currentTrack, isVoting]); // 👈 DÉPENDANCES CRITIQUES

  const initializeScreen = async () => {
    try {
      const myVotes = await VoteService.getUserVotes(sessionId);
      const votedSet = new Set(myVotes);
      setVotedTrackIds(votedSet);
      loadNextTrack(votedSet, true);
    } catch (error) {
      console.error('Init error:', error);
      setLoading(false);
    }
  };

  const loadNextTrack = (currentVotedSet = votedTrackIds, isInitialLoad = false) => {
    if (isInitialLoad) setLoading(true);

    // Reset position carte
    pan.setValue({ x: 0, y: 0 });

    const pool = currentSession?.trackPool || [];
    const availableTracks = pool.filter(t => t && t.id && !currentVotedSet.has(t.id));

    if (availableTracks.length === 0) {
      setIsFinished(true);
      setLoading(false);
      return;
    }

    const randomTrack = availableTracks[Math.floor(Math.random() * availableTracks.length)];
    setCurrentTrack(randomTrack);
    
    setIsFinished(false);
    setLoading(false);
    setIsVoting(false);
  };

  const resetPosition = () => {
    Animated.spring(pan, {
      toValue: { x: 0, y: 0 },
      friction: 4,
      useNativeDriver: false
    }).start();
  };

  const forceSwipe = (direction) => {
    if (isVoting) return;
    setIsVoting(true); // 🔒 Verrouillage immédiat

    const x = direction === 'right' ? width + 100 : -width - 100;
    
    Animated.timing(pan, {
      toValue: { x, y: 0 },
      duration: 250, // Rapide
      useNativeDriver: false
    }).start(() => {
      // Une fois sorti de l'écran, on lance le vote
      handleVote(direction === 'right' ? 'like' : 'dislike');
    });
  };

  const handleTimeOut = () => {
    console.log("⏰ Time Out -> Skip");
    handleVote('skip');
  };

  const handleVote = async (voteType) => {
    // Double sécurité
    if (!currentTrack) return;
    
    clearInterval(timerRef.current);
    console.log(`🗳️ Vote en cours : ${voteType} pour ${currentTrack.name}`);

    try {
      // 1. Envoi au serveur
      await VoteService.submitVote(sessionId, currentTrack.id, voteType);
      
      // 2. Mise à jour locale
      const newVotedSet = new Set(votedTrackIds);
      newVotedSet.add(currentTrack.id);
      setVotedTrackIds(newVotedSet);
      
      console.log("✅ Vote enregistré ! Suivante...");
      
      // 3. Charger la suite
      loadNextTrack(newVotedSet, false);

    } catch (error) {
      console.error('❌ Erreur Vote:', error);
      setIsVoting(false); // On débloque en cas d'erreur
      loadNextTrack(votedTrackIds, false);
    }
  };

  const formatDuration = (ms) => {
    if (!ms) return '-:-';
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Interpolations
  const cardRotate = pan.x.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp'
  });

  const likeOpacity = pan.x.interpolate({
    inputRange: [0, width / 4],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  });
  const dislikeOpacity = pan.x.interpolate({
    inputRange: [-width / 4, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp'
  });

  if (isFinished) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={{fontSize: 60}}>🎉</Text>
        <Text style={styles.titleFinished}>Votes terminés !</Text>
        <TouchableOpacity style={styles.btnFinish} onPress={() => navigation.goBack()}>
          <Text style={styles.btnFinishText}>Retour au salon</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading || !currentTrack) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#1DB954" style={{marginTop: 100}} />
      </View>
    );
  }

  const trackVotes = votes[currentTrack.id] || { likes: 0, dislikes: 0 };
  const totalTracks = currentSession.trackPool?.length || 20;
  const currentCount = votedTrackIds.size + 1;
  const remainingCount = totalTracks - currentCount;
  
  const timerWidth = (timeLeft / VOTE_TIMER_DURATION) * 100;
  const progressWidth = (currentCount / totalTracks) * 100;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconContainer}>
            <Ionicons name="musical-notes" size={20} color="#000" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Vote Session</Text>
            <Text style={styles.headerSubtitle}>Choisissez la prochaine musique</Text>
          </View>
        </View>
        <View style={styles.participantsBadge}>
          <Ionicons name="people" size={16} color="#B3B3B3" />
          <Text style={styles.participantsText}>{currentSession.participants?.length || 1}</Text>
        </View>
      </View>

      {/* TIMER */}
      <View style={styles.timerSection}>
        <View style={styles.timerBarBg}>
          <View style={[styles.timerBarFill, { width: `${timerWidth}%` }]} />
        </View>
        <Text style={styles.timerText}>{timeLeft}s restantes</Text>
      </View>

      {/* PROGRESS */}
      <View style={styles.progressInfo}>
        <View style={{flex: 1}}>
          <Text style={styles.progressLabel}>{currentCount} sur {totalTracks} morceaux</Text>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progressWidth}%` }]} />
          </View>
        </View>
        <View style={{alignItems: 'flex-end'}}>
          <Text style={styles.progressLabel}>Total Votes</Text>
          <Text style={styles.voteTotal}>{trackVotes.likes + trackVotes.dislikes}</Text>
        </View>
      </View>

      {/* CARD INTERACTIVE */}
      <View style={styles.cardContainer}>
        <Animated.View
          key={currentTrack.id} // 🔑 CLÉ UNIQUE INDISPENSABLE
          {...panResponder.panHandlers}
          style={[
            styles.card,
            { transform: [{ translateX: pan.x }, { translateY: pan.y }, { rotate: cardRotate }] }
          ]}
        >
          <Image source={{ uri: currentTrack.albumImage }} style={styles.albumImage} />
          
          <View style={styles.cardContent}>
            <View>
              <Text style={styles.trackName} numberOfLines={1}>{currentTrack.name}</Text>
              <Text style={styles.artistName} numberOfLines={1}>{currentTrack.artists.join(', ')}</Text>
              <Text style={styles.albumName} numberOfLines={1}>{currentTrack.album || 'Album inconnu'}</Text>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItemLeft}>
                <Ionicons name="thumbs-up" size={24} color="#1DB954" />
                <Text style={[styles.statText, { color: '#1DB954' }]}>{trackVotes.likes}</Text>
              </View>

              <View style={styles.durationBadge}>
                <Ionicons name="play" size={14} color="#FFF" style={{marginRight:6}} />
                <Text style={styles.durationText}>{formatDuration(currentTrack.duration)}</Text>
              </View>

              <View style={styles.statItemRight}>
                <Text style={[styles.statText, { color: '#FF4444' }]}>{trackVotes.dislikes}</Text>
                <Ionicons name="thumbs-down" size={24} color="#FF4444" />
              </View>
            </View>
          </View>

          {/* OVERLAYS */}
          <Animated.View style={[styles.overlay, { opacity: likeOpacity, backgroundColor: 'rgba(29, 185, 84, 0.4)' }]}>
             <Ionicons name="checkmark-circle" size={100} color="#FFF" />
          </Animated.View>

          <Animated.View style={[styles.overlay, { opacity: dislikeOpacity, backgroundColor: 'rgba(255, 68, 68, 0.4)' }]}>
             <Ionicons name="close-circle" size={100} color="#FFF" />
          </Animated.View>

        </Animated.View>
      </View>

      {/* FOOTER */}
      <View style={styles.footer}>
        <View style={styles.footerRowActions}>
          <TouchableOpacity onPress={() => forceSwipe('left')} style={styles.footerAction}>
            <Ionicons name="arrow-back" size={20} color="#1DB954" />
            <Text style={styles.footerText}>Glissez pour skip</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => forceSwipe('right')} style={styles.footerAction}>
            <Text style={styles.footerText}>Glissez pour like</Text>
            <Ionicons name="arrow-forward" size={20} color="#1DB954" />
          </TouchableOpacity>
        </View>
        <Text style={styles.remainingText}>{remainingCount} restantes</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', paddingTop: 60, paddingHorizontal: 20 },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1DB954', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  headerSubtitle: { color: '#B3B3B3', fontSize: 12 },
  participantsBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#282828', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 6 },
  participantsText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  timerSection: { marginBottom: 20 },
  timerBarBg: { height: 4, backgroundColor: '#333', borderRadius: 2, marginBottom: 8 },
  timerBarFill: { height: '100%', backgroundColor: '#1DB954', borderRadius: 2 },
  timerText: { color: '#B3B3B3', fontSize: 12, textAlign: 'center', fontWeight: '600' },
  progressInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 15 },
  progressLabel: { color: '#B3B3B3', fontSize: 12, marginBottom: 6, fontWeight: 'bold' },
  progressBarBg: { height: 4, backgroundColor: '#333', borderRadius: 2, width: 100 },
  progressBarFill: { height: '100%', backgroundColor: '#1DB954', borderRadius: 2 },
  voteTotal: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  cardContainer: { flex: 1, marginBottom: 20, alignItems: 'center', justifyContent: 'center' },
  card: { width: width - 40, height: '100%', backgroundColor: '#121212', borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#333', position: 'absolute' },
  albumImage: { width: '100%', flex: 0.65, resizeMode: 'cover' },
  cardContent: { flex: 0.35, padding: 20, justifyContent: 'space-between' },
  trackName: { color: '#FFF', fontSize: 26, fontWeight: 'bold', marginBottom: 4 },
  artistName: { color: '#B3B3B3', fontSize: 18, marginBottom: 2 },
  albumName: { color: '#555', fontSize: 14 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  statItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statItemRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statText: { fontSize: 20, fontWeight: 'bold' },
  durationBadge: { backgroundColor: '#282828', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 30, flexDirection: 'row', alignItems: 'center' },
  durationText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  footer: { marginBottom: 20, alignItems: 'center' },
  footerRowActions: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 10 },
  footerAction: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10 },
  footerText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  remainingText: { color: '#444', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  titleFinished: { color: '#FFF', fontSize: 24, fontWeight: 'bold', marginVertical: 20 },
  btnFinish: { backgroundColor: '#1DB954', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 30 },
  btnFinishText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});

export default VoteScreen;