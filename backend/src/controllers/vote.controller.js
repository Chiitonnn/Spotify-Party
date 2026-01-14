import Vote from '../models/Vote.js';
import Session from '../models/Session.js';
import User from '../models/User.js'; // 👈 Import nécessaire
import { getIO } from '../services/websocket.service.js';
import { createSpotifyApi } from '../config/spotify.js'; // 👈 Pour récupérer les infos track

export const submitVote = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { trackId, voteType } = req.body;
    
    // 1. On récupère la session avec l'hôte (pour avoir son token Spotify)
    const session = await Session.findById(sessionId).populate('hostId');
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // 2. Vérif participant
    const isParticipant = session.participants.some(
      p => p.userId.toString() === req.userId
    );
    if (!isParticipant) {
      return res.status(403).json({ error: 'Not in session' });
    }
    
    // 3. Enregistrer le vote
    const vote = await Vote.findOneAndUpdate(
      { sessionId, userId: req.userId, trackId },
      { voteType },
      { upsert: true, new: true }
    );
    
    // 4. Calcul des résultats
    const votes = await Vote.find({ sessionId, trackId });
    const likes = votes.filter(v => v.voteType === 'like').length;
    const dislikes = votes.filter(v => v.voteType === 'dislike').length;
    
    // Websocket update
    const io = getIO();
    io.to(sessionId).emit('vote_update', {
      trackId,
      likes,
      dislikes,
      total: votes.length
    });
    
    // 5. LOGIQUE D'APPROBATION 🎯
    if (likes >= session.votingThreshold) {
      // Vérifier si la musique n'est pas déjà dans la liste
      const alreadyApproved = session.approvedQueue.some(t => t.trackId === trackId);
      
      if (!alreadyApproved) {
        try {
          // On utilise le token de l'HÔTE pour récupérer les infos propres de la track
          const spotifyApi = createSpotifyApi(session.hostId.spotifyAccessToken);
          const trackData = await spotifyApi.getTrack(trackId);
          const track = trackData.body;

          // On ajoute à la file d'attente validée
          session.approvedQueue.push({
            trackId: track.id,
            uri: track.uri,
            name: track.name,
            artists: track.artists.map(a => a.name),
            albumImage: track.album.images?.[0]?.url
          });

          await session.save();
          console.log(`✅ Track approved: ${track.name}`);
          
          io.to(sessionId).emit('track_approved', { 
            trackId, 
            message: `${track.name} ajoutée à la playlist de soirée !` 
          });

        } catch (spotifyError) {
          console.error('Erreur fetch track details:', spotifyError);
        }
      }
    }
    
    res.json({ vote, likes, dislikes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ... Les autres fonctions (getTrackResults, getSessionResults) restent inchangées
export const getTrackResults = async (req, res) => {
  try {
    const { sessionId, trackId } = req.params;
    const votes = await Vote.find({ sessionId, trackId });
    const likes = votes.filter(v => v.voteType === 'like').length;
    const dislikes = votes.filter(v => v.voteType === 'dislike').length;
    res.json({ trackId, likes, dislikes, total: votes.length });
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
      if (!results[vote.trackId]) results[vote.trackId] = { likes: 0, dislikes: 0, total: 0 };
      if (vote.voteType === 'like') results[vote.trackId].likes++;
      else results[vote.trackId].dislikes++;
      results[vote.trackId].total++;
    });
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserVotes = async (req, res) => {
  try {
    const { sessionId } = req.params;
    // On cherche tous les votes de CET utilisateur pour CETTE session
    const votes = await Vote.find({ sessionId, userId: req.userId });
    
    // On renvoie juste la liste des ID des musiques déjà votées
    res.json(votes.map(v => v.trackId));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};