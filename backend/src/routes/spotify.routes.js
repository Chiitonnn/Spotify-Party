import express from 'express';
import {
  getUserPlaylists,
  getPlaylistTracks,
  searchTracks,
  getTrack,
  playTrack // 👈 AJOUT ICI
} from '../controllers/spotify.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/playlists', authenticate, getUserPlaylists);
router.get('/playlists/:playlistId/tracks', authenticate, getPlaylistTracks);
router.get('/search', authenticate, searchTracks);
router.get('/tracks/:trackId', authenticate, getTrack);

// 👇 NOUVELLE ROUTE
router.put('/play', authenticate, playTrack);

export default router;