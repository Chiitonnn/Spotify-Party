import express from 'express';
import {
  createSession,
  joinSession,
  getSession,
  leaveSession,
  closeSession,
  updateVotingThreshold
} from '../controllers/session.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/create', authenticate, createSession);
router.post('/join', authenticate, joinSession);
router.get('/:sessionId', authenticate, getSession);
router.post('/:sessionId/leave', authenticate, leaveSession);
router.post('/:sessionId/close', authenticate, closeSession);
router.patch('/:sessionId/threshold', authenticate, updateVotingThreshold);

export default router;
