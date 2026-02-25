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

  // 🆕 NOUVEAU : La file d'attente des musiques validées
  approvedQueue: [{
    trackId: String,
    uri: String, // Vital pour la lecture
    name: String,
    artist: String,
    albumImage: String,
    addedAt: { type: Date, default: Date.now }
  }],
  votingThreshold: {
    type: Number,
    default: 5
  },
  isActive: {
    type: Boolean,
    default: true
  }

  
}, {
  timestamps: true
});

export default mongoose.model('Session', sessionSchema);