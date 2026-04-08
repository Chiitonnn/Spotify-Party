import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mode: {
    type: String,
    enum: ['classic', 'vote'],
    default: 'classic'
  },
  status: {
    type: String,
    enum: ['preparing', 'active', 'finished'],
    default: 'active'
  },
  currentTrackId: {
    type: String
  },

  name: {
    type: String,
    default: 'Spotify Party'
  },

  playlistIds: [String],

  trackLimit: { 
    type: Number, 
    default: 20 
  },

  trackPool: [{
    id: String,
    name: String,
    uri: String,
    artists: [String],
    albumImage: String,
    preview_url: String
  }],

  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // 🆕 L'historique des musiques jouées (pour "précédent")
  playedHistory: [{
    trackId: String,
    uri: String, 
    name: String,
    artists: [String],
    albumImage: String,
    playedAt: { type: Date, default: Date.now }
  }],

  // 🆕 NOUVEAU : La file d'attente des musiques validées
  approvedQueue: [{
    trackId: String,
    uri: String, // Vital pour la lecture
    name: String,
    artists: [String],
    albumImage: String,
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    addedAt: { type: Date, default: Date.now }
  }],
  votingThreshold: {
    type: Number,
    default: 5
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPartyStarted: {
    type: Boolean,
    default: false
  },
  nextTrackQueued: {
    type: Boolean,
    default: false
  },
  isPlaying: {
    type: Boolean,
    default: true
  }

}, {
  timestamps: true
});

export default mongoose.model('Session', sessionSchema);