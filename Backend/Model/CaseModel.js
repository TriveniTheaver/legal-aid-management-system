const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const caseSchema = new Schema({
  caseType: {
    type: String,
    required: true,
  },
  plaintiffName: {
    type: String,
    required: true,
  },
  plaintiffNIC: {
    type: String,
    required: true,
  },
  plaintiffAddress: {
    type: String,
    required: true,
  },
  plaintiffPhone: {
    type: String,
    required: true,
  },
  defendantName: {
    type: String,
    required: true,
  },
  defendantNIC: {
    type: String,
    required: false,
  },
  defendantAddress: {
    type: String,
    required: true,
  },
  defendantPhone: {
    type: String,
  },
  defendantEmail: {
    type: String,
  },
  caseDescription: {
    type: String,
    required: true,
  },
  reliefSought: {
    type: String,
    required: true,
  },
  caseValue: {
    type: Number,
    default: 0,
  },
  incidentDate: {
    type: Date,
  },
  district: {
    type: String,
    required: true,
    enum: [
      "Colombo", "Gampaha", "Kalutara", "Kandy", "Matale", "Nuwara Eliya",
      "Galle", "Matara", "Hambantota", "Jaffna", "Kilinochchi", "Mannar",
      "Vavuniya", "Mullaitivu", "Batticaloa", "Ampara", "Trincomalee",
      "Kurunegala", "Puttalam", "Anuradhapura", "Polonnaruwa", "Badulla",
      "Moneragala", "Ratnapura", "Kegalle"
    ],
  },
  documents: [
    {
      filename: String,
      originalName: String,
      uploadDate: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  status: {
    type: String,
    enum: [
      "pending",           // Initial case creation
      "verified",         // Client verified by admin
      "lawyer_requested",  // Client requested lawyer assignment
      "lawyer_assigned",   // Lawyer assigned and accepted
      "filing_requested", // Client requested court filing
      "under_review",      // Lawyer reviewing case for filing
      "approved",          // Case approved for filing
      "rejected",          // Case rejected
      "filed",            // Case filed in court
      "scheduling_requested", // Court scheduling requested
      "hearing_scheduled", // Court hearing scheduled
      "rescheduled",       // Hearing rescheduled
      "completed",         // Case completed/closed
      "cancelled"          // Case cancelled
    ],
    default: "pending",
  },
  courtStatus: {
    type: String,
    enum: ["in_hearing", "closed"],
    default: "in_hearing",
  },
  courtStatusUpdatedAt: {
    type: Date,
  },
  courtStatusUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Staff",
  },
  caseNumber: {
    type: String,
    unique: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "VerifiedClient",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  verificationStatus: {
    type: String,
    enum: ["pending", "verified", "rejected"],
    default: "pending",
  },
  currentLawyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "VerifiedLawyer",
  },
  filingStatus: {
    type: String,
    enum: ["not_started", "preparing", "submitted", "confirmed", "filed"],
    default: "not_started",
  },
  courtDetails: {
    name: String,
    reference: String,
    filingDate: Date,
    hearingDate: Date,
    filedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VerifiedLawyer"
    }
  },
  // Direct scheduling fields (used by court scheduler)
  hearingDate: {
    type: Date
  },
  hearingTime: {
    startTime: String,
    endTime: String
  },
  courtroom: {
    type: String
  },
  lawyerNotes: {
    type: String
  },
  documentRequest: {
    type: String
  },
  documentRequestDate: {
    type: Date
  },
  readyToFileDate: {
    type: Date
  },
  filingRequested: {
    type: Boolean,
    default: false
  },
  filingRequestDate: {
    type: Date
  },
  filingRequestMessage: {
    type: String
  },
});

// Status transition validation
const validStatusTransitions = {
  'pending': ['verified', 'cancelled'],
  'verified': ['lawyer_requested', 'cancelled'],
  'lawyer_requested': ['lawyer_assigned', 'cancelled'],
  'lawyer_assigned': ['filing_requested', 'cancelled'],
  'filing_requested': ['under_review', 'cancelled'],
  'under_review': ['approved', 'rejected', 'cancelled'],
  'approved': ['filed', 'cancelled'],
  'rejected': ['pending', 'cancelled'],
  'filed': ['scheduling_requested', 'cancelled'],
  'scheduling_requested': ['hearing_scheduled', 'cancelled'],
  'hearing_scheduled': ['completed', 'rescheduled', 'cancelled'],
  'rescheduled': ['hearing_scheduled', 'completed', 'cancelled'],
  'completed': [], // Terminal state
  'cancelled': []  // Terminal state
};

// Middleware to validate status transitions and ensure data integrity
caseSchema.pre('save', async function(next) {
  if (this.isModified('status')) {
    const currentStatus = this.status;
    const previousStatus = this.constructor.findById(this._id).status;
    
    console.log(`🔄 Case ${this.caseNumber} status transition: ${previousStatus} → ${currentStatus}`);
    
    // Validate status transition
    if (previousStatus && !validStatusTransitions[previousStatus]?.includes(currentStatus)) {
      console.log(`❌ Invalid status transition: ${previousStatus} → ${currentStatus}`);
      return next(new Error(`Invalid status transition from ${previousStatus} to ${currentStatus}`));
    }
    
    // Special validations for specific statuses
    if (currentStatus === 'hearing_scheduled') {
      console.log(`🔍 Checking ScheduledCase record for case ${this.caseNumber}...`);
      
      try {
        const ScheduledCase = require('./ScheduledCase');
        const existingScheduled = await ScheduledCase.findOne({ case: this._id });
        
        if (!existingScheduled) {
          console.log(`⚠️ WARNING: Case ${this.caseNumber} marked as "hearing_scheduled" but no ScheduledCase record exists!`);
          console.log(`🔧 Auto-correcting status to "lawyer_assigned" - case needs proper court scheduling`);
          
          // Auto-correct the status - case should go through proper court scheduler workflow
          this.status = 'lawyer_assigned';
        } else {
          console.log(`✅ ScheduledCase record exists for case ${this.caseNumber}`);
        }
      } catch (error) {
        console.error(`❌ Error checking ScheduledCase record:`, error);
        // If check fails, don't allow hearing_scheduled status
        this.status = 'lawyer_assigned';
      }
    }
    
    // Ensure lawyer assignment is maintained for certain statuses
    if (['lawyer_assigned', 'filing_requested', 'under_review', 'approved', 'filed', 'scheduling_requested', 'hearing_scheduled'].includes(currentStatus)) {
      if (!this.currentLawyer) {
        console.log(`⚠️ WARNING: Case ${this.caseNumber} status changed to ${currentStatus} but no currentLawyer assigned!`);
        
        // Try to find lawyer from assignment
        try {
          const CaseLawyerAssignment = require('./CaseLawyerAssignment');
          const assignment = await CaseLawyerAssignment.findOne({
            case: this._id,
            status: { $in: ['accepted', 'active', 'completed'] }
          });
          
          if (assignment) {
            this.currentLawyer = assignment.lawyer;
            console.log(`✅ Restored currentLawyer from assignment: ${assignment.lawyer}`);
            
            // Update assignment status to active when case becomes active
            if (currentStatus === 'filing_requested' && assignment.status === 'accepted') {
              assignment.status = 'active';
              assignment.activatedAt = new Date();
              assignment.caseStatusWhenActivated = currentStatus;
              await assignment.save();
              console.log(`✅ Updated assignment status to active for case ${this.caseNumber}`);
            }
          } else {
            console.log(`❌ No valid assignment found for case ${this.caseNumber}`);
            // Don't allow status change without lawyer assignment
            return next(new Error(`Cannot change status to ${currentStatus} without a valid lawyer assignment`));
          }
        } catch (error) {
          console.error(`❌ Error finding lawyer assignment:`, error);
          return next(new Error(`Cannot change status to ${currentStatus} - assignment lookup failed`));
        }
      }
    }
  }
  
  next();
});

// Generate case number before saving
caseSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      const year = new Date().getFullYear();
      
      // Find the highest existing case number for this year
      const latestCase = await this.constructor.findOne({
        caseNumber: { $regex: `^CL${year}-` }
      }).sort({ caseNumber: -1 });
      
      let nextNumber = 1;
      if (latestCase && latestCase.caseNumber) {
        // Extract number from the latest case number (e.g., "CL2025-0009" -> 9)
        const match = latestCase.caseNumber.match(/CL\d{4}-(\d+)$/);
        if (match) {
          nextNumber = parseInt(match[1], 10) + 1;
        }
      }
      
      // Keep trying until we find a unique case number
      let attempts = 0;
      while (attempts < 100) { // Prevent infinite loop
        const caseNumber = `CL${year}-${String(nextNumber).padStart(4, '0')}`;
        
        // Check if this case number already exists
        const existingCase = await this.constructor.findOne({ caseNumber });
        if (!existingCase) {
          this.caseNumber = caseNumber;
          console.log("Generated unique case number:", this.caseNumber);
          break;
        }
        
        nextNumber++;
        attempts++;
      }
      
      if (!this.caseNumber) {
        // Fallback to timestamp-based number
        const timestamp = Date.now().toString().slice(-6);
        this.caseNumber = `CL${year}-${timestamp}`;
        console.log("Using fallback case number:", this.caseNumber);
      }
    } catch (error) {
      console.error("Error generating case number:", error);
      // Fallback case number using timestamp
      const timestamp = Date.now().toString().slice(-6);
      const year = new Date().getFullYear();
      this.caseNumber = `CL${year}-${timestamp}`;
    }
  }
  this.updatedAt = Date.now();
  next();
});
module.exports = mongoose.model("CaseModel", caseSchema);
