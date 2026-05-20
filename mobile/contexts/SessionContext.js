import React, { createContext, useState, useContext, useEffect } from 'react';
import { initWebSocket, disconnectWebSocket, onEvent } from '../services/websocket.service';

const SessionContext = createContext();

export const useSession = () => useContext(SessionContext);

export const SessionProvider = ({ children }) => {
  const [currentSession, setCurrentSessionRaw] = useState(null);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [votes, setVotes] = useState({});
  const [participants, setParticipants] = useState([]);
  const [skipData, setSkipData] = useState({ currentVotes: 0, threshold: 0 });
  const [prepProgress, setPrepProgress] = useState({ count: 0, needed: 0 });

  const setCurrentSession = (session) => {
    setCurrentSessionRaw(session);
    if (session?.trackLimit) {
      setPrepProgress(prev => ({
        needed: session.trackLimit,
        count: session.approvedQueue?.length ?? prev.count,
      }));
    }
  };

  // ✅ FONCTION DE NETTOYAGE - NOUVEAU
  const cleanupSession = () => {
    console.log('🧹 Nettoyage complet de la session');
    disconnectWebSocket();
    setCurrentSession(null);
    setCurrentTrack(null);
    setParticipants([]);
    setSkipData({ currentVotes: 0, threshold: 0 });
  };

  // ✅ MODIFICATION PRINCIPALE : plus de disconnect automatique
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
        onEvent('host_disconnected', handleHostDisconnected);
      };

      connectSocket();
      
      // ❌ SUPPRIMÉ : return () => disconnectWebSocket();
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
    setCurrentSessionRaw(prev => prev ? { ...prev, approvedQueue: newQueue } : null);
    setPrepProgress(prev => ({ ...prev, count: newQueue.length }));
  };

  const handleTrackApproved = (data) => {
    console.log('Track approved:', data.trackId);
    // Lancer la musique
  };

  const handleUserJoined = (data) => {
    setParticipants(prev => [...prev, data.userId]);
    setCurrentSession(prev => prev ? { 
      ...prev, 
      participants: [...(prev.participants || []), { userId: data.userId }] 
    } : null);
  };

  const handleUserLeft = (data) => {
    setParticipants(prev => prev.filter(id => id !== data.userId));
    setCurrentSession(prev => prev ? { 
      ...prev, 
      participants: (prev.participants || []).filter(p => p.userId !== data.userId && p.userId?._id !== data.userId) 
    } : null);
  };

  // ✅ MODIFIÉ : utilise cleanupSession
  const handleSessionClosed = (data) => {
    console.log('🔴 Session fermée par le host:', data?.reason || 'inconnu');
    cleanupSession();
  };

  const handleSkipUpdate = (data) => {
    setSkipData({ currentVotes: data.currentVotes, threshold: data.threshold });
  };

  const handleTrackSkipped = (data) => {
    console.log('Track skipped:', data.message);
    setSkipData({ currentVotes: 0, threshold: 0 });
  };

  const handleSessionReady = (data) => {
    setCurrentSession(prev => prev ? { ...prev, status: 'active' } : null);
  };

  const handlePrepProgress = (data) => {
    setPrepProgress({ count: data.count, needed: data.needed });
  };

  // ✅ MODIFIÉ : utilise cleanupSession
  const handleHostDisconnected = (data) => {
    console.log('🔴 Hôte déconnecté:', data?.message || 'L\'hôte a quitté');
    cleanupSession();
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