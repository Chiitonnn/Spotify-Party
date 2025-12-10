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