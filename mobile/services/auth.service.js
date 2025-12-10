import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../config/api';

// ✅ URL de votre backend Render
const BACKEND_URL = 'https://spotify-party.onrender.com';
const REDIRECT_URI = 'mobile://callback';

WebBrowser.maybeCompleteAuthSession();

export const openSpotifyAuth = async () => {
  try {
    // ✅ URL directe vers l'endpoint Spotify (pas d'appel API d'abord)
    const authUrl = `${BACKEND_URL}/api/auth/spotify`;
    
    console.log('🔐 Opening Spotify auth:', authUrl);

    // ✅ Utiliser WebBrowser au lieu de Linking pour gérer le callback
    const result = await WebBrowser.openAuthSessionAsync(
      authUrl,
      REDIRECT_URI
    );

    console.log('Auth result:', result);

    if (result.type === 'success' && result.url) {
      return handleAuthCallback(result.url);
    } else if (result.type === 'cancel') {
      throw new Error('Authentication cancelled');
    }
  } catch (error) {
    console.error('❌ Auth error:', error);
    throw error;
  }
};

export const handleAuthCallback = async (url) => {
  try {
    console.log('📱 Handling callback:', url);

    // Extraire le token de l'URL de callback
    const params = new URLSearchParams(url.split('?')[1]);
    const token = params.get('token');
    const userId = params.get('userId');

    if (!token) {
      throw new Error('No token in callback URL');
    }

    // Sauvegarder le token
    await AsyncStorage.setItem('jwt_token', token);
    
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

export const getCurrentUser = async () => {
  try {
    const response = await api.get('/auth/me');
    return response.data;
  } catch (error) {
    console.error('Error getting current user:', error);
    throw error;
  }
};

export const refreshToken = async () => {
  try {
    const response = await api.post('/auth/refresh');
    return response.data;
  } catch (error) {
    console.error('Error refreshing token:', error);
    throw error;
  }
};

export const getStoredToken = async () => {
  try {
    const token = await AsyncStorage.getItem('jwt_token');
    return token;
  } catch (error) {
    console.error('Error getting stored token:', error);
    return null;
  }
};

export const logout = async () => {
  try {
    await AsyncStorage.removeItem('jwt_token');
    await AsyncStorage.removeItem('user_id');
    await AsyncStorage.removeItem('user');
    console.log('Logged out successfully');
  } catch (error) {
    console.error('Error during logout:', error);
    throw error;
  }
};

export const isAuthenticated = async () => {
  try {
    const token = await AsyncStorage.getItem('jwt_token');
    return !!token;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
};