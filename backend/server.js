import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import cors from 'cors';
import { connectDB } from './src/config/db.js';
import authRoutes from './src/routes/auth.routes.js';
import sessionRoutes from './src/routes/session.routes.js';
import spotifyRoutes from './src/routes/spotify.routes.js';
import voteRoutes from './src/routes/vote.routes.js';
import { errorHandler } from './src/middleware/error.middleware.js';
import { setupWebSocket } from './src/services/websocket.service.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/spotify', spotifyRoutes);
app.use('/api/votes', voteRoutes);

// WebSocket
setupWebSocket(io);

// Error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  // ⚠️ CHANGEMENT ICI : Ajoutez '0.0.0.0' pour écouter sur toutes les interfaces
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
    console.log(`📡 WebSocket enabled`);
    console.log(`🌐 Accessible via: http://172.20.10.7:${PORT}`);
  });
});