import io from 'socket.io-client';

const SOCKET_URL = 'https://spotify-party.onrender.com';
let socket = null;

export const initWebSocket = (sessionId) => {
  socket = io(SOCKET_URL, {
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