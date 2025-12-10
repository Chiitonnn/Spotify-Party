export const validateSessionCreate = (req, res, next) => {
  const { name, playlistIds, votingThreshold } = req.body;
  
  if (votingThreshold && (votingThreshold < 1 || votingThreshold > 100)) {
    return res.status(400).json({ error: 'Voting threshold must be between 1 and 100' });
  }
  
  if (playlistIds && !Array.isArray(playlistIds)) {
    return res.status(400).json({ error: 'playlistIds must be an array' });
  }
  
  next();
};

export const validateJoinSession = (req, res, next) => {
  const { code } = req.body;
  
  if (!code || code.length < 4) {
    return res.status(400).json({ error: 'Valid session code required' });
  }
  
  next();
};

export const validateVote = (req, res, next) => {
  const { trackId, voteType } = req.body;
  
  if (!trackId) {
    return res.status(400).json({ error: 'trackId is required' });
  }
  
  if (!voteType || !['like', 'dislike'].includes(voteType)) {
    return res.status(400).json({ error: 'voteType must be "like" or "dislike"' });
  }
  
  next();
};