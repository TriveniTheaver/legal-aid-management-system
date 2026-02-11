const mongoose = require('mongoose');

const lawyerSalarySchema = new mongoose.Schema({
  lawyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VerifiedLawyer',
    required: true
  },
  case: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentStatus: {
    type: String,
    enum: ['paid', 'unpaid', 'processing'],
    default: 'unpaid'
  },
  paidAt: {
    type: Date
  },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff', // Finance manager who processed the payment
    required: function() {
      return this.paymentStatus === 'paid';
    }
  },
  paymentMethod: {
    type: String,
    enum: ['system_transfer', 'bank_transfer', 'cash', 'check'],
    default: 'system_transfer'
  },
  description: {
    type: String,
    default: ''
  },
  transactionId: {
    type: String,
    unique: true,
    sparse: true // Allows multiple null values
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Compound index to ensure one payment per lawyer per case
lawyerSalarySchema.index({ lawyer: 1, case: 1 }, { unique: true });

// Index for efficient queries
lawyerSalarySchema.index({ paymentStatus: 1 });
lawyerSalarySchema.index({ paidAt: 1 });
lawyerSalarySchema.index({ lawyer: 1, paymentStatus: 1 });

// Pre-save middleware to generate transaction ID
lawyerSalarySchema.pre('save', function(next) {
  if (this.paymentStatus === 'paid' && !this.transactionId) {
    // Generate unique transaction ID
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    this.transactionId = `SAL-${timestamp}-${random}`.toUpperCase();
  }
  
  if (this.paymentStatus === 'paid' && !this.paidAt) {
    this.paidAt = new Date();
  }
  
  next();
});

// Virtual for formatted amount
lawyerSalarySchema.virtual('formattedAmount').get(function() {
  return `LKR ${this.amount.toLocaleString()}`;
});

// Static method to get lawyer salary summary
lawyerSalarySchema.statics.getLawyerSalarySummary = async function(lawyerId) {
  const summary = await this.aggregate([
    { $match: { lawyer: mongoose.Types.ObjectId(lawyerId) } },
    {
      $group: {
        _id: '$lawyer',
        totalCases: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        paidCases: {
          $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0] }
        },
        paidAmount: {
          $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$amount', 0] }
        },
        unpaidCases: {
          $sum: { $cond: [{ $eq: ['$paymentStatus', 'unpaid'] }, 1, 0] }
        },
        unpaidAmount: {
          $sum: { $cond: [{ $eq: ['$paymentStatus', 'unpaid'] }, '$amount', 0] }
        }
      }
    }
  ]);
  
  return summary[0] || {
    totalCases: 0,
    totalAmount: 0,
    paidCases: 0,
    paidAmount: 0,
    unpaidCases: 0,
    unpaidAmount: 0
  };
};

// Static method to get monthly salary report
lawyerSalarySchema.statics.getMonthlySalaryReport = async function(year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  
  return await this.aggregate([
    {
      $match: {
        paidAt: { $gte: startDate, $lte: endDate },
        paymentStatus: 'paid'
      }
    },
    {
      $group: {
        _id: '$lawyer',
        totalPaid: { $sum: '$amount' },
        casesPaid: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'verifiedlawyers',
        localField: '_id',
        foreignField: '_id',
        as: 'lawyerInfo'
      }
    },
    {
      $unwind: '$lawyerInfo'
    },
    {
      $project: {
        lawyerName: { $ifNull: ['$lawyerInfo.fullName', '$lawyerInfo.name'] },
        lawyerEmail: '$lawyerInfo.email',
        totalPaid: 1,
        casesPaid: 1
      }
    },
    {
      $sort: { totalPaid: -1 }
    }
  ]);
};

module.exports = mongoose.model('LawyerSalary', lawyerSalarySchema);
