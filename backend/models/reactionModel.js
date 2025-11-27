import mongoose from 'mongoose';

const reactionSchema = new mongoose.Schema({
  blogPostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Blog',
    required: true
  },
  userId: {
    type: String, // Using IP or session ID for anonymous users
    required: true
  },
  reaction: {
    type: String,
    enum: ['like', 'love', 'helpful'],
    required: true
  },
  userAgent: String,
  ipAddress: String
}, {
  timestamps: true
});

// Compound index to prevent duplicate reactions from same user
reactionSchema.index({ blogPostId: 1, userId: 1 }, { unique: true });

export default mongoose.model('Reaction', reactionSchema); 