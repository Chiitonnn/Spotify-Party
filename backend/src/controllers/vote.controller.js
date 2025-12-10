import Vote from '../models/Vote.js';
import Session from '../models/Session.js';
import { getIO } from '../services/websocket.service.js';

export const submitVote = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { trackId, voteType } = req.body;
    
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    const isParticipant = session.participants.some(
      p => p.userId.toString() === req.userId
    );
    
    if (!isParticipant) {
      return res.status(403).json({ error: 'Not in session' });
    }
    
    // Upsert du vote
    const vote = await Vote.findOneAndUpdate(
      { sessionId, userId: req.userId, trackId },
      { voteType },
      { upsert: true, new: true }
    );
    
    // Calculer les résultats
    const votes = await Vote.find({ sessionId, trackId });
    const likes = votes.filter(v => v.voteType === 'like').length;
    const dislikes = votes.filter(v => v.voteType === 'dislike').length;
    
    // Notifier via WebSocket
    const io = getIO();
    io.to(sessionId).emit('vote_update', {
      trackId,
      likes,
      dislikes,
      total: votes.length
    });
    
    // Si seuil atteint, lancer la musique
    if (likes >= session.votingThreshold) {
      io.to(sessionId).emit('track_approved', { trackId });
    }
    
    res.json({ vote, likes, dislikes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTrackResults = async (req, res) => {
  try {
    const { sessionId, trackId } = req.params;
    
    const votes = await Vote.find({ sessionId, trackId });
    const likes = votes.filter(v => v.voteType === 'like').length;
    const dislikes = votes.filter(v => v.voteType === 'dislike').length;
    
    res.json({
      trackId,
      likes,
      dislikes,
      total: votes.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getSessionResults = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const votes = await Vote.find({ sessionId });
    
    const results = {};
    votes.forEach(vote => {
      if (!results[vote.trackId]) {
        results[vote.trackId] = { likes: 0, dislikes: 0, total: 0 };
      }
      if (vote.voteType === 'like') results[vote.trackId].likes++;
      else results[vote.trackId].dislikes++;
      results[vote.trackId].total++;
    });
    
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};