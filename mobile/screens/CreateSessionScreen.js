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

const TOP_FULL = height * 0.44;
const TOP_SMALL = height * 0.18;

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

const BackArrow = () => (
  <Svg width={14 * S} height={14 * S} viewBox="0 0 14 14" fill="none">
    <Path d="M9 2L4 7L9 12" stroke="rgba(0,0,0,0.5)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const CreateSessionScreen = ({ navigation }) => {
  const { setCurrentSession } = useSession();
  const [sessionName, setSessionName] = useState('');
  const [mode, setMode] = useState('classic'); 
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
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

  const handleCreate = async () => {
    if (!sessionName.trim()) {
      Alert.alert('Oups', 'Le nom de la session ne peut pas être vide.');
      return;
    }
    try {
      setLoading(true);
      const session = await SessionService.createSession({
        name: sessionName,
        mode: mode, 
        playlistIds: [],
        votingThreshold: 1,
        trackLimit: 50,
      });
      setCurrentSession(session);
      navigation.replace('Session', { sessionId: session._id });
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de générer le salon.');
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
        <Text style={[styles.bigNote, { fontSize: 72 * S, top: 28 * S, right: 28 * S }]}>✦</Text>

        <View style={styles.topHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <BackArrow />
          </TouchableOpacity>
        </View>

        {/* Hero caché quand clavier ouvert */}
        {!keyboardOpen && (
          <View style={styles.topHero}>
            <Text style={styles.labelTop}>Créer un salon</Text>
            <Text style={styles.mainTitle}>
              {'Donnez\nle '}
              <Text style={styles.mainTitleWhite}>tempo.</Text>
            </Text>
          </View>
        )}
      </Animated.View>

      {/* BOT noir — ScrollView simple */}
      <ScrollView
        style={{ flex: 1, backgroundColor: '#050505' }}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: keyboardOpen ? Math.max(28 * S, insets.bottom + 16) : Math.max(16 * S, insets.bottom + 8) }
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Badge */}
        <View style={styles.badge}>
          <Svg width={13 * S} height={12 * S} viewBox="0 0 14 12" fill="none">
            <Path d="M1 6C1 3.239 3.239 1 6 1s5 2.239 5 5-2.239 5-5 5S1 8.761 1 6z" stroke="#1DB954" strokeWidth="1.2" />
            <Path d="M9 6l3-2v4L9 6z" stroke="#1DB954" strokeWidth="1.2" strokeLinejoin="round" />
          </Svg>
          <Text style={styles.badgeText}>HÔTE DE LA SESSION</Text>
        </View>

        {/* Form */}
        <View style={styles.formGroup}>
          <Text style={styles.mLabel}>Nom de la session</Text>
          <View style={[styles.mInputCard, isFocused && styles.mInputCardFocused]}>
            <TextInput
              style={styles.mInput}
              value={sessionName}
              onChangeText={setSessionName}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Ex: Soirée Appart"
              placeholderTextColor="#444"
              selectionColor="#1DB954"
              autoCorrect={false}
            />
          </View>
        </View>

        {/* Mode de jeu */}
        <View style={styles.formGroup}>
          <Text style={styles.mLabel}>Mode de jeu</Text>
          <View style={styles.modeContainer}>
            <TouchableOpacity
              style={[styles.modeCard, mode === 'classic' && styles.modeCardActive]}
              onPress={() => setMode('classic')}
              activeOpacity={0.8}
            >
              <View style={[styles.radio, mode === 'classic' && styles.radioActive]}>
                {mode === 'classic' && <View style={styles.radioInner} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modeTitle}>Classique</Text>
                <Text style={styles.modeDesc}>File d'attente collaborative standard.</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeCard, mode === 'vote' && styles.modeCardActive]}
              onPress={() => setMode('vote')}
              activeOpacity={0.8}
            >
              <View style={[styles.radio, mode === 'vote' && styles.radioActive]}>
                {mode === 'vote' && <View style={styles.radioInner} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modeTitle}>Vote (Skip)</Text>
                <Text style={styles.modeDesc}>Tout le monde propose 10 sons, puis vote pour passer ou garder.</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Info card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>💡</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>Comment ça marche ?</Text>
            <Text style={styles.infoDesc}>
              Une fois le salon créé, vous obtiendrez un code unique à 6 caractères pour inviter vos amis.
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* CTA */}
        <TouchableOpacity
          style={[styles.ctaBtn, loading && styles.ctaBtnDisabled]}
          onPress={handleCreate}
          disabled={loading}
          activeOpacity={0.88}
        >
          {loading
            ? <ActivityIndicator color="#000" size="small" />
            : <Text style={styles.ctaLabel}>Créer la session</Text>
          }
        </TouchableOpacity>
        <Text style={styles.ctaHint}>Compte Premium requis</Text>

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
  backBtn: {
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
    gap: 12 * S,
    flexGrow: 1,
    justifyContent: 'space-between',
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

  formGroup: { gap: 7 * S, width: '100%' },
  mLabel: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 9 * S, letterSpacing: 9 * S * 0.12,
    color: '#555', textTransform: 'uppercase', paddingLeft: 2 * S,
  },
  mInputCard: {
    borderRadius: 12 * S,
    paddingVertical: 13 * S, paddingHorizontal: 16 * S,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  mInputCardFocused: {
    borderColor: 'rgba(29,185,84,0.5)',
    backgroundColor: 'rgba(29,185,84,0.07)',
  },
  mInput: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 14 * S, color: '#fff', padding: 0,
  },

  // Mode de jeu — reskinné nouvelle UI
  modeContainer: { gap: 8 * S },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12 * S,
    borderRadius: 12 * S,
    paddingVertical: 13 * S, paddingHorizontal: 16 * S,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  modeCardActive: {
    borderColor: 'rgba(29,185,84,0.5)',
    backgroundColor: 'rgba(29,185,84,0.07)',
  },
  modeTitle: { fontFamily: 'Outfit_700Bold', fontSize: 12 * S, color: '#fff', marginBottom: 2 * S },
  modeDesc: { fontFamily: 'DMSans_400Regular', fontSize: 10 * S, color: '#555', lineHeight: 10 * S * 1.5 },
  radio: {
    width: 16 * S, height: 16 * S, borderRadius: 8 * S,
    borderWidth: 1.5, borderColor: '#333',
    justifyContent: 'center', alignItems: 'center',
  },
  radioActive: { borderColor: '#1DB954' },
  radioInner: { width: 8 * S, height: 8 * S, borderRadius: 4 * S, backgroundColor: '#1DB954' },

  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10 * S,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12 * S,
    paddingVertical: 13 * S, paddingHorizontal: 14 * S,
    width: '100%',
  },
  infoIcon: { fontSize: 14 * S, marginTop: 1 * S },
  infoTitle: { fontFamily: 'Outfit_700Bold', fontSize: 11 * S, color: '#bbb', marginBottom: 3 * S },
  infoDesc: { fontFamily: 'DMSans_400Regular', fontSize: 11 * S, color: '#555', lineHeight: 11 * S * 1.5 },

  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', width: '100%' },

  ctaBtn: {
    width: '100%', backgroundColor: '#1DB954',
    borderRadius: 100, paddingVertical: 13 * S,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#1DB954', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 24, elevation: 8,
  },
  ctaBtnDisabled: { opacity: 0.65 },
  ctaLabel: { fontFamily: 'Outfit_700Bold', fontSize: 13 * S, letterSpacing: 13 * S * 0.03, color: '#000' },
  ctaHint: { fontFamily: 'DMSans_400Regular', fontSize: 10 * S, color: '#333', letterSpacing: 10 * S * 0.04 },
});

export default CreateSessionScreen;