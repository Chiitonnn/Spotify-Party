import Session from '../models/Session.js';
import User from '../models/User.js';
import shortid from 'shortid';
import { getIO } from '../services/websocket.service.js';
import { createSpotifyApi } from '../config/spotify.js';

export const createSession = async (req, res) => {
  try {
    // On récupère trackLimit du front
    const { name, playlistIds, votingThreshold, trackLimit } = req.body;
    const user = await User.findById(req.userId);
    
    if (!user.isPremium) {
      return res.status(403).json({ error: 'Premium required to host' });
    }

    // 1. Récupérer TOUTES les musiques des playlists sélectionnées
    const spotifyApi = createSpotifyApi(user.spotifyAccessToken);
    let allTracks = [];

    // Pour chaque playlist, on récupère les sons (limité aux 50 premiers pour aller vite)
    for (const pid of playlistIds) {
      try {
        const data = await spotifyApi.getPlaylistTracks(pid, { limit: 50, market: 'FR' });
        const cleanTracks = data.body.items
          .filter(item => item.track && item.track.id) // Enlever les nulls
          .map(item => ({
            id: item.track.id,
            name: item.track.name,
            uri: item.track.uri,
            artists: item.track.artists.map(a => a.name),
            albumImage: item.track.album.images?.[0]?.url || 'https://via.placeholder.com/300',
            // On gère la preview ici directement
            preview_url: item.track.preview_url 
              ? item.track.preview_url 
              : 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
          }));
        allTracks = [...allTracks, ...cleanTracks];
      } catch (err) {
        console.error(`Erreur playlist ${pid}:`, err.message);
      }
    }

    // 2. MÉLANGE (SHUFFLE) 🎲
    // Algorithme de Fisher-Yates pour bien mélanger
    for (let i = allTracks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allTracks[i], allTracks[j]] = [allTracks[j], allTracks[i]];
    }

    // 3. LIMITER (SLICE) ✂️
    // On garde uniquement le nombre demandé (ex: 10)
    const limit = parseInt(trackLimit) || 20;
    const finalPool = allTracks.slice(0, limit);

    const code = shortid.generate().toUpperCase().substring(0, 6);
    
    const session = new Session({
      code,
      hostId: req.userId,
      name: name || 'Spotify Party',
      playlistIds: playlistIds || [],
      votingThreshold: votingThreshold || 5,
      trackLimit: limit,
      trackPool: finalPool, // 💾 On sauvegarde la sélection !
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
    console.error('Create Session Error:', error);
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

export const startParty = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await Session.findById(sessionId);
    const user = await User.findById(req.userId);

    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.hostId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Seul l\'hôte peut lancer la soirée' });
    }
    if (!session.approvedQueue || session.approvedQueue.length === 0) {
      return res.status(400).json({ error: 'Aucune musique n\'a été votée !' });
    }

    const spotifyApi = createSpotifyApi(user.spotifyAccessToken);

    // 1. Chercher les appareils
    const devicesData = await spotifyApi.getMyDevices();
    const devices = devicesData.body.devices;
    
    const targetDevice = devices.find(d => d.type === 'Smartphone') 
                      || devices.find(d => d.is_active) 
                      || devices[0];

    if (!targetDevice) {
      return res.status(404).json({ error: 'Ouvrez Spotify sur votre téléphone et lancez une musique.' });
    }

    const uris = session.approvedQueue.map(track => track.uri);
    console.log(`🚀 Lancement soirée sur ${targetDevice.name}...`);

    try {
      // ⚡ Tentative de transfert
      if (!targetDevice.is_active) {
        console.log("💤 Appareil inactif, tentative de transfert...");
        await spotifyApi.transferMyPlayback([targetDevice.id]);
        
        // On attend 1 seconde complète pour laisser le réseau se faire
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // 🎵 On lance la musique
      await spotifyApi.play({ 
        uris: uris, 
        device_id: targetDevice.id 
      });

      res.json({ message: 'Party started!', count: uris.length });

    } catch (playError) {
      console.error('❌ Erreur de lecture Spotify:', playError.message);
      
      // 👇 LE MESSAGE D'ERREUR ADAPTÉ À TA DÉCOUVERTE !
      if (playError.statusCode === 404 || playError.statusCode === 403 || playError.statusCode === 502) {
        return res.status(400).json({ 
          error: 'Astuce : Lancez d\'abord une musique manuellement sur votre application Spotify, mettez pause, puis cliquez sur "Lancer la Soirée" !' 
        });
      }
      
      throw playError;
    }

  } catch (error) {
    console.error('❌ Start Party Error:', error);
    res.status(500).json({ error: error.message || 'Une erreur est survenue lors du lancement.' });
  }
};

export const addTrackToQueue = async (req, res) => {
  try {
    const { sessionId } = req.params;
    // 🛡️ On récupère maintenant albumImage envoyé par le mobile
    const { trackUri, trackName, artistName, albumImage } = req.body; 

    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ error: 'Session introuvable' });

    // On récupère le compte Spotify de l'hôte
    const host = await User.findById(session.hostId);
    if (!host) return res.status(404).json({ error: 'Hôte introuvable' });

    const spotifyApi = createSpotifyApi(host.spotifyAccessToken);

    console.log(`📡 Demande d'ajout à la file d'attente : ${trackName} par l'utilisateur ${req.userId}`);

    try {
      // 🔥 Commande Spotify API
      await spotifyApi.addToQueue(trackUri);

      // ✅ On sauvegarde tout dans la base de données, y compris l'image pour l'affichage mobile
      session.approvedQueue.push({
        uri: trackUri,
        name: trackName,
        artist: artistName,
        albumImage: albumImage // 👈 Ajouté ici pour corriger le front
      });
      await session.save();

      res.json({ message: 'Titre ajouté avec succès à la file d\'attente !' });

    } catch (spotifyError) {
      console.error('❌ Erreur AddToQueue Spotify:', spotifyError.message);
      
      if (spotifyError.statusCode === 404 || spotifyError.statusCode === 403 || spotifyError.statusCode === 502) {
        return res.status(400).json({ 
          error: 'Le Spotify de l\'hôte est en veille. Dites-lui de lancer une musique !' 
        });
      }
      throw spotifyError;
    }

  } catch (error) {
    console.error('❌ Erreur serveur AddToQueue:', error);
    res.status(500).json({ error: error.message || 'Impossible d\'ajouter la musique.' });
  }
};

export const updateQueueOrder = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { newQueue } = req.body;

    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ error: 'Session introuvable' });

    // Seul l'hôte a le droit de réorganiser
    if (session.hostId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Seul l\'hôte peut réorganiser la file.' });
    }

    session.approvedQueue = newQueue;
    await session.save();

    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};