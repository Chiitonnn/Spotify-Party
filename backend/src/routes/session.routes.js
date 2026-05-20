import express from 'express';
import {
  createSession,
  joinSession,
  getSession,
  leaveSession,
  closeSession,
  updateVotingThreshold,
  startParty,
  addTrackToQueue,
  updateQueueOrder,
  togglePlayPause,
  skipToNext,
  skipToPrevious,
  getLastClosedSession,
  resumeSession
} from '../controllers/session.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { 
  validateSessionCreate, 
  validateJoinSession 
} from '../middleware/validate.middleware.js';

const router = express.Router();

router.post('/create', authenticate, validateSessionCreate, createSession);
router.post('/join', authenticate, validateJoinSession, joinSession);
router.get('/last-closed', authenticate, getLastClosedSession);
router.get('/:sessionId', authenticate, getSession);
router.post('/:sessionId/resume', authenticate, resumeSession);
router.post('/:sessionId/leave', authenticate, leaveSession);
router.post('/:sessionId/close', authenticate, closeSession);
router.patch('/:sessionId/threshold', authenticate, updateVotingThreshold);
router.post('/:sessionId/start', authenticate, startParty);
router.post('/:sessionId/queue', authenticate, addTrackToQueue);
router.put('/:sessionId/queue/reorder', authenticate, updateQueueOrder);

// Playback Controls
router.post('/:sessionId/playback/toggle', authenticate, togglePlayPause);
router.post('/:sessionId/playback/next', authenticate, skipToNext);
router.post('/:sessionId/playback/previous', authenticate, skipToPrevious);

export default router;
