import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['organic', 'food', 'plantation', 'sustainability', 'cooking']
  },
  level: {
    type: String,
    required: true,
    enum: ['beginner', 'intermediate', 'advanced']
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  isFree: {
    type: Boolean,
    default: false
  },
  duration: {
    type: Number,
    required: true,
    min: 1
  },
  image: {
    type: String,
    required: true
  },
  imagePublicId: {
    type: String
  },
  instructor: {
    name: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    avatar: {
      type: String,
      default: 'default-avatar.jpg'
    },
    avatarPublicId: {
      type: String
    },
    bio: {
      type: String,
      required: true
    }
  },
  content: {
    sections: [{
      title: {
        type: String,
        required: true
      },
      description: String,
      duration: Number, // in minutes
      topics: [{
        title: {
          type: String,
          required: true
        },
        description: String,
        content: {
          text: String, // Rich text content
          pdfFile: {
            url: String,
            publicId: String,
            filename: String,
            originalName: String,
            format: String,
            bytes: Number,
            uploadDate: Date
          },
          youtubeVideo: {
            title: String,
            url: String,
            videoId: String, // Extracted from YouTube URL
            duration: String,
            thumbnail: String
          }
        },
        order: {
          type: Number,
          default: 0
        }
      }],
      materials: [{
        title: String,
        type: {
          type: String,
          enum: ['pdf', 'video', 'link', 'document']
        },
        url: String,
        description: String
      }],
      videos: [{
        title: String,
        url: String,
        duration: Number,
        description: String,
        thumbnail: String
      }],
      onlineClass: {
        title: String,
        date: Date,
        time: String,
        duration: Number,
        meetingLink: String,
        meetingId: String,
        password: String,
        description: String
      },
      assignments: [{
        title: String,
        description: String,
        dueDate: Date,
        points: Number
      }],
      quizzes: [{
        title: String,
        questions: [{
          question: String,
          options: [String],
          correctAnswer: Number
        }],
        timeLimit: Number,
        passingScore: Number
      }]
    }],
    timeline: [{
      week: Number,
      title: String,
      description: String,
      topics: [String],
      deliverables: [String]
    }],
    certificate: {
      template: String,
      requirements: [String],
      validFor: Number // in months
    }
  },
  tags: [String],
  requirements: [String],
  learningOutcomes: [String],
  enrolledStudents: {
    type: Number,
    default: 0
  },
  maxStudents: {
    type: Number,
    default: 50
  },
  isActive: {
    type: Boolean,
    default: true
  },
  startDate: Date,
  endDate: Date,
  enrollmentDeadline: Date,
  certificateTemplate: {
    type: String,
    default: 'default'
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Calculate discounted price
courseSchema.virtual('discountedPrice').get(function() {
  if (this.isFree) return 0;
  return this.price - (this.price * this.discount / 100);
});

// Check if course is full
courseSchema.virtual('isFull').get(function() {
  return this.enrolledStudents >= this.maxStudents;
});

// Check if enrollment is open
courseSchema.virtual('enrollmentOpen').get(function() {
  if (!this.isActive) return false;
  if (this.isFull) return false;
  if (this.enrollmentDeadline && new Date() > this.enrollmentDeadline) return false;
  return true;
});

// Ensure virtual fields are serialized
courseSchema.set('toJSON', { virtuals: true });
courseSchema.set('toObject', { virtuals: true });

const Course = mongoose.model('Course', courseSchema);

export default Course; 