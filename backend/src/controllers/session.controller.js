import Session from '../models/Session.js';
import User from '../models/User.js';
import shortid from 'shortid';
import { getIO } from '../services/websocket.service.js';
import { createSpotifyApi } from '../config/spotify.js';
import { startPlaybackPolling } from '../services/playback.service.js';

export const createSession = async (req, res) => {
  try {
    // On récupère mode et trackLimit du front
    const { name, playlistIds, votingThreshold, trackLimit, mode } = req.body;
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
    for (let i = allTracks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allTracks[i], allTracks[j]] = [allTracks[j], allTracks[i]];
    }

    // 3. LIMITER (SLICE) ✂️
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
      trackPool: finalPool,
      mode: mode || 'classic',
      status: mode === 'vote' ? 'preparing' : 'active',
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

    const devicesData = await spotifyApi.getMyDevices();
    const devices = devicesData.body.devices;
    
    const targetDevice = devices.find(d => d.type === 'Smartphone') 
                      || devices.find(d => d.is_active) 
                      || devices[0];

    if (!targetDevice) {
      return res.status(404).json({ error: 'Ouvrez Spotify sur votre téléphone et lancez une musique.' });
    }

    // --- MAGIE DU SHUFFLE COLLABORATIF ---
    // On mélange le tableau de pistes avec Fisher-Yates
    for (let i = session.approvedQueue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [session.approvedQueue[i], session.approvedQueue[j]] = [session.approvedQueue[j], session.approvedQueue[i]];
    }
    // On sauvegarde ce nouvel ordre en base
    // -------------------------------------

    const uris = session.approvedQueue.map(track => track.uri);
    console.log(`🚀 Lancement soirée aléatoire sur ${targetDevice.name}...`);

    try {
      if (!targetDevice.is_active) {
        console.log("💤 Appareil inactif, tentative de transfert...");
        await spotifyApi.transferMyPlayback([targetDevice.id]);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // CHANGER ICI : On ne lance QUE la première musique ! Le reste sera géré par le cerveau (polling)
      await spotifyApi.play({ 
        uris: [uris[0]], 
        device_id: targetDevice.id 
      });

      session.isPartyStarted = true;
      session.currentTrackId = uris[0];
      session.nextTrackQueued = false;
      await session.save();

      // Démarrage du cerveau de surveillance
      startPlaybackPolling(session._id.toString(), session.hostId.toString());

      const io = getIO();
      // On prévient tout le monde de l'état ET du nouvel ordre de la file
      io.to(session._id.toString()).emit('queue_updated', session.approvedQueue);
      io.to(session._id.toString()).emit('party_started');

      res.json({ message: 'Party started!', count: uris.length });

    } catch (playError) {
      console.error('❌ Erreur de lecture Spotify:', playError.message);
      
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
    const { trackUri, trackName, artistName, albumImage } = req.body;

    const session = await Session.findById(sessionId).populate('hostId');
    if (!session) return res.status(404).json({ error: 'Session introuvable' });

    console.log(`📡 Ajout à la file : ${trackName} par l'utilisateur ${req.userId}`);

    // --- LIMITE 10 MUSIQUES PAR PERSONNE ---
    const userTrackCount = session.approvedQueue.filter(
      track => track.addedBy && track.addedBy.toString() === req.userId
    ).length;

    if (userTrackCount >= 10) {
      return res.status(403).json({ error: 'Vous avez atteint votre limite de 10 musiques !' });
    }
    // ---------------------------------------

    session.approvedQueue.push({
      uri: trackUri,
      name: trackName,
      artist: artistName,
      albumImage: albumImage || null,
      addedBy: req.userId
    });

    await session.save();

    // On prévient tous les clients de la mise à jour de la file
    const io = getIO();
    io.to(session._id.toString()).emit('queue_updated', session.approvedQueue);

    res.json({ message: 'Titre ajouté avec succès à la file d\'attente !' });

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

    if (session.hostId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Seul l\'hôte peut réorganiser la file.' });
    }

    session.approvedQueue = newQueue;
    await session.save();

    const io = getIO();
    io.to(session._id.toString()).emit('queue_updated', session.approvedQueue);

    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ==========================================
// CONTRÔLES DE LECTURE (Play/Pause, Skip, Prev)
// ==========================================
export const togglePlayPause = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await Session.findById(sessionId).populate('hostId');
    if (!session || !session.isPartyStarted) return res.status(404).json({ error: 'Session non lancée' });

    const spotifyApi = createSpotifyApi(session.hostId.spotifyAccessToken);
    const playbackState = await spotifyApi.getMyCurrentPlaybackState();

    if (playbackState?.body?.is_playing) {
      await spotifyApi.pause();
      session.isPlaying = false;
    } else {
      await spotifyApi.play();
      session.isPlaying = true;
    }
    await session.save();

    const io = getIO();
    io.to(session._id.toString()).emit('playback_state_changed', session.isPlaying);

    res.json({ message: 'Lecture togglée', isPlaying: session.isPlaying });
  } catch (error) {
    console.error('❌ Erreur togglePlayPause:', error);
    res.status(500).json({ error: error.message });
  }
};

export const skipToNext = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await Session.findById(sessionId).populate('hostId');
    if (!session || !session.isPartyStarted) return res.status(404).json({ error: 'Session non lancée' });

    if (session.approvedQueue.length <= 1) {
      return res.status(400).json({ error: 'Plus aucune musique dans la file !' });
    }

    const spotifyApi = createSpotifyApi(session.hostId.spotifyAccessToken);
    
    // On force la lecture du morceau suivant
    const nextTrack = session.approvedQueue[1];
    await spotifyApi.play({ uris: [nextTrack.uri] });

    // Cerveau s'occupera d'archiver la musique 0!
    
    res.json({ message: 'Passage à la musique suivante !' });
  } catch (error) {
    console.error('❌ Erreur skipToNext:', error);
    res.status(500).json({ error: error.message });
  }
};

export const skipToPrevious = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await Session.findById(sessionId).populate('hostId');
    if (!session || !session.isPartyStarted) return res.status(404).json({ error: 'Session non lancée' });

    if (!session.playedHistory || session.playedHistory.length === 0) {
       // Rien dans l'historique : on restart
       const spotifyApi = createSpotifyApi(session.hostId.spotifyAccessToken);
       await spotifyApi.seek(0);
       return res.json({ message: 'Retour au début' });
    }

    const spotifyApi = createSpotifyApi(session.hostId.spotifyAccessToken);

    // On dépile la dernière musique de l'historique
    const previousTrack = session.playedHistory.pop();
    
    // On la remet haut de la file
    session.approvedQueue.unshift(previousTrack);
    session.currentTrackId = previousTrack.uri;
    await session.save();

    // On force la lecture
    await spotifyApi.play({ uris: [previousTrack.uri] });

    const io = getIO();
    io.to(session._id.toString()).emit('queue_updated', session.approvedQueue);

    res.json({ message: 'Retour à la musique précédente !' });
  } catch (error) {
    console.error('❌ Erreur skipToPrevious:', error);
    res.status(500).json({ error: error.message });
  }
};