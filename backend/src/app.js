import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import authRoutes from './routes/auth.routes.js';
import sessionRoutes from './routes/session.routes.js';
import spotifyRoutes from './routes/spotify.routes.js';
import voteRoutes from './routes/vote.routes.js';
import { errorHandler } from './middleware/error.middleware.js';

const app = express();

// Middleware
app.use(cors({
  origin: config.cors.origins,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date(),
    environment: config.server.env
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/spotify', spotifyRoutes);
app.use('/api/votes', voteRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler (doit être en dernier)
app.use(errorHandler);

export default app;