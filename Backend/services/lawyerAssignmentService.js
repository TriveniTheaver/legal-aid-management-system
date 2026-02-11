const CaseLawyerAssignment = require('../Model/CaseLawyerAssignment');
const Case = require('../Model/CaseModel');
const VerifiedLawyer = require('../Model/VerifiedLawyer');
const VerifiedClient = require('../Model/VerifiedClient');
const Rating = require('../Model/Rating');

class LawyerAssignmentService {
  
  // Create a new lawyer assignment
  static async createAssignment(assignmentData) {
    try {
      const {
        caseId,
        lawyerId,
        clientId,
        assignmentType = 'manual',
        clientMessage = '',
        assignedBy = null
      } = assignmentData;

      // Validate case exists and get current status
      const caseData = await Case.findById(caseId);
      if (!caseData) {
        throw new Error('Case not found');
      }

      // Validate lawyer exists and is available
      const lawyer = await VerifiedLawyer.findById(lawyerId);
      if (!lawyer || !lawyer.availability || !lawyer.isActive) {
        throw new Error('Lawyer not available');
      }

      // Validate client exists
      const client = await VerifiedClient.findById(clientId);
      if (!client) {
        throw new Error('Client not found');
      }

      // Check if case already has an active assignment
      const existingActiveAssignment = await this.getActiveAssignment(caseId);
      if (existingActiveAssignment) {
        throw new Error('Case already has an active lawyer assignment');
      }

      // Create new assignment
      const assignment = new CaseLawyerAssignment({
        case: caseId,
        lawyer: lawyerId,
        client: clientId,
        assignmentType,
        status: 'pending',
        clientMessage,
        assignedBy,
        caseStatusWhenAssigned: caseData.status
      });

      await assignment.save();

      // Update case status to lawyer_requested
      await Case.findByIdAndUpdate(caseId, {
        status: 'lawyer_requested',
        currentLawyer: null // Don't set until accepted
      });

      return assignment;
    } catch (error) {
      console.error('Error creating lawyer assignment:', error);
      throw error;
    }
  }

  // Accept a lawyer assignment
  static async acceptAssignment(assignmentId, lawyerId, lawyerResponse = '') {
    try {
      const assignment = await CaseLawyerAssignment.findById(assignmentId);
      if (!assignment) {
        throw new Error('Assignment not found');
      }

      if (assignment.lawyer.toString() !== lawyerId) {
        throw new Error('Unauthorized to accept this assignment');
      }

      if (assignment.status !== 'pending') {
        throw new Error('Assignment is not in pending status');
      }

      // Update assignment
      assignment.status = 'accepted';
      assignment.acceptedAt = new Date();
      assignment.lawyerResponse = lawyerResponse;
      assignment.caseStatusWhenAccepted = 'lawyer_assigned';

      await assignment.save();

      // Update case status and set current lawyer
      await Case.findByIdAndUpdate(assignment.case, {
        status: 'lawyer_assigned',
        currentLawyer: lawyerId
      });

      return assignment;
    } catch (error) {
      console.error('Error accepting assignment:', error);
      throw error;
    }
  }

  // Activate a lawyer assignment (when case moves to active work)
  static async activateAssignment(assignmentId) {
    try {
      const assignment = await CaseLawyerAssignment.findById(assignmentId);
      if (!assignment) {
        throw new Error('Assignment not found');
      }

      if (assignment.status !== 'accepted') {
        throw new Error('Assignment must be accepted before activation');
      }

      assignment.status = 'active';
      assignment.activatedAt = new Date();
      assignment.caseStatusWhenActivated = 'under_review';

      await assignment.save();

      // Update case status
      await Case.findByIdAndUpdate(assignment.case, {
        status: 'under_review'
      });

      return assignment;
    } catch (error) {
      console.error('Error activating assignment:', error);
      throw error;
    }
  }

  // Complete a lawyer assignment
  static async completeAssignment(assignmentId, completionNotes = '') {
    try {
      const assignment = await CaseLawyerAssignment.findById(assignmentId);
      if (!assignment) {
        throw new Error('Assignment not found');
      }

      if (assignment.status !== 'active') {
        throw new Error('Assignment must be active before completion');
      }

      assignment.status = 'completed';
      assignment.completedAt = new Date();
      assignment.calculateCompletionTime();

      // Add completion note if provided
      if (completionNotes) {
        assignment.notes.push({
          addedBy: assignment.lawyer, // Assuming lawyer is adding the note
          note: completionNotes,
          addedAt: new Date()
        });
      }

      await assignment.save();

      return assignment;
    } catch (error) {
      console.error('Error completing assignment:', error);
      throw error;
    }
  }

  // Get active assignment for a case
  static async getActiveAssignment(caseId) {
    return await CaseLawyerAssignment.getActiveAssignment(caseId);
  }

  // Get all assignments for a case
  static async getCaseAssignments(caseId) {
    return await CaseLawyerAssignment.getCaseAssignments(caseId);
  }

  // Get lawyer's active cases
  static async getLawyerActiveCases(lawyerId) {
    return await CaseLawyerAssignment.getLawyerActiveCases(lawyerId);
  }

  // Get client's assigned lawyers
  static async getClientAssignments(clientId) {
    return await CaseLawyerAssignment.find({
      client: clientId,
      status: { $in: ['accepted', 'active'] }
    }).populate('lawyer', 'fullName email lawyerType ratings')
      .populate('case', 'caseNumber caseType status district');
  }

  // Auto-assign lawyer based on case type and availability
  static async autoAssignLawyer(caseId, clientId) {
    try {
      const caseData = await Case.findById(caseId);
      if (!caseData) {
        throw new Error('Case not found');
      }

      // Map case types to lawyer specializations
      const specializationMap = {
        // New case type keys (current)
        'smallClaims': ['Civil Litigation', 'Commercial Law'],
        'landDispute': ['Property Law', 'Civil Litigation'],
        'tenancyDispute': ['Property Law', 'Civil Litigation'],
        'familyMatter': ['Family Law'],
        'consumerRights': ['Commercial Law', 'Civil Litigation'],
        'otherCivil': ['Civil Litigation'],
        // Legacy case type keys (backward compatibility)
        'civil': ['Civil Litigation', 'Commercial Law'],
        'land': ['Property Law', 'Civil Litigation'],
        'tenancy': ['Property Law', 'Civil Litigation'],
        'family': ['Family Law'],
        'commercial': ['Commercial Law', 'Civil Litigation'],
        'consumer': ['Commercial Law', 'Civil Litigation'],
        'other': ['Civil Litigation'],
        // Additional mappings
        'criminal': ['Criminal Defense'],
        'corporate': ['Corporate Law', 'Commercial Law'],
        'labor': ['Labor Law'],
        'tax': ['Tax Law'],
        'constitutional': ['Constitutional Law'],
        'intellectual': ['Intellectual Property']
      };

      const specializations = specializationMap[caseData.caseType] || ['Civil Litigation'];

      // Find best available lawyer (removed isActive since it doesn't exist in schema)
      let lawyer = await VerifiedLawyer.findOne({
        lawyerType: { $in: specializations },
        availability: true
      }).sort({ ratings: -1, passoutYear: 1 });

      // If no specialized lawyer found, find any available lawyer
      if (!lawyer) {
        lawyer = await VerifiedLawyer.findOne({
          availability: true
        }).sort({ ratings: -1, passoutYear: 1 });
      }

      if (!lawyer) {
        throw new Error('No available lawyers found');
      }

      // Create assignment
      const assignment = await this.createAssignment({
        caseId,
        lawyerId: lawyer._id,
        clientId,
        assignmentType: 'auto',
        clientMessage: 'Auto-assignment by system. Please review and accept this case.'
      });

      return { assignment, lawyer };
    } catch (error) {
      console.error('Error in auto-assignment:', error);
      throw error;
    }
  }

  // Update case status and sync with assignment
  static async updateCaseStatus(caseId, newStatus) {
    try {
      const assignment = await this.getActiveAssignment(caseId);
      if (!assignment) {
        console.log('No active assignment found for case:', caseId);
        return;
      }

      // Update case status
      await Case.findByIdAndUpdate(caseId, { status: newStatus });

      // Update assignment with status change
      assignment.notes.push({
        addedBy: assignment.lawyer,
        note: `Case status updated to: ${newStatus}`,
        addedAt: new Date()
      });

      await assignment.save();
    } catch (error) {
      console.error('Error updating case status:', error);
      throw error;
    }
  }

  // Get assignment statistics
  static async getAssignmentStats() {
    try {
      const stats = await CaseLawyerAssignment.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const totalAssignments = await CaseLawyerAssignment.countDocuments();
      const activeAssignments = await CaseLawyerAssignment.countDocuments({
        status: { $in: ['accepted', 'active'] }
      });

      return {
        totalAssignments,
        activeAssignments,
        statusBreakdown: stats
      };
    } catch (error) {
      console.error('Error getting assignment stats:', error);
      throw error;
    }
  }
}

module.exports = LawyerAssignmentService;
