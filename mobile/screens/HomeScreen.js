import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Image,
  Animated,
  Dimensions,
} from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
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

/* ─── Equalizer animé ─── */
const EqBars = () => {
  const b = [0,1,2,3].map(() => useRef(new Animated.Value(3 * S)).current);
  useEffect(() => {
    b.forEach((bar, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bar, { toValue: 14 * S, duration: 400, delay: i * 100, useNativeDriver: false }),
          Animated.timing(bar, { toValue: 3 * S,  duration: 400, useNativeDriver: false }),
        ])
      ).start();
    });
  }, []);
  return (
    <View style={styles.eqWrap}>
      {b.map((bar, i) => <Animated.View key={i} style={[styles.eqBar, { height: bar }]} />)}
    </View>
  );
};

/* ─── Dot clignotant ─── */
const BlinkDot = () => {
  const op = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(op, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      Animated.timing(op, { toValue: 1,   duration: 800, useNativeDriver: true }),
    ])).start();
  }, []);
  return <Animated.View style={[styles.npDot, { opacity: op }]} />;
};

export default function HomeScreen({ navigation }) {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const initials = user?.displayName ? user.displayName.charAt(0).toUpperCase() : '?';

  const [lastClosedSession, setLastClosedSession] = useState(null);

  useFocusEffect(
    useCallback(() => {
      const fetchLastSession = async () => {
        try {
          const session = await SessionService.getLastClosedSession();
          setLastClosedSession(session);
        } catch (err) {
          console.log('Error fetching last closed session:', err);
        }
      };
      fetchLastSession();
    }, [])
  );

  const handleResumeSession = async () => {
    if (!lastClosedSession) return;
    try {
      await SessionService.resumeSession(lastClosedSession._id);
      navigation.navigate('Session', { sessionId: lastClosedSession._id });
    } catch (err) {
      console.log('Error resuming session:', err);
    }
  };

  // padding-top maquette : 46px + safe area iOS
  const topPaddingTop = Math.max(46 * S, insets.top + 8);
  const TOP_H = height * 0.52;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#1DB954" />

      {/* ── TOP vert 52% ── */}
      <View style={[styles.topHalf, { height: TOP_H, paddingTop: topPaddingTop }]}>
        <DotPattern w={width} h={TOP_H} />

        {/* deco-c1 : 220×220 border 44px top:-80 right:-70 */}
        <View style={{
          position: 'absolute',
          width: 220 * S, height: 220 * S, borderRadius: 110 * S,
          borderWidth: 44 * S, borderColor: 'rgba(255,255,255,0.07)',
          top: -80 * S, right: -70 * S,
        }} />
        {/* deco-c2 : 100×100 border 1.5px bottom:18 right:20 */}
        <View style={{
          position: 'absolute',
          width: 100 * S, height: 100 * S, borderRadius: 50 * S,
          borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)',
          bottom: 18 * S, right: 20 * S,
        }} />

        {/* Header */}
        <View style={styles.topHeader}>
          <View style={styles.avatarRow}>
            {user?.profileImage ? (
              <Image source={{ uri: user.profileImage }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarInitial}>
                <Text style={styles.avatarInitialText}>{initials}</Text>
              </View>
            )}
            <View>
              <Text style={styles.greeting}>Bonjour,</Text>
              <Text style={styles.username}>{user?.displayName || 'Invité'}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Text style={styles.logoutIcon}>⎋</Text>
          </TouchableOpacity>
        </View>

        {/* Hero */}
        <View>
          {/* top-title : Outfit 900, 38px, letter-spacing -0.03em, line-height 1.05 */}
          <Text style={styles.heroTitle}>
            {'La musique,\nc\'est '}
            <Text style={styles.heroTitleWhite}>vous</Text>
            {'\nqui décidez.'}
          </Text>
          {/* top-sub : DM Sans 500, 12px, rgba(0,0,0,0.6), line-height 1.55 */}
          <Text style={styles.heroSub}>
            Créez un salon ou rejoignez vos amis pour composer la playlist collective.
          </Text>
        </View>
      </View>

      {/* ── BOT noir flex 1 ── */}
      <View style={[styles.botHalf, { paddingBottom: Math.max(22 * S, insets.bottom + 8) }]}>

        {/* Glow */}
        <View style={{ position: 'absolute', top: -28 * S, alignSelf: 'center' }} pointerEvents="none">
          <Svg width={260 * S} height={56 * S}>
            <Defs>
              <RadialGradient id="g" cx="50%" cy="0%" rx="50%" ry="100%">
                <Stop offset="0%" stopColor="#1DB954" stopOpacity="0.15" />
                <Stop offset="100%" stopColor="#1DB954" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Rect x="0" y="0" width={260 * S} height={56 * S} fill="url(#g)" />
          </Svg>
        </View>

        {/* Créer */}
        <TouchableOpacity style={styles.btnCreateWrap} onPress={() => navigation.navigate('CreateSession')} activeOpacity={0.88}>
          <LinearGradient colors={['#1db954', '#18a04a', '#0d6b30']} start={{ x: 0.1, y: 0 }} end={{ x: 1, y: 1 }} style={styles.btnCreate}>
            <View style={{ flex: 1 }}>
              <View style={styles.createIconBox}>
                <Text style={styles.createIconText}>✦</Text>
              </View>
              {/* btn-create-title : Outfit 800 17px */}
              <Text style={styles.createTitle}>Créer un salon</Text>
              <View style={styles.createBottomRow}>
                {/* btn-create-sub : DM Sans 11px rgba(255,255,255,0.65) */}
                <Text style={styles.createSub}>Devenez l'hôte · Code unique</Text>
                {/* btn-create-tag : Space Mono (fallback Outfit) 7px */}
                <Text style={styles.createTag}>PREMIUM REQUIS</Text>
              </View>
            </View>
            <View style={styles.createArrowBox}>
              <Text style={styles.createArrow}>↗</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Rejoindre */}
        <TouchableOpacity style={styles.btnJoin} onPress={() => navigation.navigate('JoinSession')} activeOpacity={0.88}>
          <View style={styles.joinIconBox}>
            <Text style={styles.joinIconText}>⇥</Text>
          </View>
          <View style={{ flex: 1 }}>
            {/* btn-join-title : Outfit 700 15px */}
            <Text style={styles.joinTitle}>Rejoindre un salon</Text>
            {/* btn-join-sub : DM Sans 11px #666 */}
            <Text style={styles.joinSub}>Entrez le code d'un ami</Text>
          </View>
          <Text style={styles.joinArrow}>→</Text>
        </TouchableOpacity>

        {/* Dernière soirée active */}
        {lastClosedSession && (
          <TouchableOpacity 
            style={styles.nowPlaying} 
            activeOpacity={0.88}
            onPress={handleResumeSession}
          >
            <View style={styles.npCover}>
              <Text style={styles.npEmoji}>🎵</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.npLabelRow}>
                <BlinkDot />
                <Text style={styles.npLabel}>EN ATTENTE</Text>
              </View>
              <Text style={styles.npTitle}>{lastClosedSession.name || 'Dernière soirée active'}</Text>
              <Text style={styles.npSub}>{lastClosedSession.participants?.length || 0} participants</Text>
            </View>
            <EqBars />
          </TouchableOpacity>
        )}

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },

  topHalf: {
    backgroundColor: '#1DB954',
    overflow: 'hidden',
    paddingHorizontal: 24 * S,
    paddingBottom: 24 * S,
    justifyContent: 'space-between',
  },

  topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 10 * S },
  avatar: { width: 36 * S, height: 36 * S, borderRadius: 18 * S },
  avatarInitial: {
    width: 36 * S, height: 36 * S, borderRadius: 18 * S,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitialText: { fontFamily: 'Outfit_800ExtraBold', fontSize: 14 * S, color: '#fff' },

  greeting: { fontFamily: 'DMSans_500Medium', fontSize: 10 * S, color: 'rgba(0,0,0,0.5)', letterSpacing: 0.2 },
  username: { fontFamily: 'Outfit_700Bold', fontSize: 13 * S, color: '#000' },

  logoutBtn: {
    width: 32 * S, height: 32 * S, borderRadius: 16 * S,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  logoutIcon: { fontFamily: 'DMSans_400Regular', fontSize: 13 * S, color: 'rgba(0,0,0,0.45)' },

  heroTitle: {
    fontFamily: 'Outfit_900Black',
    fontSize: 38 * S,
    letterSpacing: -38 * S * 0.03,
    lineHeight: 38 * S * 1.05,
    color: '#000',
    includeFontPadding: false,
  },
  heroTitleWhite: { color: '#fff' },
  heroSub: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12 * S,
    color: 'rgba(0,0,0,0.6)',
    marginTop: 10 * S,
    lineHeight: 12 * S * 1.55,
    maxWidth: 230 * S,
    includeFontPadding: false,
  },

  botHalf: {
    flex: 1,
    backgroundColor: '#050505',
    paddingHorizontal: 22 * S,
    paddingTop: 16 * S,
    gap: 10 * S,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },

  btnCreateWrap: {
    borderRadius: 18 * S,
    shadowColor: '#1DB954',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22, shadowRadius: 28, elevation: 10,
  },
  btnCreate: {
    borderRadius: 18 * S,
    paddingVertical: 16 * S, paddingHorizontal: 18 * S,
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
  },
  createIconBox: {
    width: 42 * S, height: 42 * S, borderRadius: 12 * S,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12 * S,
  },
  createIconText: { fontFamily: 'Outfit_900Black', fontSize: 18 * S, color: '#fff' },
  createTitle: { fontFamily: 'Outfit_800ExtraBold', fontSize: 17 * S, color: '#fff', marginBottom: 2 * S },
  createBottomRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 * S },
  createSub: { fontFamily: 'DMSans_400Regular', fontSize: 11 * S, color: 'rgba(255,255,255,0.65)' },
  createTag: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 7 * S, letterSpacing: 7 * S * 0.12,
    color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase',
  },
  createArrowBox: {
    width: 30 * S, height: 30 * S, borderRadius: 15 * S,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  createArrow: { fontFamily: 'Outfit_400Regular', fontSize: 14 * S, color: '#fff' },

  btnJoin: {
    borderRadius: 16 * S,
    paddingVertical: 14 * S, paddingHorizontal: 16 * S,
    flexDirection: 'row', alignItems: 'center', gap: 14 * S,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  joinIconBox: {
    width: 42 * S, height: 42 * S, borderRadius: 12 * S,
    backgroundColor: 'rgba(29,185,84,0.12)',
    borderWidth: 1, borderColor: 'rgba(29,185,84,0.18)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  joinIconText: { fontFamily: 'Outfit_700Bold', fontSize: 17 * S, color: '#1DB954' },
  joinTitle: { fontFamily: 'Outfit_700Bold', fontSize: 15 * S, color: '#fff', marginBottom: 2 * S },
  joinSub: { fontFamily: 'DMSans_400Regular', fontSize: 11 * S, color: '#666' },
  joinArrow: { fontFamily: 'Outfit_400Regular', fontSize: 15 * S, color: 'rgba(255,255,255,0.3)' },

  nowPlaying: {
    flexDirection: 'row', alignItems: 'center', gap: 12 * S,
    backgroundColor: 'rgba(29,185,84,0.07)',
    borderWidth: 1, borderColor: 'rgba(29,185,84,0.13)',
    borderRadius: 14 * S,
    paddingVertical: 11 * S, paddingHorizontal: 14 * S,
  },
  npCover: {
    width: 36 * S, height: 36 * S, borderRadius: 8 * S,
    backgroundColor: '#1a1a1a',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  npEmoji: { fontSize: 15 * S },
  npLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4 * S, marginBottom: 3 * S },
  npDot: { width: 4 * S, height: 4 * S, borderRadius: 2 * S, backgroundColor: '#1DB954' },
  npLabel: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 8 * S, letterSpacing: 8 * S * 0.1,
    textTransform: 'uppercase', color: '#1DB954',
  },
  npTitle: { fontFamily: 'Outfit_600SemiBold', fontSize: 12 * S, color: '#ddd' },
  npSub: { fontFamily: 'DMSans_400Regular', fontSize: 10 * S, color: '#555', marginTop: 1 * S },

  eqWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 * S, height: 16 * S, flexShrink: 0 },
  eqBar: { width: 2 * S, borderRadius: S, backgroundColor: '#1DB954' },
});