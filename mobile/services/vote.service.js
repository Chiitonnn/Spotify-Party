import api from '../config/api';

export const submitVote = async (sessionId, trackId, voteType) => {
  const response = await api.post(`/votes/${sessionId}/vote`, {
    trackId,
    voteType
  });
  return response.data;
};

export const getTrackResults = async (sessionId, trackId) => {
  const response = await api.get(`/votes/${sessionId}/track/${trackId}/results`);
  return response.data;
};

export const getSessionResults = async (sessionId) => {
  const response = await api.get(`/votes/${sessionId}/results`);
  return response.data;
};