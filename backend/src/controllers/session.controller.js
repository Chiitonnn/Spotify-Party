import Session from '../models/Session.js';
import User from '../models/User.js';
import shortid from 'shortid';
import { getIO } from '../services/websocket.service.js';

export const createSession = async (req, res) => {
  try {
    const { name, playlistIds, votingThreshold } = req.body;
    const user = await User.findById(req.userId);
    
    if (!user.isPremium) {
      return res.status(403).json({ error: 'Premium required to host' });
    }
    
    const code = shortid.generate().toUpperCase().substring(0, 6);
    
    const session = new Session({
      code,
      hostId: req.userId,
      name: name || 'Spotify Party',
      playlistIds: playlistIds || [],
      votingThreshold: votingThreshold || 5,
      participants: [{
        userId: req.userId,
        joinedAt: new Date()
      }]
    });
    
    await session.save();
    await session.populate('hostId', 'displayName profileImage');
    await session.populate('participants.userId', 'displayName profileImage');
    
    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const joinSession = async (req, res) => {
  try {
    const { code } = req.body;
    
    const session = await Session.findOne({ code, isActive: true });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    const alreadyJoined = session.participants.some(
      p => p.userId.toString() === req.userId
    );
    
    if (!alreadyJoined) {
      session.participants.push({
        userId: req.userId,
        joinedAt: new Date()
      });
      await session.save();
      
      // Notifier via WebSocket
      const io = getIO();
      io.to(session._id.toString()).emit('user_joined', {
        userId: req.userId,
        participantCount: session.participants.length
      });
    }
    
    await session.populate('hostId', 'displayName profileImage');
    await session.populate('participants.userId', 'displayName profileImage');
    
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.sessionId)
      .populate('hostId', 'displayName profileImage')
      .populate('participants.userId', 'displayName profileImage');
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const leaveSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    session.participants = session.participants.filter(
      p => p.userId.toString() !== req.userId
    );
    
    // Si l'hôte quitte, fermer la session
    if (session.hostId.toString() === req.userId) {
      session.isActive = false;
    }
    
    await session.save();
    
    const io = getIO();
    io.to(session._id.toString()).emit('user_left', {
      userId: req.userId,
      participantCount: session.participants.length
    });
    
    res.json({ message: 'Left session successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const closeSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    if (session.hostId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Only host can close' });
    }
    
    session.isActive = false;
    await session.save();
    
    const io = getIO();
    io.to(session._id.toString()).emit('session_closed');
    
    res.json({ message: 'Session closed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateVotingThreshold = async (req, res) => {
  try {
    const { threshold } = req.body;
    const session = await Session.findById(req.params.sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    if (session.hostId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Only host can update' });
    }
    
    session.votingThreshold = threshold;
    await session.save();
    
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};