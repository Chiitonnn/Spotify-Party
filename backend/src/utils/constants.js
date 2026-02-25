export const VOTE_TYPES = {
  LIKE: 'like',
  DISLIKE: 'dislike'
};

export const SESSION_STATUS = {
  ACTIVE: 'active',
  CLOSED: 'closed',
  PAUSED: 'paused'
};

export const WEBSOCKET_EVENTS = {
  // Client -> Server
  JOIN_SESSION: 'join_session',
  LEAVE_SESSION: 'leave_session',
  
  // Server -> Client
  USER_JOINED: 'user_joined',
  USER_LEFT: 'user_left',
  VOTE_UPDATE: 'vote_update',
  TRACK_APPROVED: 'track_approved',
  TRACK_REJECTED: 'track_rejected',
  TRACK_PLAYING: 'track_playing',
  SESSION_CLOSED: 'session_closed',
  SESSION_UPDATED: 'session_updated'
};

export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized access',
  SESSION_NOT_FOUND: 'Session not found',
  USER_NOT_FOUND: 'User not found',
  NOT_IN_SESSION: 'User not in session',
  PREMIUM_REQUIRED: 'Spotify Premium required to host',
  INVALID_TOKEN: 'Invalid or expired token',
  SPOTIFY_API_ERROR: 'Spotify API error'
};

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500
};