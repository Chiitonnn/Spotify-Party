import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
  Animated
} from 'react-native';
import GestureRecognizer from 'react-native-swipe-gestures';
import { useSession } from '../contexts/SessionContext';
import * as SpotifyService from '../services/spotify.service';
import * as VoteService from '../services/vote.service';

const { width, height } = Dimensions.get('window');

const VoteScreen = ({ navigation, route }) => {
  const { sessionId } = route.params;
  const { currentSession, votes } = useSession();
  const [currentTrack, setCurrentTrack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [swipeDirection, setSwipeDirection] = useState(null);
  const cardAnimation = new Animated.Value(0);

  useEffect(() => {
    loadRandomTrack();
  }, []);

  const loadRandomTrack = async () => {
    try {
      setLoading(true);
      // Récupérer une track aléatoire depuis les playlists
      const playlistId = currentSession.playlistIds[
        Math.floor(Math.random() * currentSession.playlistIds.length)
      ];
      
      const tracks = await SpotifyService.getPlaylistTracks(playlistId);
      const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
      
      setCurrentTrack(randomTrack);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger une track');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (voteType) => {
    if (!currentTrack) return;

    try {
      // Animation du swipe
      Animated.timing(cardAnimation, {
        toValue: voteType === 'like' ? 1 : -1,
        duration: 300,
        useNativeDriver: true
      }).start();

      // Soumettre le vote
      await VoteService.submitVote(sessionId, currentTrack.id, voteType);

      // Attendre la fin de l'animation
      setTimeout(() => {
        cardAnimation.setValue(0);
        setSwipeDirection(null);
        loadRandomTrack();
      }, 300);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de voter');
      cardAnimation.setValue(0);
    }
  };

  const onSwipeLeft = () => {
    setSwipeDirection('left');
    handleVote('dislike');
  };

  const onSwipeRight = () => {
    setSwipeDirection('right');
    handleVote('like');
  };

  if (loading || !currentTrack) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  const trackVotes = votes[currentTrack.id] || { likes: 0, dislikes: 0 };
  const cardRotate = cardAnimation.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-30deg', '0deg', '30deg']
  });

  const cardTranslateX = cardAnimation.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [-width, 0, width]
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Retour</Text>
        </TouchableOpacity>
        <View style={styles.votesInfo}>
          <Text style={styles.votesText}>
            {trackVotes.likes}/{currentSession.votingThreshold} 👍
          </Text>
        </View>
      </View>

      {/* Card avec swipe */}
      <GestureRecognizer
        onSwipeLeft={onSwipeLeft}
        onSwipeRight={onSwipeRight}
        style={styles.gestureContainer}
      >
        <Animated.View
          style={[
            styles.card,
            {
              transform: [
                { rotate: cardRotate },
                { translateX: cardTranslateX }
              ]
            }
          ]}
        >
          <Image
            source={{ uri: currentTrack.albumImage }}
            style={styles.albumImage}
          />
          
          <View style={styles.trackInfo}>
            <Text style={styles.trackName} numberOfLines={2}>
              {currentTrack.name}
            </Text>
            <Text style={styles.artistName} numberOfLines={1}>
              {currentTrack.artists.join(', ')}
            </Text>
          </View>

          {/* Overlay pour swipe gauche/droite */}
          {swipeDirection === 'left' && (
            <View style={[styles.overlay, styles.dislikeOverlay]}>
              <Text style={styles.overlayText}>👎</Text>
            </View>
          )}
          {swipeDirection === 'right' && (
            <View style={[styles.overlay, styles.likeOverlay]}>
              <Text style={styles.overlayText}>👍</Text>
            </View>
          )}
        </Animated.View>
      </GestureRecognizer>

      {/* Boutons de vote */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.voteButton, styles.dislikeButton]}
          onPress={() => handleVote('dislike')}
        >
          <Text style={styles.voteButtonText}>👎</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.voteButton, styles.likeButton]}
          onPress={() => handleVote('like')}
        >
          <Text style={styles.voteButtonText}>👍</Text>
        </TouchableOpacity>
      </View>

      {/* Instructions */}
      <Text style={styles.instructions}>
        Swipe ou appuie sur les boutons pour voter
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    color: '#1DB954',
    fontSize: 18
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 40
  },
  backButton: {
    color: '#1DB954',
    fontSize: 16,
    fontWeight: 'bold'
  },
  votesInfo: {
    backgroundColor: '#282828',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20
  },
  votesText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold'
  },
  gestureContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  card: {
    width: width - 60,
    height: height * 0.6,
    backgroundColor: '#282828',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10
  },
  albumImage: {
    width: '100%',
    height: '70%',
    resizeMode: 'cover'
  },
  trackInfo: {
    padding: 20,
    justifyContent: 'center',
    flex: 1
  },
  trackName: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10
  },
  artistName: {
    color: '#B3B3B3',
    fontSize: 16
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)'
  },
  likeOverlay: {
    borderWidth: 5,
    borderColor: '#1DB954'
  },
  dislikeOverlay: {
    borderWidth: 5,
    borderColor: '#FF4444'
  },
  overlayText: {
    fontSize: 100
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
    marginTop: 30
  },
  voteButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5
  },
  dislikeButton: {
    backgroundColor: '#FF4444'
  },
  likeButton: {
    backgroundColor: '#1DB954'
  },
  voteButtonText: {
    fontSize: 40
  },
  instructions: {
    color: '#B3B3B3',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14
  }
});

export default VoteScreen;