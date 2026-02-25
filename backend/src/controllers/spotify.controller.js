import { createSpotifyApi } from '../config/spotify.js';
import User from '../models/User.js';

// 1. Récupérer les playlists (Sécurisé)
export const getUserPlaylists = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const spotifyApi = createSpotifyApi(user.spotifyAccessToken);
    
    const data = await spotifyApi.getUserPlaylists({ limit: 50 });
    
    // 🛡️ FILTRAGE ANTI-CRASH
    // On enlève les playlists nulles et on s'assure que 'tracks' existe
    const cleanPlaylists = data.body.items
      .filter(p => p && p.tracks) 
      .map(p => ({
        id: p.id,
        name: p.name,
        // On gère le cas où il n'y a pas d'image pour éviter le crash
        image: p.images && p.images.length > 0 
          ? p.images[0].url 
          : 'https://via.placeholder.com/150',
        tracksCount: p.tracks.total
      }));

    res.json({ playlists: cleanPlaylists });
  } catch (error) {
    console.error('❌ Erreur getUserPlaylists:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// 2. Récupérer les titres d'une playlist (Sécurisé + Hack Preview)
export const getPlaylistTracks = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const spotifyApi = createSpotifyApi(user.spotifyAccessToken);
    
    const data = await spotifyApi.getPlaylistTracks(req.params.playlistId, { market: 'FR' });
    
    const validTracks = data.body.items.filter(item => item.track && item.track.id);

    res.json({
      tracks: validTracks.map(item => ({
        id: item.track.id,
        name: item.track.name,
        artists: item.track.artists.map(a => a.name),
        album: item.track.album.name,
        albumImage: item.track.album.images?.[0]?.url || 'https://via.placeholder.com/150',
        duration: item.track.duration_ms,
        uri: item.track.uri,
        // On garde le hack pour les previews au cas où
        preview_url: item.track.preview_url 
          ? item.track.preview_url 
          : 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
      }))
    });
  } catch (error) {
    console.error('❌ Erreur getPlaylistTracks:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// 3. Recherche (Sécurisé)
export const searchTracks = async (req, res) => {
  try {
    // On récupère "q" (la recherche) et "offset" (le décalage, par défaut 0)
    const { q, offset = 0 } = req.query; 
    const user = await User.findById(req.userId);
    const spotifyApi = createSpotifyApi(user.spotifyAccessToken);
    
    // On passe l'offset à Spotify (ex: chercher à partir de la 50ème musique)
    const data = await spotifyApi.searchTracks(q, { 
      limit: 50, 
      offset: parseInt(offset), 
      market: 'FR' 
    });
    
    res.json({
      tracks: data.body.tracks.items.map(track => ({
        id: track.id,
        name: track.name,
        artists: track.artists.map(a => a.name),
        album: track.album.name,
        albumImage: track.album.images?.[0]?.url,
        duration: track.duration_ms,
        uri: track.uri,
        preview_url: track.preview_url
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 4. Une track unique
export const getTrack = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const spotifyApi = createSpotifyApi(user.spotifyAccessToken);
    
    const data = await spotifyApi.getTrack(req.params.trackId, { market: 'FR' });
    
    res.json({
      id: data.body.id,
      name: data.body.name,
      artists: data.body.artists.map(a => a.name),
      album: data.body.album.name,
      albumImage: data.body.album.images?.[0]?.url,
      duration: data.body.duration_ms,
      uri: data.body.uri
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 5. 🎮 FONCTION PLAY INTELLIGENTE (Qui avait disparu !)
export const playTrack = async (req, res) => {
  try {
    const { uri } = req.body;
    const user = await User.findById(req.userId);
    const spotifyApi = createSpotifyApi(user.spotifyAccessToken);
    
    // Récupérer les appareils
    const devicesData = await spotifyApi.getMyDevices();
    const devices = devicesData.body.devices;
    
    if (!devices || devices.length === 0) {
      throw new Error('NO_ACTIVE_DEVICE');
    }

    // Priorité : Smartphone > Actif > Premier
    const targetDevice = devices.find(d => d.type === 'Smartphone') 
                      || devices.find(d => d.is_active) 
                      || devices[0];

    if (!targetDevice) throw new Error('NO_ACTIVE_DEVICE');

    console.log(`🎯 Play sur : ${targetDevice.name}`);

    await spotifyApi.play({ 
      uris: [uri], 
      device_id: targetDevice.id 
    });
    
    res.json({ message: `Playback started on ${targetDevice.name}` });

  } catch (error) {
    console.error('❌ Erreur Play:', error.message);
    if (error.statusCode === 404 || error.message.includes('NO_ACTIVE_DEVICE')) {
      return res.status(404).json({ error: 'Aucun appareil Spotify trouvé.' });
    }
    res.status(500).json({ error: error.message });
  }
};