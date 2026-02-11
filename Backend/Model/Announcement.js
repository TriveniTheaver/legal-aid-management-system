const mongoose = require('mongoose');
const { Schema } = mongoose;

const announcementSchema = new Schema({
  announcementId: { type: String, unique: true }, // Auto-generated
  
  // Announcement content
  title: { 
    type: String, 
    required: [true, 'Announcement title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  message: { 
    type: String, 
    required: [true, 'Announcement message is required'],
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  
  // Language and localization
  language: { 
    type: String, 
    enum: ['English', 'Sinhala', 'Tamil'], 
    default: 'English',
    required: true
  },
  
  // Priority and scheduling
  priority: { 
    type: String, 
    enum: ['Low Priority', 'Normal Priority', 'High Priority', 'Urgent'], 
    default: 'Normal Priority',
    required: true
  },
  schedule: { 
    type: String, 
    enum: ['Send Immediately', 'Schedule for Later'], 
    default: 'Send Immediately',
    required: true
  },
  scheduledAt: { type: Date, default: null },
  
  // Recipients
  recipients: { 
    type: String, 
    enum: ['All Users', 'Clients', 'Lawyers', 'Staff', 'Custom'], 
    default: 'All Users',
    required: true
  },
  customRecipients: [{
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    userType: { type: String, enum: ['VerifiedClient', 'VerifiedLawyer', 'Staff'], required: true },
    userName: String,
    userEmail: String
  }],
  
  // Creator info
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
  createdByName: { type: String, required: true },
  
  // Status and tracking
  status: { 
    type: String, 
    enum: ['Draft', 'Published', 'Scheduled', 'Expired'], 
    default: 'Draft'
  },
  publishedAt: { type: Date, default: null },
  expiresAt: { type: Date, default: null },
  
  // Delivery tracking
  totalRecipients: { type: Number, default: 0 },
  deliveredTo: [{
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    userType: { type: String, enum: ['VerifiedClient', 'VerifiedLawyer', 'Staff'], required: true },
    deliveredAt: { type: Date, default: Date.now },
    userName: String
  }],
  
  // Acknowledgment tracking
  acknowledgedBy: [{
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    userType: { type: String, enum: ['VerifiedClient', 'VerifiedLawyer', 'Staff'], required: true },
    acknowledgedAt: { type: Date, default: Date.now },
    userName: String
  }],
  
  // Analytics
  views: { type: Number, default: 0 },
  clickThroughRate: { type: Number, default: 0 },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Pre-save hook to generate announcementId and update timestamps
announcementSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  if (!this.announcementId) {
    const timestamp = Date.now().toString();
    const randomStr = Math.random().toString(36).substr(2, 6).toUpperCase();
    this.announcementId = `ANN-${timestamp}-${randomStr}`;
  }
  
  // If status is Published and publishedAt is not set, set it
  if (this.status === 'Published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  next();
});

// Instance method to check if announcement is expired
announcementSchema.methods.isExpired = function() {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
};

// Instance method to get acknowledgment rate
announcementSchema.methods.getAcknowledgmentRate = function() {
  if (this.totalRecipients === 0) return 100;
  return Math.round((this.acknowledgedBy.length / this.totalRecipients) * 100);
};

// Instance method to check if user has acknowledged
announcementSchema.methods.hasUserAcknowledged = function(userId) {
  return this.acknowledgedBy.some(ack => ack.userId.toString() === userId.toString());
};

// Static method to get active announcements for user
announcementSchema.statics.getActiveForUser = function(userId, userType) {
  const now = new Date();
  
  return this.find({
    $and: [
      { status: { $in: ['Published', 'Scheduled'] } },
      { $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] },
      { $or: [{ scheduledAt: null }, { scheduledAt: { $lte: now } }] },
      {
        $or: [
          { recipients: 'All Users' },
          { recipients: userType === 'verified_client' ? 'Clients' : 
                      userType === 'verified_lawyer' ? 'Lawyers' : 'Staff' },
          { 'customRecipients.userId': userId }
        ]
      }
    ]
  }).sort({ priority: -1, createdAt: -1 });
};

// Static method to get unacknowledged announcements for user
announcementSchema.statics.getUnacknowledgedForUser = function(userId, userType) {
  const now = new Date();
  
  return this.find({
    $and: [
      { status: { $in: ['Published', 'Scheduled'] } },
      { $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] },
      { $or: [{ scheduledAt: null }, { scheduledAt: { $lte: now } }] },
      {
        $or: [
          { recipients: 'All Users' },
          { recipients: userType === 'verified_client' ? 'Clients' : 
                      userType === 'verified_lawyer' ? 'Lawyers' : 'Staff' },
          { 'customRecipients.userId': userId }
        ]
      },
      { 'acknowledgedBy.userId': { $ne: userId } }
    ]
  }).sort({ priority: -1, createdAt: -1 });
};

// Indexes for better query performance
announcementSchema.index({ createdBy: 1, createdAt: -1 });
announcementSchema.index({ status: 1, recipients: 1 });
announcementSchema.index({ publishedAt: -1 });
announcementSchema.index({ priority: -1, createdAt: -1 });

module.exports = mongoose.model('Announcement', announcementSchema);
