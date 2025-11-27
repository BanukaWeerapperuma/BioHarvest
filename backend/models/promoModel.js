import mongoose from 'mongoose';

const promoSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    default: 'fixed'
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0
  },
  maxDiscount: {
    type: Number,
    min: 0
  },
  minimumOrderAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  maxUsage: {
    type: Number,
    default: -1, // -1 means unlimited
    min: -1
  },
  currentUsage: {
    type: Number,
    default: 0,
    min: 0
  },
  maxUsagePerUser: {
    type: Number,
    default: 1,
    min: 1
  },
  usedBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    usageCount: {
      type: Number,
      default: 1
    },
    usedAt: {
      type: Date,
      default: Date.now
    }
  }],
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sendNotification: {
    type: Boolean,
    default: false
  },
  notificationMessage: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
promoSchema.index({ code: 1, isActive: 1 });
promoSchema.index({ endDate: 1 });

// Virtual for checking if promo is expired
promoSchema.virtual('isExpired').get(function() {
  if (!this.endDate) return false;
  return new Date() > this.endDate;
});

// Virtual for checking if promo is valid
promoSchema.virtual('isValid').get(function() {
  if (!this.isActive) return false;
  if (this.isExpired) return false;
  if (this.maxUsage > 0 && this.currentUsage >= this.maxUsage) return false;
  return true;
});

// Method to calculate discount amount
promoSchema.methods.calculateDiscount = function(orderAmount) {
  if (orderAmount < this.minimumOrderAmount) {
    return 0;
  }

  let discount = 0;
  if (this.discountType === 'percentage') {
    discount = (orderAmount * this.discountValue) / 100;
    if (this.maxDiscount && discount > this.maxDiscount) {
      discount = this.maxDiscount;
    }
  } else {
    discount = this.discountValue;
  }

  return Math.min(discount, orderAmount);
};

// Method to check if user can use this promo
promoSchema.methods.canUserUse = function(userId) {
  if (!this.isValid) return false;
  
  const userUsage = this.usedBy.find(usage => String(usage.userId) === String(userId));
  if (userUsage && userUsage.usageCount >= this.maxUsagePerUser) {
    return false;
  }
  
  return true;
};

// Method to record usage
promoSchema.methods.recordUsage = function(userId) {
  this.currentUsage += 1;
  
  const existingUsage = this.usedBy.find(usage => String(usage.userId) === String(userId));
  if (existingUsage) {
    existingUsage.usageCount += 1;
    existingUsage.usedAt = new Date();
  } else {
    this.usedBy.push({
      userId: userId,
      usageCount: 1,
      usedAt: new Date()
    });
  }
  
  return this.save();
};

const Promo = mongoose.model('Promo', promoSchema);

export default Promo; 