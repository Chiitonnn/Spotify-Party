import api from '../config/api';

export const getUserPlaylists = async () => {
  const response = await api.get('/spotify/playlists');
  return response.data.playlists;
};

export const getPlaylistTracks = async (playlistId) => {
  const response = await api.get(`/spotify/playlists/${playlistId}/tracks`);
  return response.data.tracks;
};

export const searchTracks = async (query) => {
  const response = await api.get('/spotify/search', { params: { q: query } });
  return response.data.tracks;
};

export const getTrack = async (trackId) => {
  const response = await api.get(`/spotify/tracks/${trackId}`);
  return response.data;
};
