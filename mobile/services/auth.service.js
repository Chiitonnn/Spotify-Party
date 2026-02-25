import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../config/api';

WebBrowser.maybeCompleteAuthSession();

// On récupère dynamiquement l'URL actuelle de l'app Expo Go
const getRedirectUri = () => AuthSession.makeRedirectUri({
  preferLocalhost: false,
});

/**
 * Authentification Spotify via le backend (Mode Proxy Dynamique)
 */
export const openSpotifyAuth = async () => {
  try {
    const redirectUri = getRedirectUri();
    console.log('🔐 [AUTH] Démarrage...');
    console.log('📍 [AUTH] Redirect URI (App):', redirectUri);

    // 1. On demande l'URL Spotify au backend en lui passant NOTRE URL actuelle
    const response = await api.get('/auth/login', {
      params: {
        platform: 'mobile',
        callbackUrl: redirectUri
      }
    });

    const authUrl = response.data.authUrl;
    console.log('🌐 [AUTH] Auth URL reçue:', authUrl);

    // 2. On ouvre le browser.
    // NOTE: Sur iOS Expo Go, redirectUri doit correspondre parfaitement.
    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

    console.log('📱 Résultat du navigateur:', result.type);

    if (result.type === 'success' && result.url) {
      return await parseAndSaveToken(result.url);
    } else if (result.type === 'cancel' || result.type === 'dismiss') {
      throw new Error('Authentification annulée');
    } else {
      throw new Error('Authentification échouée : ' + result.type);
    }
  } catch (error) {
    console.error("❌ Erreur d'auth:", error.message);
    throw error;
  }
};

/**
 * Extrait et sauvegarde le token depuis l'URL de retour (exp://...)
 */
const parseAndSaveToken = async (url) => {
  console.log('📱 Callback URL reçue:', url);

  const queryStart = url.indexOf('?');
  if (queryStart === -1) throw new Error('Format URL invalide');

  const params = new URLSearchParams(url.substring(queryStart + 1));
  const token = params.get('token');
  const userId = params.get('userId');
  const error = params.get('error');

  if (error) throw new Error(`Erreur Spotify: ${decodeURIComponent(error)}`);
  if (!token) throw new Error("Pas de token dans l'URL de callback");

  await AsyncStorage.setItem('token', token);
  if (userId) await AsyncStorage.setItem('user_id', userId);

  console.log('✅ Authentification réussie!');
  return { token, userId };
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const refreshToken = async () => {
  const response = await api.post('/auth/refresh');
  return response.data;
};

export const getStoredToken = async () => {
  try { return await AsyncStorage.getItem('token'); } catch { return null; }
};

export const getStoredUser = async () => {
  try {
    const s = await AsyncStorage.getItem('user');
    return s ? JSON.parse(s) : null;
  } catch { return null; }
};

export const logout = async () => {
  await AsyncStorage.multiRemove(['token', 'user_id', 'user']);
};

export const isAuthenticated = async () => {
  try { return !!(await AsyncStorage.getItem('token')); } catch { return false; }
};

export default {
  openSpotifyAuth,
  getCurrentUser,
  refreshToken,
  getStoredToken,
  getStoredUser,
  logout,
  isAuthenticated
};