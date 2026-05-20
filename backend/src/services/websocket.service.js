import jwt from 'jsonwebtoken';

let io;
// Stocker les sessions associées à chaque socket
const socketSessions = new Map(); // socket.id -> sessionId

export const setupWebSocket = (socketIO) => {
  io = socketIO;
  
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      console.warn('🔴 [WEBSOCKET] Connection refused: No JWT token provided');
      return next(new Error('Authentication error: Token missing'));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      console.warn('🔴 [WEBSOCKET] Connection refused: Invalid JWT token');
      return next(new Error('Authentication error: Invalid token'));
    }
  });
  
  io.on('connection', (socket) => {
    console.log('✅ Client connected:', socket.id);
    
    socket.on('join_session', (sessionId) => {
      socket.join(sessionId);
      socketSessions.set(socket.id, sessionId);
      console.log(`📱 Socket ${socket.id} joined session ${sessionId}`);
    });
    
    socket.on('leave_session', (sessionId) => {
      socket.leave(sessionId);
      socketSessions.delete(socket.id);
      console.log(`📤 Socket ${socket.id} left session ${sessionId}`);
    });
    
    socket.on('disconnect', () => {
      console.log('❌ Client disconnected:', socket.id);
      
      const sessionId = socketSessions.get(socket.id);
      if (sessionId) {
        console.log(`👑 Socket ${socket.id} was in session ${sessionId}, notifying others...`);
        // Envoyer un signal à TOUS les autres dans la session
        socket.to(sessionId).emit('host_disconnected', {
          reason: 'host_left',
          message: 'L\'hôte a quitté la session'
        });
      }
      socketSessions.delete(socket.id);
    });
  });
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};