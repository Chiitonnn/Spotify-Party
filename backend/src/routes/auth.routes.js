import express from 'express';
import { login, callback, refreshToken, getCurrentUser } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/login', login);
router.get('/callback', callback);
router.post('/refresh', authenticate, refreshToken);
router.get('/me', authenticate, getCurrentUser);

export default router;