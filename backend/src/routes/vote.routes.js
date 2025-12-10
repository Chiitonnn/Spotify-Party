import express from 'express';
import {
  submitVote,
  getTrackResults,
  getSessionResults
} from '../controllers/vote.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/:sessionId/vote', authenticate, submitVote);
router.get('/:sessionId/track/:trackId/results', authenticate, getTrackResults);
router.get('/:sessionId/results', authenticate, getSessionResults);

export default router;