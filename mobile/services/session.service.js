import api from '../config/api';

export const createSession = async (data) => {
  const response = await api.post('/sessions/create', data);
  return response.data;
};

export const joinSession = async (code) => {
  const response = await api.post('/sessions/join', { code });
  return response.data;
};

export const getSession = async (sessionId) => {
  const response = await api.get(`/sessions/${sessionId}`);
  return response.data;
};

export const leaveSession = async (sessionId) => {
  const response = await api.post(`/sessions/${sessionId}/leave`);
  return response.data;
};

export const closeSession = async (sessionId) => {
  const response = await api.post(`/sessions/${sessionId}/close`);
  return response.data;
};

export const updateVotingThreshold = async (sessionId, threshold) => {
  const response = await api.patch(`/sessions/${sessionId}/threshold`, { threshold });
  return response.data;
};

export const startParty = async (sessionId) => {
  const response = await api.post(`/sessions/${sessionId}/start`);
  return response.data;
};

export const addToQueue = async (sessionId, trackData) => {
  try {
    const response = await api.post(`/sessions/${sessionId}/queue`, trackData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updateQueueOrder = async (sessionId, newQueue) => {
  try {
    const response = await api.put(`/sessions/${sessionId}/queue/reorder`, { newQueue });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const submitVote = async (sessionId, voteData) => {
  try {
    const response = await api.post(`/votes/${sessionId}/vote`, voteData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const togglePlayPause = async (sessionId) => {
  const response = await api.post(`/sessions/${sessionId}/playback/toggle`);
  return response.data;
};

export const skipToNext = async (sessionId) => {
  const response = await api.post(`/sessions/${sessionId}/playback/next`);
  return response.data;
};

export const skipToPrevious = async (sessionId) => {
  const response = await api.post(`/sessions/${sessionId}/playback/previous`);
  return response.data;
};