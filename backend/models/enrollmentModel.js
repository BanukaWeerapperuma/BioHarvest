import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['enrolled', 'in-progress', 'completed', 'dropped'],
    default: 'enrolled'
  },
  progress: {
    completedSections: [{
      sectionId: mongoose.Schema.Types.ObjectId,
      completedAt: Date,
      score: Number
    }],
    completedVideos: [{
      videoId: String,
      watchedAt: Date,
      watchTime: Number // in seconds
    }],
    completedAssignments: [{
      assignmentId: mongoose.Schema.Types.ObjectId,
      submittedAt: Date,
      score: Number,
      feedback: String
    }],
    completedQuizzes: [{
      quizId: mongoose.Schema.Types.ObjectId,
      completedAt: Date,
      score: Number,
      totalQuestions: Number,
      correctAnswers: Number
    }],
    attendedClasses: [{
      classId: String,
      attendedAt: Date,
      duration: Number
    }]
  },
  certificate: {
    issued: {
      type: Boolean,
      default: false
    },
    issuedAt: Date,
    certificateId: String,
    downloadUrl: String
  },
  payment: {
    amount: Number,
    currency: {
      type: String,
      default: 'USD'
    },
    paymentMethod: String,
    transactionId: String,
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    }
  },
  notes: String,
  lastAccessed: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Calculate overall progress percentage
enrollmentSchema.virtual('progressPercentage').get(function() {
  if (!this.course || !this.course.content || !this.course.content.sections) {
    return 0;
  }
  
  const totalSections = this.course.content.sections.length;
  if (totalSections === 0) return 0;
  
  const completedSections = this.progress.completedSections.length;
  return Math.round((completedSections / totalSections) * 100);
});

// Check if student can receive certificate
enrollmentSchema.virtual('canReceiveCertificate').get(function() {
  if (!this.course || !this.course.content || !this.course.content.certificate) {
    return false;
  }
  
  const requirements = this.course.content.certificate.requirements;
  if (!requirements || requirements.length === 0) {
    return this.progressPercentage >= 80; // Default 80% completion
  }
  
  // Check specific requirements
  for (const requirement of requirements) {
    if (requirement === 'complete-all-sections' && this.progress.completedSections.length < this.course.content.sections.length) {
      return false;
    }
    if (requirement === 'pass-all-quizzes' && this.progress.completedQuizzes.some(quiz => quiz.score < 70)) {
      return false;
    }
    if (requirement === 'attend-classes' && this.progress.attendedClasses.length === 0) {
      return false;
    }
  }
  
  return true;
});

// Index for efficient queries
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });
enrollmentSchema.index({ status: 1 });
enrollmentSchema.index({ enrollmentDate: -1 });

export default mongoose.model('Enrollment', enrollmentSchema); 