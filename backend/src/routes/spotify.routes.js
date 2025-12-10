import express from 'express';
import {
  getUserPlaylists,
  getPlaylistTracks,
  searchTracks,
  getTrack
} from '../controllers/spotify.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/playlists', authenticate, getUserPlaylists);
router.get('/playlists/:playlistId/tracks', authenticate, getPlaylistTracks);
router.get('/search', authenticate, searchTracks);
router.get('/tracks/:trackId', authenticate, getTrack);

export default router;