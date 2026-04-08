import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, Share, ActivityIndicator, StatusBar, Image,
  Dimensions, Animated,
} from 'react-native';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Svg, { Circle, Path, Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useSession } from '../contexts/SessionContext';
import * as SessionService from '../services/session.service';

const { width, height } = Dimensions.get('window');
const S = width / 320;

/* ─── Dot pattern ─── */
const DotPattern = ({ w, h }) => {
  const spacing = 18 * S;
  const dots = [];
  const cols = Math.ceil(w / spacing) + 1;
  const rows = Math.ceil(h / spacing) + 1;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      dots.push(<Circle key={`${r}-${c}`} cx={c * spacing} cy={r * spacing} r={S} fill="rgba(0,0,0,0.1)" />);
  return (
    <Svg width={w} height={h} style={{ position: 'absolute', top: 0, left: 0 }} pointerEvents="none">
      {dots}
    </Svg>
  );
};

/* ─── Croix SVG ─── */
const CloseIcon = () => (
  <Svg width={12 * S} height={12 * S} viewBox="0 0 12 12" fill="none">
    <Path d="M1 1L11 11M11 1L1 11" stroke="rgba(0,0,0,0.5)" strokeWidth="1.8" strokeLinecap="round" />
  </Svg>
);

/* ─── Dot clignotant ─── */
const BlinkDot = () => {
  const op = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(op, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      Animated.timing(op, { toValue: 1,   duration: 800, useNativeDriver: true }),
    ])).start();
  }, []);
  return <Animated.View style={[styles.statusDot, { opacity: op }]} />;
};

/* ─── EQ bars ─── */
const EqBars = () => {
  const bars = [0, 1, 2].map(() => useRef(new Animated.Value(3 * S)).current);
  useEffect(() => {
    bars.forEach((bar, i) => {
      Animated.loop(Animated.sequence([
        Animated.timing(bar, { toValue: 12 * S, duration: 400, delay: i * 130, useNativeDriver: false }),
        Animated.timing(bar, { toValue: 3 * S,  duration: 400, useNativeDriver: false }),
      ])).start();
    });
  }, []);
  return (
    <View style={styles.eqWrap}>
      {bars.map((bar, i) => <Animated.View key={i} style={[styles.eqBar, { height: bar }]} />)}
    </View>
  );
};

/* ─── Drag handle ─── */
const DragHandle = () => (
  <View style={styles.dragHandle}>
    {[0, 1, 2].map(i => <View key={i} style={styles.dragLine} />)}
  </View>
);

const TOP_H = height * 0.42;

const SessionScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const { currentSession, setCurrentSession, skipData, prepProgress } = useSession();
  const { sessionId } = route.params;
  const [starting, setStarting] = useState(false);
  const insets = useSafeAreaInsets();

  const isHost = currentSession?.hostId?._id === user?._id || currentSession?.hostId === user?._id;

  const loadSession = async () => {
    try {
      const session = await SessionService.getSession(sessionId);
      setCurrentSession(session);
    } catch (error) {
      console.error('Erreur rafraîchissement session:', error);
    }
  };

  useEffect(() => {
    loadSession();
    // Refresh session quand on revient de l'écran de recherche
    const unsubscribe = navigation.addListener('focus', loadSession);
    return () => { unsubscribe(); };
  }, [navigation, sessionId]);

  const handleShareCode = async () => {
    try {
      await Share.share({ message: `Rejoins ma session Spotify Party avec le code: ${currentSession.code}` });
    } catch (error) { console.error(error); }
  };

  const handleAddTrack = () => navigation.navigate('Vote', { sessionId });

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

  const handleDragEnd = async ({ data }) => {
    if (!isHost) return;
    
    const isStarted = currentSession?.isPartyStarted;
    const currentTrack = isStarted && currentSession.approvedQueue?.length > 0 ? currentSession.approvedQueue[0] : null;
    const newFullQueue = isStarted ? [currentTrack, ...data] : data;

    setCurrentSession({ ...currentSession, approvedQueue: newFullQueue });
    try {
      await SessionService.updateQueueOrder(sessionId, newFullQueue);
    } catch {
      Alert.alert('Erreur', 'Impossible de sauvegarder l\'ordre.');
      loadSession();
    }
  };

  const handleSkip = async () => {
    try {
      await SessionService.submitVote(sessionId, {
        trackId: currentSession.currentTrackId || 'current',
        voteType: 'skip',
      });
    } catch (error) {
      console.error('Erreur skip:', error);
    }
  };

  const handleTogglePlay = async () => {
    try { await SessionService.togglePlayPause(sessionId); } catch (e) {
      Alert.alert('Erreur', e.error || 'Impossible de mettre en pause');
    }
  };

  const handleSkipNext = async () => {
    try { await SessionService.skipToNext(sessionId); } catch (e) {
      Alert.alert('Erreur', e.error || 'Impossible de passer au suivant');
    }
  };

  const handleSkipPrev = async () => {
    try { await SessionService.skipToPrevious(sessionId); } catch (e) {
      Alert.alert('Erreur', e.error || 'Impossible de revenir en arrière');
    }
  };

  const handleLeaveSession = () => {
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
            } catch { Alert.alert('Erreur', 'Impossible de quitter'); }
          }
        }
      ]
    );
  };

  if (!currentSession) return <View style={styles.container} />;
  
  const isStarted = currentSession.isPartyStarted;
  const fullQueue = currentSession.approvedQueue || [];
  const currentTrack = isStarted && fullQueue.length > 0 ? fullQueue[0] : null;
  const draggableQueue = isStarted ? fullQueue.slice(1) : fullQueue;

  const topPaddingTop = Math.max(46 * S, insets.top + 8);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#1DB954" />

      {/* ══════════════════════════════
          TOP — vert 42%
      ══════════════════════════════ */}
      <View style={[styles.topHalf, { height: TOP_H, paddingTop: topPaddingTop }]}>
        <DotPattern w={width} h={TOP_H} />

        {/* deco-c1 */}
        <View style={{ position: 'absolute', width: 220 * S, height: 220 * S, borderRadius: 110 * S, borderWidth: 44 * S, borderColor: 'rgba(255,255,255,0.07)', top: -80 * S, right: -70 * S }} />
        {/* deco-c2 */}
        <View style={{ position: 'absolute', width: 100 * S, height: 100 * S, borderRadius: 50 * S, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)', bottom: 18 * S, right: 20 * S }} />

        {/* Header : status badge + close */}
        <View style={styles.topHeader}>
          <View style={styles.statusBadge}>
            <BlinkDot />
            <Text style={styles.statusText}>Session en cours</Text>
          </View>
          <TouchableOpacity onPress={handleLeaveSession} style={styles.closeBtn}>
            <CloseIcon />
          </TouchableOpacity>
        </View>

        {/* Hero : titre + pills */}
        <View style={styles.topHero}>
          <Text style={styles.mainTitle}>
            <Text style={styles.titleBlack}>Spot</Text>
            <Text style={styles.titleWhite}>ify{'\n'}</Text>
            <Text style={styles.titleBlack}>Par</Text>
            <Text style={styles.titleWhite}>ty</Text>
          </Text>

          {/* Pills row */}
          <View style={styles.pillsRow}>
            {/* Code pill */}
            <TouchableOpacity onPress={handleShareCode} style={styles.pillCode}>
              <Text style={styles.pillCodeText}>{currentSession.code}</Text>
              <Text style={styles.pillCodeIcon}>⧉</Text>
            </TouchableOpacity>

            {/* Guests pill */}
            <View style={styles.pillGuests}>
              <Svg width={14 * S} height={11 * S} viewBox="0 0 16 12" fill="none">
                <Path d="M10.5 1C10.5 1 12 1.5 12 3.5C12 5.5 10.5 6 10.5 6" stroke="rgba(0,0,0,0.5)" strokeWidth="1.2" strokeLinecap="round" />
                <Circle cx="5.5" cy="3.5" r="2.5" stroke="rgba(0,0,0,0.5)" strokeWidth="1.2" />
                <Path d="M1 11C1 9.343 3.015 8 5.5 8C7.985 8 10 9.343 10 11" stroke="rgba(0,0,0,0.5)" strokeWidth="1.2" strokeLinecap="round" />
              </Svg>
              <Text style={styles.pillGuestsText}>{currentSession.participants?.length || 1} Invités</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ══════════════════════════════
          BOT — noir flex 1
      ══════════════════════════════ */}
      <View style={styles.botHalf}>
        {/* Glow */}
        <View style={{ position: 'absolute', top: -28 * S, alignSelf: 'center' }} pointerEvents="none">
          <Svg width={260 * S} height={56 * S}>
            <Defs>
              <RadialGradient id="g" cx="50%" cy="0%" rx="50%" ry="100%">
                <Stop offset="0%" stopColor="#1DB954" stopOpacity="0.18" />
                <Stop offset="100%" stopColor="#1DB954" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Rect x="0" y="0" width={260 * S} height={56 * S} fill="url(#g)" />
          </Svg>
        </View>

        {/* 🟢 MODE PRÉPARATION */}
        {currentSession.status === 'preparing' && (
          <View style={styles.prepCard}>
            <View style={styles.prepCardHeader}>
              <View style={styles.prepDot} />
              <Text style={styles.prepTitle}>Phase de préparation</Text>
            </View>
            <Text style={styles.prepText}>
              Ajoutez des musiques pour lancer la soirée !{' '}
              <Text style={styles.prepCount}>
                ({prepProgress.count || currentSession.approvedQueue?.length || 0} / 10)
              </Text>
            </Text>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.min(100, ((prepProgress.count || currentSession.approvedQueue?.length || 0) / 10) * 100)}%` }
                ]}
              />
            </View>
          </View>
        )}

        {/* 🟠 MODE VOTE / SKIP */}
        {currentSession.mode === 'vote' && currentSession.status === 'active' && (
          <View style={styles.skipCard}>
            <Text style={styles.skipLabel}>VOTE EN COURS · SKIP ?</Text>
            <View style={styles.skipRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.skipVotes}>
                  {skipData.currentVotes || 0}
                  <Text style={styles.skipThreshold}> / {skipData.threshold || Math.ceil((currentSession.participants?.length || 1) / 2)}</Text>
                </Text>
                <Text style={styles.skipSub}>Majorité requise pour passer</Text>
              </View>
              <TouchableOpacity style={styles.skipBtn} onPress={handleSkip} activeOpacity={0.85}>
                <Svg width={14 * S} height={14 * S} viewBox="0 0 16 16" fill="none">
                  <Path d="M3 3.5L9.5 8L3 12.5V3.5Z" fill="#000" />
                  <Path d="M12 3.5V12.5" stroke="#000" strokeWidth="2" strokeLinecap="round" />
                </Svg>
                <Text style={styles.skipBtnText}>Skip</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Queue header */}
        <View style={styles.queueHeader}>
          <Text style={styles.queueTitle}>
            File d'attente{' '}
            <Text style={styles.queueCount}>({fullQueue.length})</Text>
          </Text>
          {isHost && draggableQueue.length > 1 && (
            <Text style={styles.queueHint}>Maintenez pour réorganiser</Text>
          )}
        </View>

        {/* Queue list */}
        <DraggableFlatList
          data={draggableQueue}
          keyExtractor={(item, index) => `${item.uri}-${index}`}
          contentContainerStyle={[
            styles.queueList,
            { paddingBottom: Math.max(20 * S, insets.bottom) + 110 * S }
          ]}
          showsVerticalScrollIndicator={false}
          onDragEnd={handleDragEnd}
          activationDistance={isHost ? 10 : 999}
          ListHeaderComponent={
            <>
              {currentTrack && (
                <View style={styles.currentTrackWrap}>
                  <View style={styles.currentTrackBadge}>
                    <BlinkDot />
                    <Text style={styles.currentTrackBadgeText}>EN COURS</Text>
                  </View>
                  <View style={[styles.trackRow, styles.trackRowPlaying]}>
                    <Image source={{ uri: currentTrack.albumImage || 'https://via.placeholder.com/150' }} style={styles.trackCover} />
                    <View style={styles.trackInfo}>
                      <View style={styles.trackNameRow}>
                        <Text style={[styles.trackName, styles.trackNamePlaying]} numberOfLines={1}>{currentTrack.name}</Text>
                        <EqBars />
                      </View>
                      <Text style={styles.trackArtist} numberOfLines={1}>{currentTrack.artist}</Text>
                    </View>
                  </View>
                </View>
              )}
              {fullQueue.length === 0 && (
                <View style={styles.emptyWrap}>
                  <Text style={styles.emptyIcon}>🎵</Text>
                  <Text style={styles.emptyText}>La file d'attente est vide</Text>
                  <Text style={styles.emptySub}>Ajoutez vos premiers titres pour la soirée !</Text>
                </View>
              )}
            </>
          }
          renderItem={({ item, drag, isActive }) => {
            return (
              <ScaleDecorator>
                <TouchableOpacity
                  onLongPress={isHost ? drag : undefined}
                  disabled={isActive}
                  activeOpacity={1}
                  style={[
                    styles.trackRow,
                    isActive && styles.trackRowDragging,
                  ]}
                >
                  <Image
                    source={{ uri: item.albumImage || 'https://via.placeholder.com/150' }}
                    style={styles.trackCover}
                  />
                  <View style={styles.trackInfo}>
                    <Text style={styles.trackName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.trackArtist} numberOfLines={1}>{item.artist}</Text>
                  </View>
                  {isHost && <DragHandle />}
                </TouchableOpacity>
              </ScaleDecorator>
            );
          }}
        />

        {/* Bottom actions — flottant */}
        <View style={[styles.botActions, { paddingBottom: Math.max(20 * S, insets.bottom + 8) }]}>
          <View style={styles.divider} />

          <TouchableOpacity style={styles.btnAdd} onPress={handleAddTrack} activeOpacity={0.88}>
            <Svg width={14 * S} height={14 * S} viewBox="0 0 16 16" fill="none">
              <Circle cx="8" cy="8" r="6.5" stroke="#888" strokeWidth="1.2" />
              <Path d="M8 5v6M5 8h6" stroke="#888" strokeWidth="1.4" strokeLinecap="round" />
            </Svg>
            <Text style={styles.btnAddText}>Ajouter un titre</Text>
          </TouchableOpacity>

          {isHost && !currentSession.isPartyStarted && (
            <TouchableOpacity
              style={[styles.btnPlay, starting && styles.btnPlayDisabled]}
              onPress={handleStartParty}
              disabled={starting}
              activeOpacity={0.88}
            >
              {starting ? (
                <ActivityIndicator color="#000" size="small" />
              ) : (
                <>
                  <View style={styles.playIconWrap}>
                    <Svg width={9 * S} height={10 * S} viewBox="0 0 10 12" fill="none">
                      <Path d="M1.5 1.5L8.5 6L1.5 10.5V1.5Z" fill="#000" stroke="#000" strokeWidth="1" strokeLinejoin="round" />
                    </Svg>
                  </View>
                  <Text style={styles.btnPlayText}>Lancer la lecture</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {currentSession.isPartyStarted && isHost && (
            <View style={styles.playbackControls}>
              <TouchableOpacity style={styles.ctrlBtn} onPress={handleSkipPrev}>
                <Svg width={16*S} height={16*S} viewBox="0 0 24 24" fill="#fff">
                  <Path d="M19 20L9 12l10-8v16zM5 19V5h2v14H5z" />
                </Svg>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.ctrlPlayBtn} onPress={handleTogglePlay}>
                {currentSession.isPlaying ? (
                  <Svg width={20*S} height={20*S} viewBox="0 0 24 24" fill="#000">
                    <Path d="M6 4h4v16H6zM14 4h4v16h-4z" />
                  </Svg>
                ) : (
                  <Svg style={{ marginLeft: 2 * S }} width={22*S} height={22*S} viewBox="0 0 24 24" fill="#000">
                    <Path d="M6 4l15 8-15 8V4z" />
                  </Svg>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.ctrlBtn} onPress={handleSkipNext}>
                <Svg width={16*S} height={16*S} viewBox="0 0 24 24" fill="#fff">
                  <Path d="M5 4l10 8-10 8V4zM19 5v14h-2V5h2z" />
                </Svg>
              </TouchableOpacity>
            </View>
          )}

          {currentSession.isPartyStarted && !isHost && (
            <View style={styles.playingNotice}>
              <EqBars />
              <Text style={styles.playingNoticeText}>Lecture synchronisée (Temps Réel)</Text>
            </View>
          )}
        </View>

      </View>
    </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },

  /* ── TOP ── */
  topHalf: {
    backgroundColor: '#1DB954',
    overflow: 'hidden',
    paddingHorizontal: 24 * S,
    paddingBottom: 20 * S,
    justifyContent: 'space-between',
  },

  topHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 2,
  },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6 * S,
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 100, paddingVertical: 4 * S, paddingHorizontal: 10 * S,
  },
  statusDot: { width: 5 * S, height: 5 * S, borderRadius: 3 * S, backgroundColor: '#000' },
  statusText: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 8 * S, letterSpacing: 8 * S * 0.12,
    textTransform: 'uppercase', color: 'rgba(0,0,0,0.6)',
  },
  closeBtn: {
    width: 32 * S, height: 32 * S, borderRadius: 16 * S,
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },

  topHero: { zIndex: 2 },
  mainTitle: {
    fontFamily: 'Outfit_900Black',
    fontSize: 38 * S, letterSpacing: -38 * S * 0.04,
    lineHeight: 38 * S * 1.05,
    marginBottom: 14 * S,
    includeFontPadding: false,
  },
  titleBlack: { color: '#000' },
  titleWhite: { color: '#fff' },

  pillsRow: { flexDirection: 'row', gap: 8 * S, alignItems: 'center' },
  pillCode: {
    flexDirection: 'row', alignItems: 'center', gap: 7 * S,
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.15)',
    borderRadius: 100, paddingVertical: 6 * S, paddingHorizontal: 12 * S,
  },
  pillCodeText: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 11 * S, letterSpacing: 11 * S * 0.1, color: 'rgba(0,0,0,0.7)',
  },
  pillCodeIcon: { fontSize: 11 * S, color: 'rgba(0,0,0,0.4)' },
  pillGuests: {
    flexDirection: 'row', alignItems: 'center', gap: 6 * S,
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.15)',
    borderRadius: 100, paddingVertical: 6 * S, paddingHorizontal: 12 * S,
  },
  pillGuestsText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 11 * S, color: 'rgba(0,0,0,0.7)',
  },

  /* ── BOT ── */
  botHalf: { flex: 1, backgroundColor: '#050505', overflow: 'hidden' },

  /* Prep card — reskinné nouvelle UI */
  prepCard: {
    marginHorizontal: 16 * S, marginTop: 14 * S,
    backgroundColor: 'rgba(29,185,84,0.07)',
    borderWidth: 1, borderColor: 'rgba(29,185,84,0.2)',
    borderRadius: 12 * S,
    paddingVertical: 12 * S, paddingHorizontal: 14 * S,
    gap: 8 * S,
  },
  prepCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 7 * S },
  prepDot: { width: 6 * S, height: 6 * S, borderRadius: 3 * S, backgroundColor: '#1DB954' },
  prepTitle: { fontFamily: 'Outfit_700Bold', fontSize: 11 * S, color: '#1DB954' },
  prepText: { fontFamily: 'DMSans_400Regular', fontSize: 11 * S, color: '#555', lineHeight: 11 * S * 1.5 },
  prepCount: { color: '#1DB954' },
  progressBarBg: { height: 3 * S, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 2 * S, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#1DB954', borderRadius: 2 * S },

  /* Skip card — reskinné nouvelle UI */
  skipCard: {
    marginHorizontal: 16 * S, marginTop: 14 * S,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1, borderColor: 'rgba(29,185,84,0.3)',
    borderRadius: 12 * S,
    paddingVertical: 12 * S, paddingHorizontal: 14 * S,
    gap: 8 * S,
  },
  skipLabel: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 8 * S, letterSpacing: 8 * S * 0.14,
    textTransform: 'uppercase', color: '#1DB954',
  },
  skipRow: { flexDirection: 'row', alignItems: 'center', gap: 12 * S },
  skipVotes: { fontFamily: 'Outfit_700Bold', fontSize: 18 * S, color: '#fff' },
  skipThreshold: { fontFamily: 'Outfit_400Regular', fontSize: 14 * S, color: '#444' },
  skipSub: { fontFamily: 'DMSans_400Regular', fontSize: 10 * S, color: '#555', marginTop: 2 * S },
  skipBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6 * S,
    backgroundColor: '#1DB954',
    borderRadius: 100, paddingVertical: 8 * S, paddingHorizontal: 14 * S,
  },
  skipBtnText: { fontFamily: 'Outfit_700Bold', fontSize: 11 * S, color: '#000' },

  queueHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 22 * S, paddingTop: 16 * S, paddingBottom: 10 * S,
    zIndex: 2,
  },
  queueTitle: { fontFamily: 'Outfit_800ExtraBold', fontSize: 14 * S, color: '#fff' },
  queueCount: { fontFamily: 'Outfit_400Regular', fontSize: 12 * S, color: '#444' },
  queueHint: { fontFamily: 'DMSans_400Regular', fontSize: 9 * S, color: '#444', letterSpacing: 0.4 },

  queueList: { paddingHorizontal: 16 * S },

  trackRow: {
    flexDirection: 'row', alignItems: 'center', gap: 11 * S,
    paddingVertical: 8 * S, paddingHorizontal: 6 * S,
    borderRadius: 10 * S,
  },
  trackRowPlaying: { backgroundColor: 'rgba(29,185,84,0.06)' },
  trackRowDragging: {
    backgroundColor: 'rgba(29,185,84,0.12)',
    borderRadius: 10 * S,
    shadowColor: '#1DB954',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  trackCover: { width: 38 * S, height: 38 * S, borderRadius: 8 * S, flexShrink: 0 },
  trackInfo: { flex: 1, minWidth: 0 },
  trackNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 * S },
  trackName: { fontFamily: 'Outfit_700Bold', fontSize: 12 * S, color: '#fff', flexShrink: 1 },
  trackNamePlaying: { color: '#1DB954' },
  trackArtist: { fontFamily: 'DMSans_400Regular', fontSize: 10 * S, color: '#555', marginTop: S },

  eqWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 * S, height: 14 * S },
  eqBar: { width: 2 * S, borderRadius: S, backgroundColor: '#1DB954' },

  dragHandle: { flexDirection: 'column', gap: 3 * S, opacity: 0.25, flexShrink: 0 },
  dragLine: { width: 14 * S, height: 1.5, backgroundColor: '#fff', borderRadius: 2 },

  emptyWrap: { alignItems: 'center', justifyContent: 'center', marginTop: 40 * S, paddingHorizontal: 40 * S },
  emptyIcon: { fontSize: 40 * S },
  emptyText: { fontFamily: 'Outfit_700Bold', fontSize: 16 * S, color: '#fff', marginTop: 16 * S, marginBottom: 6 * S },
  emptySub: { fontFamily: 'DMSans_400Regular', fontSize: 13 * S, color: '#555', textAlign: 'center', lineHeight: 13 * S * 1.5 },

  /* Bot actions */
  botActions: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16 * S, paddingTop: 10 * S,
    backgroundColor: 'rgba(5,5,5,0.96)',
    gap: 8 * S,
  },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: 2 * S },

  btnAdd: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 100, paddingVertical: 11 * S,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 * S,
  },
  btnAddText: { fontFamily: 'Outfit_600SemiBold', fontSize: 12 * S, color: '#888' },

  btnPlay: {
    width: '100%', backgroundColor: '#1DB954',
    borderRadius: 100, paddingVertical: 10 * S,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 * S,
    shadowColor: '#1DB954', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 24, elevation: 8,
  },
  btnPlayDisabled: { opacity: 0.65 },
  playIconWrap: {
    width: 24 * S, height: 24 * S, borderRadius: 12 * S,
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  btnPlayText: { fontFamily: 'Outfit_700Bold', fontSize: 13 * S, letterSpacing: 13 * S * 0.03, color: '#000' },

  playingNotice: {
    width: '100%', backgroundColor: 'rgba(29,185,84,0.1)',
    borderWidth: 1, borderColor: 'rgba(29,185,84,0.3)',
    borderRadius: 100, paddingVertical: 12 * S,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 * S,
  },
  playingNoticeText: { fontFamily: 'Outfit_700Bold', fontSize: 12 * S, color: '#1DB954' },

  currentTrackWrap: {
    marginBottom: 8 * S,
    paddingBottom: 8 * S,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  currentTrackBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6 * S,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(29,185,84,0.12)',
    paddingHorizontal: 8 * S, paddingVertical: 3 * S,
    borderRadius: 6 * S,
    marginBottom: 6 * S, marginLeft: 6 * S,
  },
  currentTrackBadgeText: {
    fontFamily: 'Outfit_700Bold', fontSize: 8 * S, letterSpacing: 8 * S * 0.1,
    color: '#1DB954',
  },

  playbackControls: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24 * S,
    paddingVertical: 4 * S,
  },
  ctrlBtn: {
    width: 36 * S, height: 36 * S, borderRadius: 18 * S,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  ctrlPlayBtn: {
    width: 48 * S, height: 48 * S, borderRadius: 24 * S,
    backgroundColor: '#1DB954',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#1DB954', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 18, elevation: 8,
  },
});

export default SessionScreen;