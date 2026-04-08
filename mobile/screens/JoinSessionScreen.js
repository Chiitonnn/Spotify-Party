import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, StatusBar, Platform, Keyboard,
  ActivityIndicator, Dimensions, Animated, ScrollView,
} from 'react-native';
import Svg, { Circle, Path, Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSession } from '../contexts/SessionContext';
import * as SessionService from '../services/session.service';

const { width, height } = Dimensions.get('window');
const S = width / 320;

const TOP_FULL = height * 0.52;
const TOP_SMALL = height * 0.22; // zone verte réduite quand clavier ouvert

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

const CloseIcon = () => (
  <Svg width={12 * S} height={12 * S} viewBox="0 0 12 12" fill="none">
    <Path d="M1 1L11 11M11 1L1 11" stroke="rgba(0,0,0,0.5)" strokeWidth="1.8" strokeLinecap="round" />
  </Svg>
);

const BlinkCursor = () => {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return <Animated.View style={[styles.cursor, { opacity }]} />;
};

const JoinSessionScreen = ({ navigation }) => {
  const { setCurrentSession } = useSession();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const inputRef = useRef(null);
  const topAnim = useRef(new Animated.Value(TOP_FULL)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const show = Keyboard.addListener('keyboardWillShow', () => {
      setKeyboardOpen(true);
      Animated.spring(topAnim, {
        toValue: TOP_SMALL,
        useNativeDriver: false,
        tension: 60,
        friction: 10,
      }).start();
    });
    const hide = Keyboard.addListener('keyboardWillHide', () => {
      setKeyboardOpen(false);
      Animated.spring(topAnim, {
        toValue: TOP_FULL,
        useNativeDriver: false,
        tension: 60,
        friction: 10,
      }).start();
    });
    return () => { show.remove(); hide.remove(); };
  }, []);

  const handleJoin = async () => {
    if (code.length < 6) return;
    try {
      setLoading(true);
      const session = await SessionService.joinSession(code.toUpperCase());
      setCurrentSession(session);
      navigation.replace('Session', { sessionId: session._id });
    } catch (error) {
      Alert.alert('Inexistant', 'Aucun salon ne correspond à ce code.');
    } finally {
      setLoading(false);
    }
  };

  const topPaddingTop = Math.max(46 * S, insets.top + 8);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#1DB954" />

      {/* TOP vert — animé */}
      <Animated.View style={[styles.topHalf, { height: topAnim, paddingTop: topPaddingTop }]}>
        <DotPattern w={width} h={TOP_FULL} />
        <View style={{ position: 'absolute', width: 220 * S, height: 220 * S, borderRadius: 110 * S, borderWidth: 44 * S, borderColor: 'rgba(255,255,255,0.07)', top: -80 * S, right: -70 * S }} />
        <View style={{ position: 'absolute', width: 100 * S, height: 100 * S, borderRadius: 50 * S, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)', bottom: 18 * S, right: 20 * S }} />
        <Text style={[styles.bigNote, { fontSize: 72 * S, top: 28 * S, right: 28 * S }]}>♪</Text>

        <View style={styles.topHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
            <CloseIcon />
          </TouchableOpacity>
        </View>

        {/* Hero caché quand clavier ouvert */}
        {!keyboardOpen && (
          <View style={styles.topHero}>
            <Text style={styles.labelTop}>Rejoindre une session</Text>
            <Text style={styles.mainTitle}>
              {'Code\nd\'ac'}
              <Text style={styles.mainTitleWhite}>cès</Text>
            </Text>
          </View>
        )}
      </Animated.View>

      {/* BOT noir — ScrollView simple, pas de KeyboardAvoidingView */}
      <ScrollView
        style={{ flex: 1, backgroundColor: '#050505' }}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(28 * S, insets.bottom + 16) }
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Badge */}
        <View style={styles.badge}>
          <Svg width={13 * S} height={10 * S} viewBox="0 0 14 10" fill="none">
            <Path d="M9.5 1C9.5 1 11 1.5 11 3.5C11 5.5 9.5 6 9.5 6" stroke="#1DB954" strokeWidth="1.2" strokeLinecap="round" />
            <Circle cx="5" cy="3.5" r="2.5" stroke="#1DB954" strokeWidth="1.2" />
            <Path d="M1 9C1 7.343 2.79 6 5 6C7.21 6 9 7.343 9 9" stroke="#1DB954" strokeWidth="1.2" strokeLinecap="round" />
          </Svg>
          <Text style={styles.badgeText}>REJOINDRE DES AMIS</Text>
        </View>

        <Text style={styles.botDesc}>
          {'Saisissez le code qui s\'affiche sur '}
          <Text style={styles.botDescStrong}>l'appareil de l'hôte</Text>
          {'.'}
        </Text>

        {/* Boxes */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => inputRef.current?.focus()}
          style={styles.codeRow}
        >
          {Array.from({ length: 6 }).map((_, i) => {
            const char = code[i] || '';
            const isActive = i === code.length;
            return (
              <View key={i} style={[
                styles.codeBox,
                char ? styles.codeBoxFilled : null,
                isActive ? styles.codeBoxActive : null,
              ]}>
                {char
                  ? <Text style={styles.codeBoxText}>{char}</Text>
                  : isActive ? <BlinkCursor /> : null
                }
              </View>
            );
          })}
        </TouchableOpacity>

        <TextInput
          ref={inputRef}
          style={styles.hiddenInput}
          value={code}
          onChangeText={(t) => setCode(t.replace(/[^A-Z0-9]/g, '').slice(0, 6))}
          maxLength={6}
          autoCapitalize="characters"
          autoCorrect={false}
          autoComplete="off"
          spellCheck={false}
          keyboardType="default"
          keyboardAppearance="dark"
          textContentType="none"
          autoFocus
        />

        <View style={styles.hint}>
          <View style={styles.hintIcon}>
            <Text style={styles.hintIconText}>i</Text>
          </View>
          <Text style={styles.hintText}>Le code est personnel à chaque session.</Text>
        </View>

        <View style={styles.divider} />

        <TouchableOpacity
          style={[styles.ctaBtn, (loading || code.length < 6) && styles.ctaBtnDisabled]}
          onPress={handleJoin}
          disabled={loading || code.length < 6}
          activeOpacity={0.88}
        >
          {loading
            ? <ActivityIndicator color="#000" size="small" />
            : <Text style={[styles.ctaLabel, code.length < 6 && styles.ctaLabelDisabled]}>Valider le code</Text>
          }
        </TouchableOpacity>
        <Text style={styles.ctaHint}>Code à 6 caractères requis</Text>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },

  topHalf: {
    backgroundColor: '#1DB954',
    overflow: 'hidden',
    paddingHorizontal: 24 * S,
    paddingBottom: 16 * S,
    justifyContent: 'space-between',
  },
  bigNote: { position: 'absolute', fontFamily: 'Outfit_900Black', color: '#000', opacity: 0.12 },
  topHeader: { flexDirection: 'row', alignItems: 'center', zIndex: 2 },
  closeBtn: {
    width: 32 * S, height: 32 * S, borderRadius: 16 * S,
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  topHero: { zIndex: 2 },
  labelTop: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 9 * S, letterSpacing: 9 * S * 0.2,
    textTransform: 'uppercase', color: 'rgba(0,0,0,0.45)', marginBottom: 6 * S,
  },
  mainTitle: {
    fontFamily: 'Outfit_900Black',
    fontSize: 42 * S, letterSpacing: -42 * S * 0.04,
    lineHeight: 42 * S * 1.02, color: '#000', includeFontPadding: false,
  },
  mainTitleWhite: { color: '#fff' },

  scrollContent: {
    paddingHorizontal: 22 * S,
    paddingTop: 22 * S,
    alignItems: 'center',
    gap: 14 * S,
  },

  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 6 * S,
    backgroundColor: 'rgba(29,185,84,0.1)',
    borderWidth: 1, borderColor: 'rgba(29,185,84,0.2)',
    borderRadius: 100, paddingVertical: 4 * S, paddingHorizontal: 11 * S,
  },
  badgeText: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 8 * S, letterSpacing: 8 * S * 0.14,
    textTransform: 'uppercase', color: '#1DB954',
  },

  botDesc: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12 * S, color: '#555',
    lineHeight: 12 * S * 1.55, textAlign: 'center',
  },
  botDescStrong: { fontFamily: 'DMSans_700Bold', color: '#bbb' },

  codeRow: {
    flexDirection: 'row', gap: 6 * S,
    alignItems: 'center', justifyContent: 'center', width: '100%',
  },
  codeBox: {
    width: 38 * S, height: 50 * S, borderRadius: 10 * S,
    backgroundColor: '#111', borderWidth: 1.5, borderColor: '#222',
    alignItems: 'center', justifyContent: 'center',
  },
  codeBoxFilled: { borderColor: '#444' },
  codeBoxActive: { borderColor: '#1DB954', backgroundColor: 'rgba(29,185,84,0.07)' },
  codeBoxText: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 20 * S, color: '#fff', includeFontPadding: false,
  },
  cursor: { width: 2 * S, height: 22 * S, backgroundColor: '#1DB954', borderRadius: S },
  hiddenInput: { position: 'absolute', width: 0, height: 0, opacity: 0 },

  hint: { flexDirection: 'row', alignItems: 'center', gap: 6 * S },
  hintIcon: {
    width: 14 * S, height: 14 * S, borderRadius: 7 * S,
    borderWidth: 1, borderColor: '#333', alignItems: 'center', justifyContent: 'center',
  },
  hintIconText: { fontFamily: 'DMSans_700Bold', fontSize: 8 * S, color: '#444' },
  hintText: { fontFamily: 'DMSans_400Regular', fontSize: 10 * S, color: '#3a3a3a' },

  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', width: '100%' },

  ctaBtn: {
    width: '100%', backgroundColor: '#1DB954',
    borderRadius: 100, paddingVertical: 13 * S,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#1DB954', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 24, elevation: 8,
  },
  ctaBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.06)', shadowOpacity: 0, elevation: 0 },
  ctaLabel: { fontFamily: 'Outfit_700Bold', fontSize: 13 * S, letterSpacing: 13 * S * 0.03, color: '#000' },
  ctaLabelDisabled: { color: '#444' },
  ctaHint: { fontFamily: 'DMSans_400Regular', fontSize: 10 * S, color: '#333', letterSpacing: 10 * S * 0.04 },
});

export default JoinSessionScreen;