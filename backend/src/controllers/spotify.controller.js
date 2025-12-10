import { createSpotifyApi } from '../config/spotify.js';
import User from '../models/User.js';

export const getUserPlaylists = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const spotifyApi = createSpotifyApi(user.spotifyAccessToken);
    
    const data = await spotifyApi.getUserPlaylists({ limit: 50 });
    
    res.json({
      playlists: data.body.items.map(p => ({
        id: p.id,
        name: p.name,
        images: p.images,
        tracksCount: p.tracks.total
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPlaylistTracks = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const spotifyApi = createSpotifyApi(user.spotifyAccessToken);
    
    const data = await spotifyApi.getPlaylistTracks(req.params.playlistId);
    
    res.json({
      tracks: data.body.items.map(item => ({
        id: item.track.id,
        name: item.track.name,
        artists: item.track.artists.map(a => a.name),
        album: item.track.album.name,
        albumImage: item.track.album.images[0]?.url,
        duration: item.track.duration_ms,
        uri: item.track.uri
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const searchTracks = async (req, res) => {
  try {
    const { q } = req.query;
    const user = await User.findById(req.userId);
    const spotifyApi = createSpotifyApi(user.spotifyAccessToken);
    
    const data = await spotifyApi.searchTracks(q, { limit: 20 });
    
    res.json({
      tracks: data.body.tracks.items.map(track => ({
        id: track.id,
        name: track.name,
        artists: track.artists.map(a => a.name),
        album: track.album.name,
        albumImage: track.album.images[0]?.url,
        duration: track.duration_ms,
        uri: track.uri
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTrack = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const spotifyApi = createSpotifyApi(user.spotifyAccessToken);
    
    const data = await spotifyApi.getTrack(req.params.trackId);
    
    res.json({
      id: data.body.id,
      name: data.body.name,
      artists: data.body.artists.map(a => a.name),
      album: data.body.album.name,
      albumImage: data.body.album.images[0]?.url,
      duration: data.body.duration_ms,
      uri: data.body.uri
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};