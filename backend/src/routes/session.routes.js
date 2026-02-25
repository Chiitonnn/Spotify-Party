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
  updateQueueOrder
} from '../controllers/session.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/create', authenticate, createSession);
router.post('/join', authenticate, joinSession);
router.get('/:sessionId', authenticate, getSession);
router.post('/:sessionId/leave', authenticate, leaveSession);
router.post('/:sessionId/close', authenticate, closeSession);
router.patch('/:sessionId/threshold', authenticate, updateVotingThreshold);
router.post('/:sessionId/start', authenticate, startParty);
router.post('/:sessionId/queue', authenticate, addTrackToQueue);
router.put('/:sessionId/queue/reorder', authenticate, updateQueueOrder);

export default router;
