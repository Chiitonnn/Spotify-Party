import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  StatusBar,
  Dimensions,
} from 'react-native';
import Svg, { Circle, Path, Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { openSpotifyAuth } from '../services/auth.service';
import { useAuth } from '../contexts/AuthContext';

const { width, height } = Dimensions.get('window');
const S = width / 320;

/* ─── Logo Spotify ─── */
const SpotifyBadge = () => (
  <View style={styles.sIconWrap}>
    <Svg width={15 * S} height={15 * S} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="12" fill="#1DB954" />
      <Path
        d="M17.9 10.9C14.7 9 9.35 8.8 6.3 9.75c-.5.15-1-.15-1.15-.6-.15-.5.15-1 .6-1.15 3.55-1.05 9.4-.85 13.1 1.35.45.25.6.85.35 1.3-.25.35-.85.5-1.3.25zm-.1 2.8c-.25.35-.7.5-1.05.25-2.7-1.65-6.8-2.15-9.95-1.15-.4.1-.85-.1-.95-.5-.1-.4.1-.85.5-.95 3.65-1.1 8.15-.55 11.25 1.35.3.15.45.65.2 1zm-1.2 2.75c-.2.3-.55.4-.85.2-2.35-1.45-5.3-1.75-8.8-.95-.35.1-.65-.15-.75-.45-.1-.35.15-.65.45-.75 3.8-.85 7.1-.5 9.7 1.1.35.15.4.55.25.85z"
        fill="#000"
      />
    </Svg>
  </View>
);

/* ─── Dot pattern ─── */
const DotPattern = ({ w, h }) => {
  const spacing = 18 * S;
  const dots = [];
  const cols = Math.ceil(w / spacing) + 1;
  const rows = Math.ceil(h / spacing) + 1;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      dots.push(<Circle key={`${r}-${c}`} cx={c * spacing} cy={r * spacing} r={S} fill="rgba(0,0,0,0.12)" />);
  return (
    <Svg width={w} height={h} style={{ position: 'absolute', top: 0, left: 0 }} pointerEvents="none">
      {dots}
    </Svg>
  );
};

const AuthScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    setLoading(true);
    try {
      const result = await openSpotifyAuth();
      if (result.token) {
        await login(result.token);
      } else {
        throw new Error('Pas de token reçu');
      }
    } catch (error) {
      if (error.message !== 'Authentification annulée') {
        Alert.alert('Erreur', error.message || 'Une erreur est survenue');
      }
    } finally {
      setLoading(false);
    }
  };

  const TOP_H = height * 0.55;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#1DB954" />

      {/* TOP — vert */}
      <View style={[styles.topHalf, { height: TOP_H }]}>
        <DotPattern w={width} h={TOP_H} />

        {/* deco-circle-1 : 200×200, border 40px, top:-60 right:-60 */}
        <View style={{
          position: 'absolute',
          width: 200 * S, height: 200 * S, borderRadius: 100 * S,
          borderWidth: 40 * S, borderColor: 'rgba(255,255,255,0.08)',
          top: -60 * S, right: -60 * S,
        }} />

        {/* deco-circle-2 : 120×120, border 2px, top:20 left:-30 */}
        <View style={{
          position: 'absolute',
          width: 120 * S, height: 120 * S, borderRadius: 60 * S,
          borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)',
          top: 20 * S, left: -30 * S,
        }} />

        {/* Note ♪ : font-size 80px, opacity 0.12 */}
        <Text style={[styles.bigNote, { fontSize: 80 * S, top: 28 * S, right: 28 * S }]}>♪</Text>

        <View style={styles.topContent}>
          {/* label-top : DM Sans 9px weight 700 letter-spacing 0.2em */}
          <Text style={styles.labelTop}>Bienvenue sur</Text>
          {/* main-title : Outfit 900 52px letter-spacing -0.04em line-height 0.9 */}
          <Text style={styles.mainTitle} numberOfLines={2}>
            <Text style={styles.titleBlack}>Spot</Text>
            <Text style={styles.titleWhite}>ify{'\n'}</Text>
            <Text style={styles.titleBlack}>Par</Text>
            <Text style={styles.titleWhite}>ty</Text>
          </Text>
        </View>
      </View>

      {/* BOT — noir */}
      <View style={styles.botHalf}>
        {/* Glow */}
        <View style={{ position: 'absolute', top: -40 * S, alignSelf: 'center' }} pointerEvents="none">
          <Svg width={280 * S} height={80 * S}>
            <Defs>
              <RadialGradient id="glow" cx="50%" cy="0%" rx="50%" ry="100%">
                <Stop offset="0%" stopColor="#1DB954" stopOpacity="0.2" />
                <Stop offset="100%" stopColor="#1DB954" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Rect x="0" y="0" width={280 * S} height={80 * S} fill="url(#glow)" />
          </Svg>
        </View>

        {/* Description */}
        <View style={styles.botText}>
          {/* bot-desc : DM Sans 13px color #555 line-height 1.6 */}
          <Text style={styles.botDesc}>
            <Text style={styles.botDescStrong}>DJ démocratique. </Text>
            <Text>Créez un salon, partagez le code, laissez vos amis gérer la vibe.</Text>
          </Text>
          {/* Stats */}
          <View style={styles.statsRow}>
            {[['6', 'Char. code'], ['∞', 'Invités'], ['Live', 'Sync']].map(([num, label]) => (
              <View key={label} style={styles.stat}>
                {/* stat-num : Outfit 900 22px color #1DB954 */}
                <Text style={styles.statNum}>{num}</Text>
                {/* stat-label : DM Sans 9px color #444 letter-spacing 0.08em */}
                <Text style={styles.statLabel}>{label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.divider} />

        {/* CTA */}
        <View style={styles.cta}>
          <TouchableOpacity
            style={[styles.ctaBtn, loading && styles.ctaBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.88}
          >
            {loading ? (
              <ActivityIndicator color="#000" size="small" />
            ) : (
              <>
                <SpotifyBadge />
                {/* cta-label : Outfit 700 13px */}
                <Text style={styles.ctaLabel}>Se connecter avec Spotify</Text>
              </>
            )}
          </TouchableOpacity>
          {/* cta-hint : DM Sans 10px color #333 */}
          <Text style={styles.ctaHint}>Compte Spotify requis</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },

  topHalf: {
    backgroundColor: '#1DB954',
    overflow: 'hidden',
    paddingHorizontal: 28 * S,
    paddingBottom: 32 * S,
    justifyContent: 'flex-end',
  },

  bigNote: {
    position: 'absolute',
    fontFamily: 'Outfit_900Black',
    color: '#000',
    opacity: 0.12,
  },

  topContent: { zIndex: 2, paddingTop: 4 * S },

  labelTop: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 9 * S,
    letterSpacing: 9 * S * 0.2,
    textTransform: 'uppercase',
    color: 'rgba(0,0,0,0.45)',
    marginBottom: 8 * S,
  },
  mainTitle: {
    fontFamily: 'Outfit_900Black',
    fontSize: 52 * S,
    letterSpacing: -52 * S * 0.04,
    lineHeight: 52 * S * 1.05,
    includeFontPadding: false,
  },
  titleBlack: { color: '#000' },
  titleWhite: { color: '#fff' },

  botHalf: {
    flex: 1,
    backgroundColor: '#050505',
    paddingHorizontal: 28 * S,
    paddingTop: 28 * S,
    paddingBottom: 36 * S,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },

  botText: { zIndex: 2 },
  botDesc: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13 * S,
    color: '#555',
    lineHeight: 13 * S * 1.6,
  },
  botDescStrong: {
    fontFamily: 'DMSans_700Bold',
    color: '#bbb',
  },
  statsRow: { flexDirection: 'row', gap: 20 * S, marginTop: 14 * S },
  stat: {},
  statNum: {
    fontFamily: 'Outfit_900Black',
    fontSize: 22 * S,
    color: '#1DB954',
    lineHeight: 22 * S,
    includeFontPadding: false,
  },
  statLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 9 * S,
    color: '#444',
    letterSpacing: 9 * S * 0.08,
    textTransform: 'uppercase',
    marginTop: 2 * S,
  },

  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', zIndex: 2 },

  cta: { alignItems: 'center', gap: 12 * S, zIndex: 2 },
  ctaBtn: {
    backgroundColor: '#1DB954',
    borderRadius: 100,
    paddingTop: 11 * S, paddingBottom: 11 * S,
    paddingLeft: 12 * S, paddingRight: 20 * S,
    flexDirection: 'row', alignItems: 'center',
    gap: 10 * S, alignSelf: 'stretch', justifyContent: 'center',
    shadowColor: '#1DB954',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 24, elevation: 8,
  },
  ctaBtnDisabled: { opacity: 0.65 },
  sIconWrap: {
    width: 26 * S, height: 26 * S, borderRadius: 13 * S,
    backgroundColor: '#000', alignItems: 'center', justifyContent: 'center',
  },
  ctaLabel: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 13 * S,
    letterSpacing: 13 * S * 0.03,
    color: '#000',
  },
  ctaHint: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 10 * S,
    color: '#333',
    letterSpacing: 10 * S * 0.04,
  },
});

export default AuthScreen;