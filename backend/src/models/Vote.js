import mongoose from 'mongoose';

const voteSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  trackId: {
    type: String,
    required: true
  },
  voteType: {
    type: String,
    enum: ['like', 'dislike'],
    required: true
  }
}, {
  timestamps: true
});

// Un utilisateur ne peut voter qu'une fois par track
voteSchema.index({ sessionId: 1, userId: 1, trackId: 1 }, { unique: true });

export default mongoose.model('Vote', voteSchema);