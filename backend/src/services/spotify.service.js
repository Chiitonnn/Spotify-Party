import { createSpotifyApi } from '../config/spotify.js';
import User from '../models/User.js';

export class SpotifyService {
  /**
   * Obtenir l'API Spotify pour un utilisateur
   */
  static async getSpotifyApiForUser(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Vérifier si le token a expiré
    if (user.tokenExpiresAt && new Date() > user.tokenExpiresAt) {
      await this.refreshUserToken(user);
    }
    
    return createSpotifyApi(user.spotifyAccessToken);
  }
  
  /**
   * Rafraîchir le token d'un utilisateur
   */
  static async refreshUserToken(user) {
    if (!user.spotifyRefreshToken) {
      throw new Error('No refresh token available');
    }
    
    const spotifyApi = createSpotifyApi();
    spotifyApi.setRefreshToken(user.spotifyRefreshToken);
    
    const data = await spotifyApi.refreshAccessToken();
    
    user.spotifyAccessToken = data.body.access_token;
    user.tokenExpiresAt = new Date(Date.now() + data.body.expires_in * 1000);
    
    if (data.body.refresh_token) {
      user.spotifyRefreshToken = data.body.refresh_token;
    }
    
    await user.save();
    
    return user;
  }
  
  /**
   * Récupérer une track aléatoire depuis les playlists de la session
   */
  static async getRandomTrackFromPlaylists(userId, playlistIds) {
    const spotifyApi = await this.getSpotifyApiForUser(userId);
    
    if (!playlistIds || playlistIds.length === 0) {
      throw new Error('No playlists provided');
    }
    
    // Choisir une playlist au hasard
    const randomPlaylistId = playlistIds[Math.floor(Math.random() * playlistIds.length)];
    
    // Récupérer les tracks
    const data = await spotifyApi.getPlaylistTracks(randomPlaylistId);
    const tracks = data.body.items.filter(item => item.track && item.track.id);
    
    if (tracks.length === 0) {
      throw new Error('No tracks found in playlist');
    }
    
    // Choisir une track au hasard
    const randomTrack = tracks[Math.floor(Math.random() * tracks.length)].track;
    
    return {
      id: randomTrack.id,
      name: randomTrack.name,
      artists: randomTrack.artists.map(a => a.name),
      album: randomTrack.album.name,
      albumImage: randomTrack.album.images[0]?.url,
      duration: randomTrack.duration_ms,
      uri: randomTrack.uri
    };
  }
  
  /**
   * Lancer la lecture d'une track sur le device de l'hôte
   */
  static async playTrack(userId, trackUri, deviceId = null) {
    const spotifyApi = await this.getSpotifyApiForUser(userId);
    
    const playOptions = {
      uris: [trackUri]
    };
    
    if (deviceId) {
      playOptions.device_id = deviceId;
    }
    
    await spotifyApi.play(playOptions);
  }
  
  /**
   * Mettre en pause la lecture
   */
  static async pausePlayback(userId, deviceId = null) {
    const spotifyApi = await this.getSpotifyApiForUser(userId);
    
    if (deviceId) {
      await spotifyApi.pause({ device_id: deviceId });
    } else {
      await spotifyApi.pause();
    }
  }
  
  /**
   * Obtenir l'état de lecture actuel
   */
  static async getPlaybackState(userId) {
    const spotifyApi = await this.getSpotifyApiForUser(userId);
    const data = await spotifyApi.getMyCurrentPlaybackState();
    
    return data.body;
  }
}