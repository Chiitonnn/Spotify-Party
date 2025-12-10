import shortid from 'shortid';

/**
 * Générer un code de session unique
 */
export const generateSessionCode = () => {
  return shortid.generate().toUpperCase().substring(0, 6);
};

/**
 * Formater une durée en ms vers MM:SS
 */
export const formatDuration = (durationMs) => {
  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.floor((durationMs % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Vérifier si un utilisateur est premium
 */
export const isPremiumUser = (user) => {
  return user && user.isPremium === true;
};

/**
 * Extraire l'ID d'une URI Spotify
 */
export const extractSpotifyId = (uri) => {
  if (!uri) return null;
  const parts = uri.split(':');
  return parts[parts.length - 1];
};

/**
 * Créer une réponse d'erreur standardisée
 */
export const errorResponse = (message, statusCode = 500) => {
  return {
    error: message,
    statusCode,
    timestamp: new Date().toISOString()
  };
};

/**
 * Créer une réponse de succès standardisée
 */
export const successResponse = (data, message = 'Success') => {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };
};

/**
 * Vérifier si une date est expirée
 */
export const isExpired = (date) => {
  return date && new Date() > new Date(date);
};

/**
 * Nettoyer les données utilisateur (retirer les infos sensibles)
 */
export const sanitizeUser = (user) => {
  if (!user) return null;
  
  const sanitized = user.toObject ? user.toObject() : { ...user };
  delete sanitized.spotifyAccessToken;
  delete sanitized.spotifyRefreshToken;
  delete sanitized.__v;
  
  return sanitized;
};