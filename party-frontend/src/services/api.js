import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// ===== AUTH =====
export const authService = {
  login: () => {
    window.location.href = `${API_BASE_URL}/auth/login`;
  },
  
  getMe: async (spotifyId) => {
    const response = await api.get(`/auth/me?spotify_id=${spotifyId}`);
    return response.data;
  }
};

// ===== ROOMS =====
export const roomService = {
  createRoom: async (hostSpotifyId, likeThreshold = 3) => {
    const response = await api.post('/rooms/', {
      host_spotify_id: hostSpotifyId,
      like_threshold: likeThreshold
    });
    return response.data;
  },
  
  listRooms: async () => {
    const response = await api.get('/rooms/');
    return response.data;
  },
  
  getRoomByCode: async (code) => {
    const response = await api.get(`/rooms/${code}`);
    return response.data;
  },
  
  joinRoom: async (code, spotifyId) => {
    const response = await api.post(`/rooms/${code}/join`, {
      spotify_id: spotifyId
    });
    return response.data;
  },
  
  getParticipants: async (code) => {
    const response = await api.get(`/rooms/${code}/participants`);
    return response.data;
  },
  
  getRoomState: async (code) => {
    const response = await api.get(`/rooms/${code}/state`);
    return response.data;
  },
  
  getRandomTrack: async (code) => {
    const response = await api.get(`/rooms/${code}/random-track`);
    return response.data;
  },
  
  vote: async (code, spotifyId, isLike) => {
    const response = await api.post(`/rooms/${code}/vote?spotify_id=${spotifyId}&is_like=${isLike}`);
    return response.data;
  },
  
  getNextTrack: async (code) => {
    const response = await api.get(`/rooms/${code}/next-track`);
    return response.data;
  },
  
  nextRound: async (code) => {
    const response = await api.post(`/rooms/${code}/next-round`);
    return response.data;
  },

  // 🎵 NOUVEAU : Fonctions de playback
  playTrack: async (code, deviceId) => {
    const response = await api.post(`/rooms/${code}/play?device_id=${deviceId}`);
    return response.data;
  },

  pauseTrack: async (code, deviceId) => {
    const response = await api.post(`/rooms/${code}/pause?device_id=${deviceId}`);
    return response.data;
  },

  resumeTrack: async (code, deviceId) => {
    const response = await api.post(`/rooms/${code}/resume?device_id=${deviceId}`);
    return response.data;
  }
};

export default api;