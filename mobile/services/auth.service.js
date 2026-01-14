import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import api from '../config/api';

// Important : permet au navigateur de se fermer automatiquement après l'auth
WebBrowser.maybeCompleteAuthSession();

const SPOTIFY_CLIENT_ID = '3e79328c5f814b52a27d64e50a140404';

/**
 * Authentification avec Spotify via AuthSession
 */
export const openSpotifyAuth = async () => {
  try {
    console.log('🔐 Démarrage authentification Spotify...');

    // 1. Créer la redirect URI avec un scheme personnalisé
    // Important : utiliser le même scheme que dans app.json
    const redirectUri = AuthSession.makeRedirectUri({
      scheme: 'spotifyparty',
      path: 'callback',
      preferLocalhost: false,
      useProxy: false,
    });
    
    console.log('📍 Redirect URI générée:', redirectUri);
    console.log('📱 Platform:', Platform.OS);

    // 2. Configuration de l'endpoint Spotify
    const discovery = {
      authorizationEndpoint: 'https://accounts.spotify.com/authorize',
      tokenEndpoint: 'https://accounts.spotify.com/api/token',
    };

    // 3. Scopes nécessaires
    const scopes = [
      'user-read-private',
      'user-read-email',
      'playlist-read-private',
      'user-modify-playback-state',
      'user-read-playback-state',
      'streaming'
    ];

    // 4. Créer la requête d'autorisation
    const authRequest = new AuthSession.AuthRequest({
      clientId: SPOTIFY_CLIENT_ID,
      scopes: scopes,
      redirectUri: redirectUri,
      responseType: AuthSession.ResponseType.Code,
      usePKCE: false,
      // Paramètres supplémentaires pour améliorer la stabilité
      state: Math.random().toString(36).substring(7),

      extraParams: {
        show_dialog: 'true'
      }
    });

    console.log('🔧 Configuration de la requête:', {
      clientId: SPOTIFY_CLIENT_ID.substring(0, 10) + '...',
      redirectUri,
      scopes: scopes.length + ' scopes'
    });

    // 5. Ouvrir le navigateur pour l'authentification Spotify
    console.log('🌐 Ouverture du navigateur Spotify...');
    
    const result = await authRequest.promptAsync(discovery, {
      // useProxy: false est important pour iOS avec custom scheme
      useProxy: false,
      showInRecents: true,
      // Garder le navigateur ouvert même si l'app passe en arrière-plan
      createTask: Platform.OS === 'android',
    });

    console.log('📱 Résultat du navigateur:', result.type);

    // 6. Traiter le résultat
    if (result.type === 'success') {
      const { code } = result.params;
      
      if (!code) {
        throw new Error('Aucun code reçu de Spotify');
      }
      
      console.log('✅ Code OAuth reçu');
      console.log('🔄 Échange du code via le backend...');

      try {
        // 7. Échanger le code contre un token via notre backend
        const response = await api.post('/auth/exchange', {
          code,
          redirectUri
        });

        console.log('🎟️ Token JWT reçu du backend');
        
        // 8. Sauvegarder les données localement
        await AsyncStorage.setItem('token', response.data.token);
        await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
        
        console.log('✅ Authentification réussie!');
        console.log('👤 Utilisateur:', response.data.user.displayName);
        
        return {
          token: response.data.token,
          userId: response.data.user.id,
          user: response.data.user
        };
      } catch (exchangeError) {
        console.error('❌ Erreur lors de l\'échange du code:', {
          message: exchangeError.message,
          response: exchangeError.response?.data
        });
        throw new Error(
          exchangeError.response?.data?.details || 
          exchangeError.response?.data?.error || 
          'Échec de l\'échange du code d\'autorisation'
        );
      }
    } 
    
    if (result.type === 'cancel') {
      console.log('⚠️ Authentification annulée par l\'utilisateur');
      throw new Error('Authentification annulée');
    }
    
    if (result.type === 'dismiss') {
      console.log('⚠️ Navigateur fermé par l\'utilisateur');
      throw new Error('Authentification annulée');
    }
    
    if (result.type === 'error') {
      console.error('❌ Erreur AuthSession:', result.error);
      throw new Error(result.error?.message || 'Erreur d\'authentification');
    }
    
    if (result.type === 'locked') {
      console.log('⚠️ Authentification déjà en cours');
      throw new Error('Une authentification est déjà en cours');
    }
    
    throw new Error(`Résultat d'authentification inattendu: ${result.type}`);

  } catch (error) {
    console.error('❌ Erreur complète d\'authentification:', {
      message: error.message,
      name: error.name,
      stack: error.stack?.split('\n').slice(0, 3).join('\n')
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
    console.error('❌ Erreur récupération utilisateur:', error.message);
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
    console.error('❌ Erreur rafraîchissement token:', error.message);
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
    console.error('❌ Erreur récupération token:', error.message);
    return null;
  }
};

/**
 * Récupère l'utilisateur stocké localement
 */
export const getStoredUser = async () => {
  try {
    const userStr = await AsyncStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('❌ Erreur récupération utilisateur local:', error.message);
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
    console.error('❌ Erreur déconnexion:', error.message);
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
    console.error('❌ Erreur vérification auth:', error.message);
    return false;
  }
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