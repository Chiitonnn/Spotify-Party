import React, { createContext, useState, useContext, useEffect } from 'react';
import { initWebSocket, disconnectWebSocket, onEvent } from '../services/websocket.service';

const SessionContext = createContext();

export const useSession = () => useContext(SessionContext);

export const SessionProvider = ({ children }) => {
  const [currentSession, setCurrentSession] = useState(null);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [votes, setVotes] = useState({});
  const [participants, setParticipants] = useState([]);
  const [skipData, setSkipData] = useState({ currentVotes: 0, threshold: 0 });
  const [prepProgress, setPrepProgress] = useState({ count: 0, needed: 10 });

  useEffect(() => {
    if (currentSession) {
      const connectSocket = async () => {
        await initWebSocket(currentSession._id);
        
        onEvent('vote_update', handleVoteUpdate);
        onEvent('queue_updated', handleQueueUpdated);
        onEvent('track_approved', handleTrackApproved);
        onEvent('user_joined', handleUserJoined);
        onEvent('user_left', handleUserLeft);
        onEvent('session_closed', handleSessionClosed);
        onEvent('skip_update', handleSkipUpdate);
        onEvent('track_skipped', handleTrackSkipped);
        onEvent('session_ready', handleSessionReady);
        onEvent('preparation_progress', handlePrepProgress);
        onEvent('party_started', handlePartyStarted);
        onEvent('playback_state_changed', handlePlaybackStateChanged);
      };

      connectSocket();
      
      return () => disconnectWebSocket();
    }
  }, [currentSession]);

  const handlePlaybackStateChanged = (isPlaying) => {
    setCurrentSession(prev => prev ? { ...prev, isPlaying } : null);
  };

  const handlePartyStarted = () => {
    setCurrentSession(prev => prev ? { ...prev, isPartyStarted: true } : null);
  };

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

  const handleQueueUpdated = (newQueue) => {
    setCurrentSession(prev => prev ? { ...prev, approvedQueue: newQueue } : null);
  };

  const handleTrackApproved = (data) => {
    console.log('Track approved:', data.trackId);
    // Lancer la musique
  };

  const handleUserJoined = (data) => {
    setParticipants(prev => [...prev, data.userId]);
    // ⚡ Mise à jour directe du contexte UI pour rafraîchir l'écran
    setCurrentSession(prev => prev ? { 
      ...prev, 
      participants: [...(prev.participants || []), { userId: data.userId }] 
    } : null);
  };

  const handleUserLeft = (data) => {
    setParticipants(prev => prev.filter(id => id !== data.userId));
    // ⚡ Rafraîchissement direct de la baisse du nombre de personnes
    setCurrentSession(prev => prev ? { 
      ...prev, 
      participants: (prev.participants || []).filter(p => p.userId !== data.userId && p.userId?._id !== data.userId) 
    } : null);
  };

  const handleSessionClosed = () => {
    setCurrentSession(null);
    setCurrentTrack(null);
  };

  const handleSkipUpdate = (data) => {
    setSkipData({ currentVotes: data.currentVotes, threshold: data.threshold });
  };

  const handleTrackSkipped = (data) => {
    console.log('Track skipped:', data.message);
    setSkipData({ currentVotes: 0, threshold: 0 });
    // Le refresh se fera via queue_updated ou polling si nécessaire
  };

  const handleSessionReady = (data) => {
    setCurrentSession(prev => prev ? { ...prev, status: 'active' } : null);
  };

  const handlePrepProgress = (data) => {
    setPrepProgress({ count: data.count, needed: data.needed });
  };

  return (
    <SessionContext.Provider
      value={{
        currentSession,
        setCurrentSession,
        currentTrack,
        setCurrentTrack,
        votes,
        participants,
        skipData,
        prepProgress
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};