import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  excerpt: {
    type: String,
    required: true,
    maxlength: 200
  },
  image: {
    type: String,
    required: true
  },
  imagePublicId: {
    type: String,
    default: null
  },
  category: {
    type: String,
    required: true,
    enum: ['Health', 'Nutrition', 'Recipes', 'Lifestyle', 'Fitness', 'Wellness', 'News']
  },
  author: {
    type: String,
    default: 'Admin'
  },
  tags: [{
    type: String,
    trim: true
  }],
  isPublished: {
    type: Boolean,
    default: true
  },
  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Create index for better search performance
blogSchema.index({ title: 'text', content: 'text', excerpt: 'text' });

export default mongoose.model('Blog', blogSchema); 