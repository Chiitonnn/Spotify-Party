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
  currentTrack: {
    trackId: String,
    trackName: String,
    artists: [String],
    albumImage: String,
    uri: String
  },
  trackQueue: [{
    trackId: String,
    trackName: String,
    artists: [String],
    albumImage: String,
    uri: String,
    addedBy: mongoose.Schema.Types.ObjectId
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