import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['info', 'success', 'warning', 'error'],
    default: 'info'
  },
  targetAudience: {
    type: String,
    enum: ['all', 'customers', 'admins'],
    default: 'all'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  scheduledDate: {
    type: Date
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  sentTo: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    sentAt: {
      type: Date,
      default: Date.now
    },
    readAt: {
      type: Date
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
notificationSchema.index({ isActive: 1, targetAudience: 1 });
notificationSchema.index({ scheduledDate: 1 });

// Virtual for checking if notification is scheduled
notificationSchema.virtual('isScheduled').get(function() {
  return this.scheduledDate && this.scheduledDate > new Date();
});

// Virtual for checking if notification should be sent
notificationSchema.virtual('shouldSend').get(function() {
  if (!this.isActive) return false;
  if (this.isScheduled) return false;
  return true;
});

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification; 