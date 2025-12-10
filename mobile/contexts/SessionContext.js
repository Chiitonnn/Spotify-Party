import React, { createContext, useState, useContext, useEffect } from 'react';
import { initWebSocket, disconnectWebSocket, onEvent } from '../services/websocket.service';

const SessionContext = createContext();

export const useSession = () => useContext(SessionContext);

export const SessionProvider = ({ children }) => {
  const [currentSession, setCurrentSession] = useState(null);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [votes, setVotes] = useState({});
  const [participants, setParticipants] = useState([]);

  useEffect(() => {
    if (currentSession) {
      initWebSocket(currentSession._id);
      
      onEvent('vote_update', handleVoteUpdate);
      onEvent('track_approved', handleTrackApproved);
      onEvent('user_joined', handleUserJoined);
      onEvent('user_left', handleUserLeft);
      onEvent('session_closed', handleSessionClosed);
      
      return () => disconnectWebSocket();
    }
  }, [currentSession]);

  const handleVoteUpdate = (data) => {
    setVotes(prev => ({
      ...prev,
      [data.trackId]: {
        likes: data.likes,
        dislikes: data.dislikes,
        total: data.total
      }
    }));
  };

  const handleTrackApproved = (data) => {
    console.log('Track approved:', data.trackId);
    // Lancer la musique
  };

  const handleUserJoined = (data) => {
    setParticipants(prev => [...prev, data.userId]);
  };

  const handleUserLeft = (data) => {
    setParticipants(prev => prev.filter(id => id !== data.userId));
  };

  const handleSessionClosed = () => {
    setCurrentSession(null);
    setCurrentTrack(null);
  };

  return (
    <SessionContext.Provider
      value={{
        currentSession,
        setCurrentSession,
        currentTrack,
        setCurrentTrack,
        votes,
        participants
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};