import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 0.25 * SCREEN_WIDTH;

const CurrentTrackCard = ({ track, onSwipe, skipData }) => {
  const position = new Animated.ValueXY();
  
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (event, gesture) => {
        position.setValue({ x: gesture.dx, y: 0 });
      },
      onPanResponderRelease: (event, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          forceSwipe('right');
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          forceSwipe('left');
        } else {
          resetPosition();
        }
      }
    })
  ).current;

  const forceSwipe = (direction) => {
    const x = direction === 'right' ? SCREEN_WIDTH : -SCREEN_WIDTH;
    Animated.timing(position, {
      toValue: { x, y: 0 },
      duration: 250,
      useNativeDriver: false
    }).start(() => {
      onSwipe();
      resetPosition();
    });
  };

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: false
    }).start();
  };

  const getCardStyle = () => {
    const rotate = position.x.interpolate({
      inputRange: [-SCREEN_WIDTH * 1.5, 0, SCREEN_WIDTH * 1.5],
      outputRange: ['-30deg', '0deg', '30deg']
    });

    return {
      ...position.getLayout(),
      transform: [{ rotate }]
    };
  };

  if (!track) return null;

  return (
    <Animated.View
      style={[styles.card, getCardStyle()]}
      {...panResponder.panHandlers}
    >
      <View style={styles.header}>
        <Text style={styles.label}>EN LECTURE</Text>
        <View style={styles.liveIndicator}>
          <View style={styles.dot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Image 
          source={{ uri: track.albumImage || 'https://via.placeholder.com/150' }} 
          style={styles.albumArt} 
        />
        <View style={styles.info}>
          <Text style={styles.trackName} numberOfLines={1}>{track.name}</Text>
          <Text style={styles.artistName} numberOfLines={1}>{track.artists?.join(', ') || track.artist}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.voteInfo}>
          <Ionicons name="play-skip-forward" size={16} color="#1DB954" />
          <Text style={styles.voteText}>
            {skipData?.currentVotes || 0} / {skipData?.threshold || 0} votes pour passer
          </Text>
        </View>
        <Text style={styles.swipeHint}>Glissez pour voter SKIP ➜</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#181818',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1DB954',
    shadowColor: '#1DB954',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    marginBottom: 20
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15
  },
  label: {
    color: '#1DB954',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(29, 185, 84, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1DB954'
  },
  liveText: {
    color: '#1DB954',
    fontSize: 10,
    fontWeight: 'bold'
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15
  },
  albumArt: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#282828'
  },
  info: {
    flex: 1
  },
  trackName: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4
  },
  artistName: {
    color: '#B3B3B3',
    fontSize: 14
  },
  footer: {
    marginTop: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#282828',
    paddingTop: 15
  },
  voteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  voteText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600'
  },
  swipeHint: {
    color: '#666',
    fontSize: 10,
    fontStyle: 'italic'
  }
});

export default CurrentTrackCard;
