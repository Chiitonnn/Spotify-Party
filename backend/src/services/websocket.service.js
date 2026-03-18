import jwt from 'jsonwebtoken';

let io;

export const setupWebSocket = (socketIO) => {
  io = socketIO;
  
  // 🛡️ SECURITY: WebSocket Connection Authentication Middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      console.warn('🔴 [WEBSOCKET] Connection refused: No JWT token provided');
      return next(new Error('Authentication error: Token missing'));
    }
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded; // Attach user info to socket
      next();
    } catch (err) {
      console.warn('🔴 [WEBSOCKET] Connection refused: Invalid JWT token');
      return next(new Error('Authentication error: Invalid token'));
    }
  });
  
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    socket.on('join_session', (sessionId) => {
      socket.join(sessionId);
      console.log(`Socket ${socket.id} joined session ${sessionId}`);
    });
    
    socket.on('leave_session', (sessionId) => {
      socket.leave(sessionId);
      console.log(`Socket ${socket.id} left session ${sessionId}`);
    });
    
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};