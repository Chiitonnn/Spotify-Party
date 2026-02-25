import api from '../config/api';

export const getUserPlaylists = async () => {
  const response = await api.get('/spotify/playlists');
  return response.data.playlists;
};

export const getPlaylistTracks = async (playlistId) => {
  const response = await api.get(`/spotify/playlists/${playlistId}/tracks`);
  return response.data.tracks;
};

export const getTrack = async (trackId) => {
  const response = await api.get(`/spotify/tracks/${trackId}`);
  return response.data;
};

// 👇 AJOUT ICI
export const playTrack = async (uri) => {
  const response = await api.put('/spotify/play', { uri });
  return response.data;
};

export const searchTracks = async (query, offset = 0, sessionId) => {
  try {
    // On passe impérativement le sessionId pour autoriser la recherche aux invités
    const url = `/spotify/search?q=${encodeURIComponent(query)}&offset=${offset}&sessionId=${sessionId}`;
    const response = await api.get(url);
    return response.data.tracks;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};