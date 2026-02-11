const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  // User who performed the action
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'userModel'
  },
  userModel: {
    type: String,
    required: true,
    enum: ['VerifiedClient', 'VerifiedLawyer', 'UnverifiedClient', 'UnverifiedLawyer', 'Staff']
  },
  userName: {
    type: String,
    required: true
  },
  userType: {
    type: String,
    required: true,
    enum: ['verified_client', 'verified_lawyer', 'unverified_client', 'unverified_lawyer', 'admin', 'court_scheduler', 'analytics_notification_manager', 'finance_manager']
  },
  
  // Action details
  action: {
    type: String,
    required: true,
    enum: [
      // User actions
      'user_registered',
      'user_login',
      'user_logout',
      'user_approved',
      'user_rejected',
      'profile_updated',
      'password_changed',
      
      // Case actions
      'case_created',
      'case_updated',
      'case_assigned',
      'case_completed',
      'case_status_changed',
      
      // Document actions
      'document_uploaded',
      'document_downloaded',
      'document_deleted',
      'document_generated',
      
      // Staff actions
      'staff_created',
      'staff_updated',
      'staff_deactivated',
      'staff_reactivated',
      
      // Verification actions
      'verification_approved',
      'verification_rejected',
      'verification_requested',
      
      // Payment actions
      'payment_made',
      'payment_failed',
      'payment_refunded',
      
      // System actions
      'email_sent',
      'announcement_created',
      'feedback_submitted',
      'notification_sent',
      
      // Court actions
      'court_scheduled',
      'adjournment_requested',
      'adjournment_approved',
      
      // Other
      'other'
    ]
  },
  
  // Action category for filtering
  category: {
    type: String,
    required: true,
    enum: ['user', 'case', 'document', 'staff', 'verification', 'payment', 'system', 'court', 'other']
  },
  
  // Description of the action
  description: {
    type: String,
    required: true
  },
  
  // Additional metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // IP address and user agent
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  
  // Status of the action
  status: {
    type: String,
    enum: ['success', 'failed', 'pending'],
    default: 'success'
  },
  
  // Related entity reference
  relatedEntityType: {
    type: String,
    enum: ['case', 'user', 'document', 'staff', 'payment', 'announcement', 'feedback', 'notification', 'none'],
    default: 'none'
  },
  relatedEntityId: {
    type: mongoose.Schema.Types.ObjectId
  },
  
  // Timestamp
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
activityLogSchema.index({ timestamp: -1 });
activityLogSchema.index({ userId: 1, timestamp: -1 });
activityLogSchema.index({ action: 1, timestamp: -1 });
activityLogSchema.index({ category: 1, timestamp: -1 });
activityLogSchema.index({ userType: 1, timestamp: -1 });
activityLogSchema.index({ status: 1, timestamp: -1 });

// Static method to log activity
activityLogSchema.statics.logActivity = async function(logData) {
  try {
    const log = new this(logData);
    await log.save();
    return log;
  } catch (error) {
    console.error('Error logging activity:', error);
    return null;
  }
};

// Static method to get recent activities
activityLogSchema.statics.getRecentActivities = async function(limit = 50) {
  return this.find()
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
};

// Static method to get activities by user
activityLogSchema.statics.getActivitiesByUser = async function(userId, limit = 50) {
  return this.find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
};

// Static method to get activities by category
activityLogSchema.statics.getActivitiesByCategory = async function(category, limit = 50) {
  return this.find({ category })
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
};

// Static method to get activities by date range
activityLogSchema.statics.getActivitiesByDateRange = async function(startDate, endDate) {
  return this.find({
    timestamp: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  })
    .sort({ timestamp: -1 })
    .lean();
};

// Static method to get activity statistics
activityLogSchema.statics.getActivityStats = async function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const thisWeek = new Date();
  thisWeek.setDate(thisWeek.getDate() - 7);
  
  const thisMonth = new Date();
  thisMonth.setMonth(thisMonth.getMonth() - 1);
  
  const [
    totalActivities,
    todayActivities,
    weekActivities,
    monthActivities,
    categoryCounts,
    actionCounts,
    recentActivities
  ] = await Promise.all([
    this.countDocuments(),
    this.countDocuments({ timestamp: { $gte: today } }),
    this.countDocuments({ timestamp: { $gte: thisWeek } }),
    this.countDocuments({ timestamp: { $gte: thisMonth } }),
    this.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    this.aggregate([
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]),
    this.find().sort({ timestamp: -1 }).limit(10).lean()
  ]);
  
  return {
    total: totalActivities,
    today: todayActivities,
    thisWeek: weekActivities,
    thisMonth: monthActivities,
    byCategory: categoryCounts,
    topActions: actionCounts,
    recent: recentActivities
  };
};

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

module.exports = ActivityLog;

