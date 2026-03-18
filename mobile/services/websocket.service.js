import io from 'socket.io-client';
import api from '../config/api';

// On récupère dynamiquement l'URL (Ngrok, local, ou Render) et on enlève le '/api' à la fin
const getSocketUrl = () => {
  const baseUrl = api.defaults.baseURL || 'https://spotify-party.onrender.com/api';
  return baseUrl.replace(/\/api\/?$/, '');
};

let socket = null;

export const initWebSocket = (sessionId) => {
  const socketUrl = getSocketUrl();
  console.log('🔗 [WEBSOCKET] Tentative de connexion vers:', socketUrl);

  socket = io(socketUrl, {
    transports: ['websocket'],
    reconnection: true
  });

  socket.on('connect', () => {
    console.log('WebSocket connected');
    socket.emit('join_session', sessionId);
  });

  socket.on('disconnect', () => {
    console.log('WebSocket disconnected');
  });

  return socket;
};

export const disconnectWebSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const onEvent = (event, callback) => {
  if (socket) {
    socket.on(event, callback);
  }
};

export const emit = (event, data) => {
  if (socket) {
    socket.emit(event, data);
  }
};