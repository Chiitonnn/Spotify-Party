import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../config/api';

const BACKEND_URL = 'https://spotify-party.onrender.com';
const REDIRECT_URI = 'spotifyparty://callback';

WebBrowser.maybeCompleteAuthSession();

/**
 * Ouvre l'authentification Spotify dans un navigateur
 */
export const openSpotifyAuth = async () => {
  try {
    console.log('🔐 Démarrage de l\'authentification Spotify...');
    
    // 1. Récupérer l'URL d'authentification depuis le backend
    console.log('📡 Appel de /auth/login sur:', api.defaults.baseURL);
    const response = await api.get('/auth/login');
    const authUrl = response.data.authUrl;
    
    console.log('🌐 URL d\'auth reçue:', authUrl);
    console.log('📊 Réponse complète:', response.data);

    // 2. Ouvrir le navigateur avec l'URL Spotify
    const result = await WebBrowser.openAuthSessionAsync(
      authUrl,
      REDIRECT_URI
    );

    console.log('📱 Résultat du navigateur:', result);

    // 3. Gérer le résultat
    if (result.type === 'success' && result.url) {
      return await handleAuthCallback(result.url);
    } else if (result.type === 'cancel') {
      throw new Error('Authentification annulée');
    } else {
      throw new Error('Authentification échouée');
    }
  } catch (error) {
    // CORRIGÉ : Logging d'erreur approprié avec tous les détails
    console.error('❌ Erreur d\'auth complète:', JSON.stringify({
      message: error.message,
      name: error.name,
      stack: error.stack,
      responseData: error.response?.data,
      responseStatus: error.response?.status,
      responseHeaders: error.response?.headers,
      requestUrl: error.config?.url,
      isAxiosError: error.isAxiosError
    }, null, 2));
    throw error;
  }
};

/**
 * Traite l'URL de callback après authentification
 */
export const handleAuthCallback = async (url) => {
  try {
    console.log('📱 ======= DÉBUT CALLBACK =======');
    console.log('📱 URL complète reçue:', url);

    // Vérifier s'il y a une erreur dans l'URL
    if (url.includes('error=')) {
      const errorMatch = url.match(/error=([^&]+)/);
      const encodedError = errorMatch ? errorMatch[1] : 'unknown';
      const decodedError = decodeURIComponent(encodedError);
      
      console.log('❌ Erreur détectée dans l\'URL:');
      console.log('  - Encodée:', encodedError);
      console.log('  - Décodée:', decodedError);
      
      throw new Error(`Erreur backend: ${decodedError}`);
    }

    // Extraire les paramètres de l'URL
    const urlParts = url.split('?');
    if (urlParts.length < 2) {
      throw new Error('Format d\'URL de callback invalide');
    }

    const params = new URLSearchParams(urlParts[1]);
    const token = params.get('token');
    const userId = params.get('userId');

    console.log('🔍 Paramètres extraits:', { 
      hasToken: !!token, 
      hasUserId: !!userId,
      tokenLength: token?.length,
      allParams: Object.fromEntries(params)
    });

    if (!token) {
      throw new Error('Pas de token dans l\'URL de callback');
    }

    // Sauvegarder le token dans AsyncStorage
    await AsyncStorage.setItem('token', token);
    
    if (userId) {
      await AsyncStorage.setItem('user_id', userId);
    }

    console.log('✅ Token sauvegardé avec succès');

    return { token, userId };
  } catch (error) {
    // CORRIGÉ : Logging d'erreur approprié
    console.error('❌ Erreur de callback:', {
      message: error.message,
      stack: error.stack,
      url: url
    });
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
    console.error('❌ Erreur lors de la récupération de l\'utilisateur:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
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
    console.error('❌ Erreur lors du rafraîchissement du token:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
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
    console.error('❌ Erreur lors de la récupération du token:', error.message);
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
    console.log('✅ Déconnexion réussie');
  } catch (error) {
    console.error('❌ Erreur lors de la déconnexion:', error.message);
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
    console.error('❌ Erreur lors de la vérification de l\'authentification:', error.message);
    return false;
  }
};

export default {
  openSpotifyAuth,
  handleAuthCallback,
  getCurrentUser,
  refreshToken,
  getStoredToken,
  logout,
  isAuthenticated
};