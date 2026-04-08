import Session from '../models/Session.js';
import User from '../models/User.js';
import { createSpotifyApi } from '../config/spotify.js';
import { getIO } from './websocket.service.js';

const activePolls = new Map();

/**
 * Commence le polling secret (cerveau) pour la session.
 */
export const startPlaybackPolling = (sessionId, hostId) => {
  if (activePolls.has(sessionId)) {
    return; // Déjà en cours
  }

  console.log(`📡 [Playback Cerveau] Démarrage de la surveillance pour la session ${sessionId}`);

  const intervalId = setInterval(async () => {
    try {
      const session = await Session.findById(sessionId);
      
      // Si la session n'existe plus ou est fermée
      if (!session || !session.isActive) {
        stopPlaybackPolling(sessionId);
        return;
      }

      // S'il n'y a plus de musiques du tout en DB
      if (!session.approvedQueue || session.approvedQueue.length === 0) {
        return;
      }

      const host = await User.findById(hostId);
      if (!host?.spotifyAccessToken) return;

      const spotifyApi = createSpotifyApi(host.spotifyAccessToken);
      let playbackState;
      try {
        const stateData = await spotifyApi.getMyCurrentPlaybackState();
        playbackState = stateData.body;
      } catch (err) {
        // En cas d'erreur réseau / token expiré (qui sera refresh ailleurs) / device éteint
        return;
      }

      // Aucun lecteur actif ou en pause
      if (!playbackState || !playbackState.item || !playbackState.is_playing) {
        return;
      }

      const progress = playbackState.progress_ms;
      const duration = playbackState.item.duration_ms;
      const currentUriPlaying = playbackState.item.uri;

      // ==========================================
      // 1. DÉTECTION DU CHANGEMENT DE MUSIQUE 
      // ==========================================
      if (session.currentTrackId && session.currentTrackId !== currentUriPlaying) {
        console.log(`🔄 [Playback Cerveau] Changement de piste détecté !  -->  ${currentUriPlaying}`);
        
        // Est-ce qu'on est passé à la musique N°2 de la file ?
        // (L'app Spotify joue la suivante, donc on vire la N°1 de notre base)
        if (session.approvedQueue[0]?.uri === session.currentTrackId) {
            console.log(`🗑️ [Playback Cerveau] Dépilage de l'ancienne musique: ${session.approvedQueue[0].name}`);
            session.approvedQueue.shift(); // On enlève la première de la file DB !
            
            // On diffuse la nouvelle file (amputée du titre passé) à tous les téléphones
            const io = getIO();
            io.to(sessionId.toString()).emit('queue_updated', session.approvedQueue);
        }

        // On reset nos flags et met à jour "L'URI en cours"
        session.currentTrackId = currentUriPlaying;
        session.nextTrackQueued = false;
        await session.save();
      }

      // Cas où currentTrackId n'était pas initialisé (tout premier lancement)
      if (!session.currentTrackId) {
        session.currentTrackId = currentUriPlaying;
        session.nextTrackQueued = false;
        await session.save();
      }

      // ==========================================
      // 2. ANTICIPATION POUR LE TITRE SUIVANT
      // ==========================================
      // S'il reste moins de 10 secondes (10 000 ms) et qu'on n'a pas encore injecté le son suivant
      if (duration - progress <= 10000 && !session.nextTrackQueued) {
         
         // S'il reste des musiques après celle qui tourne actuellement
         // L'index 0 est censée être la musique en cours. L'index 1 est la suivante.
         if (session.approvedQueue.length > 1) {
            const nextTrack = session.approvedQueue[1];
            
            console.log(`⚡ [Playback Cerveau] Fin imminente du track... Ajout silencieux de "${nextTrack.name}" à Spotify !`);
            
            try {
              await spotifyApi.addToQueue(nextTrack.uri);
              // On marque comme "Déjà injectée" pour ne pas spammer addToQueue toutes les 5 secondes !
              session.nextTrackQueued = true;
              await session.save();
            } catch (err) {
              console.error(`⚠️ [Playback Cerveau] Échec de l'ajout addToQueue :`, err.message);
            }
         }
      }

    } catch (err) {
       console.error(`[Playback Error] Erreur générale: ${err.message}`);
    }

  }, 5000); // Exécution toutes les 5 secondes.

  activePolls.set(sessionId, intervalId);
};

export const stopPlaybackPolling = (sessionId) => {
  if (activePolls.has(sessionId)) {
    clearInterval(activePolls.get(sessionId));
    activePolls.delete(sessionId);
    console.log(`🛑 [Playback Cerveau] Arrêt de la surveillance pour la session ${sessionId}`);
  }
};
