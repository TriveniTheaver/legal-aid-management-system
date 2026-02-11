const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// New comprehensive model for tracking lawyer assignments throughout case lifecycle
const caseLawyerAssignmentSchema = new Schema({
  case: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CaseModel',
    required: true,
    index: true
  },
  lawyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VerifiedLawyer',
    required: true,
    index: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VerifiedClient',
    required: true,
    index: true
  },
  assignmentType: {
    type: String,
    enum: ['auto', 'manual', 'admin_assigned'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'active', 'completed', 'withdrawn', 'rejected'],
    default: 'pending',
    index: true
  },
  // Assignment lifecycle tracking
  assignedAt: {
    type: Date,
    default: Date.now
  },
  acceptedAt: {
    type: Date
  },
  activatedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  withdrawnAt: {
    type: Date
  },
  // Communication
  clientMessage: {
    type: String,
    maxlength: 500
  },
  lawyerResponse: {
    type: String,
    maxlength: 500
  },
  // Case status synchronization
  caseStatusWhenAssigned: {
    type: String
  },
  caseStatusWhenAccepted: {
    type: String
  },
  caseStatusWhenActivated: {
    type: String
  },
  // Assignment metadata
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff', // Admin who assigned (if admin assignment)
    default: null
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  // Performance tracking
  responseTime: {
    type: Number, // Hours from assignment to acceptance
    default: null
  },
  completionTime: {
    type: Number, // Hours from activation to completion
    default: null
  },
  // Notes and updates
  notes: [{
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff', // Who added the note
      required: true
    },
    note: {
      type: String,
      required: true,
      maxlength: 1000
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Status change history
  statusHistory: [{
    fromStatus: String,
    toStatus: String,
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff'
    },
    reason: String,
    changedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for better performance
caseLawyerAssignmentSchema.index({ case: 1, status: 1 });
caseLawyerAssignmentSchema.index({ lawyer: 1, status: 1 });
caseLawyerAssignmentSchema.index({ client: 1, status: 1 });
caseLawyerAssignmentSchema.index({ assignedAt: -1 });

// Pre-save middleware to update timestamps and track status changes
caseLawyerAssignmentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Track status changes
  if (this.isModified('status') && !this.isNew) {
    const statusHistory = this.statusHistory || [];
    statusHistory.push({
      fromStatus: this.statusHistory[this.statusHistory.length - 1]?.toStatus || 'initial',
      toStatus: this.status,
      changedAt: new Date()
    });
    this.statusHistory = statusHistory;
  }
  
  next();
});

// Method to calculate response time
caseLawyerAssignmentSchema.methods.calculateResponseTime = function() {
  if (this.acceptedAt && this.assignedAt) {
    this.responseTime = Math.round((this.acceptedAt - this.assignedAt) / (1000 * 60 * 60)); // Hours
  }
  return this.responseTime;
};

// Method to calculate completion time
caseLawyerAssignmentSchema.methods.calculateCompletionTime = function() {
  if (this.completedAt && this.activatedAt) {
    this.completionTime = Math.round((this.completedAt - this.activatedAt) / (1000 * 60 * 60)); // Hours
  }
  return this.completionTime;
};

// Static method to get active assignments for a case
caseLawyerAssignmentSchema.statics.getActiveAssignment = async function(caseId) {
  return await this.findOne({
    case: caseId,
    status: { $in: ['accepted', 'active'] }
  }).populate('lawyer', 'fullName email lawyerType ratings')
    .populate('client', 'fullName email');
};

// Static method to get all assignments for a case
caseLawyerAssignmentSchema.statics.getCaseAssignments = async function(caseId) {
  return await this.find({ case: caseId })
    .populate('lawyer', 'fullName email lawyerType ratings')
    .populate('client', 'fullName email')
    .sort({ assignedAt: -1 });
};

// Static method to get lawyer's active cases
caseLawyerAssignmentSchema.statics.getLawyerActiveCases = async function(lawyerId) {
  return await this.find({
    lawyer: lawyerId,
    status: { $in: ['accepted', 'active'] }
  }).populate('case', 'caseNumber caseType status district')
    .populate('client', 'fullName email');
};

module.exports = mongoose.model("CaseLawyerAssignment", caseLawyerAssignmentSchema);
