import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../config/api';

const BACKEND_URL = 'https://spotify-party.onrender.com';
const REDIRECT_URI = 'spotifyparty://callback';

// Important : signaler à expo-web-browser que la session peut se terminer
WebBrowser.maybeCompleteAuthSession();

/**
 * Ouvre l'authentification Spotify dans un navigateur
 */
export const openSpotifyAuth = async () => {
  try {
    console.log('🔐 Starting Spotify authentication...');
    
    // 1. Récupérer l'URL d'authentification depuis le backend
    const response = await api.get('/auth/login');
    const authUrl = response.data.authUrl;
    
    console.log('🌐 Auth URL:', authUrl);

    // 2. Ouvrir le navigateur avec l'URL Spotify
    const result = await WebBrowser.openAuthSessionAsync(
      authUrl,
      REDIRECT_URI
    );

    console.log('📱 Browser result:', result);

    // 3. Gérer le résultat
    if (result.type === 'success' && result.url) {
      return await handleAuthCallback(result.url);
    } else if (result.type === 'cancel') {
      throw new Error('Authentication cancelled');
    } else {
      throw new Error('Authentication failed');
    }
  } catch (error) {
    console.error('❌ Auth error:', error);
    throw error;
  }
};

/**
 * Traite l'URL de callback après authentification
 */
export const handleAuthCallback = async (url) => {
  try {
    console.log('📱 Handling callback URL:', url);

    // Vérifier s'il y a une erreur dans l'URL
    if (url.includes('error=')) {
      const errorMatch = url.match(/error=([^&]+)/);
      const errorMessage = errorMatch ? decodeURIComponent(errorMatch[1]) : 'Authentication failed';
      throw new Error(errorMessage);
    }

    // Extraire les paramètres de l'URL
    const urlParts = url.split('?');
    if (urlParts.length < 2) {
      throw new Error('Invalid callback URL format');
    }

    const params = new URLSearchParams(urlParts[1]);
    const token = params.get('token');
    const userId = params.get('userId');

    console.log('🔍 Extracted params:', { 
      hasToken: !!token, 
      hasUserId: !!userId
    });

    if (!token) {
      throw new Error('No token in callback URL');
    }

    // Sauvegarder le token dans AsyncStorage
    await AsyncStorage.setItem('token', token);
    
    if (userId) {
      await AsyncStorage.setItem('user_id', userId);
    }

    console.log('✅ Token saved successfully');

    return { token, userId };
  } catch (error) {
    console.error('❌ Callback error:', error);
    throw error;
  }
};

/**
 * Récupère les informations de l'utilisateur connecté
 */
export const getCurrentUser = async () => {
  try {
    const response = await api.get('/auth/me');
    return response.data;
  } catch (error) {
    console.error('Error getting current user:', error);
    throw error;
  }
};

/**
 * Rafraîchit le token d'accès Spotify
 */
export const refreshToken = async () => {
  try {
    const response = await api.post('/auth/refresh');
    return response.data;
  } catch (error) {
    console.error('Error refreshing token:', error);
    throw error;
  }
};

/**
 * Récupère le token stocké localement
 */
export const getStoredToken = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    return token;
  } catch (error) {
    console.error('Error getting stored token:', error);
    return null;
  }
};

/**
 * Déconnecte l'utilisateur
 */
export const logout = async () => {
  try {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user_id');
    await AsyncStorage.removeItem('user');
    console.log('✅ Logged out successfully');
  } catch (error) {
    console.error('Error during logout:', error);
    throw error;
  }
};

/**
 * Vérifie si l'utilisateur est authentifié
 */
export const isAuthenticated = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    return !!token;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
};

// Export par défaut de toutes les fonctions
export default {
  openSpotifyAuth,
  handleAuthCallback,
  getCurrentUser,
  refreshToken,
  getStoredToken,
  logout,
  isAuthenticated
};