const CaseModel = require('../Model/CaseModel');
const CaseLawyerAssignment = require('../Model/CaseLawyerAssignment');
const VerifiedLawyer = require('../Model/VerifiedLawyer');
const VerifiedClient = require('../Model/VerifiedClient');
const CourtScheduleRequest = require('../Model/CourtScheduleRequest');
const ScheduledCase = require('../Model/ScheduledCase');

/**
 * Comprehensive Case Flow Service
 * Manages the entire case lifecycle from creation to completion
 */

class CaseFlowService {
  
  /**
   * Get case with complete information including lawyer assignment
   */
  static async getCaseWithAssignment(caseId) {
    try {
      console.log(`🔍 Looking for case: ${caseId}`);
      const caseData = await CaseModel.findById(caseId)
        .populate('user', 'fullName email')
        .populate('currentLawyer', 'fullName email lawyerType ratings');
      
      console.log(`🔍 Case query result:`, caseData ? 'Found' : 'Not found');
      
      if (!caseData) {
        console.log(`❌ Case not found: ${caseId}`);
        
        // Debug: Let's see what cases actually exist
        const allCases = await CaseModel.find({}).select('_id caseNumber status').limit(5);
        console.log(`🔍 Available cases in database:`, allCases.map(c => ({ id: c._id, number: c.caseNumber, status: c.status })));
        
        return { success: false, message: 'Case not found' };
      }
      
      // Get assignment information
      const assignment = await CaseLawyerAssignment.findOne({
        case: caseId,
        status: { $in: ['accepted', 'active', 'completed'] }
      }).populate('lawyer', 'fullName email lawyerType ratings');
      
      return {
        success: true,
        case: caseData,
        assignment: assignment
      };
    } catch (error) {
      console.error('Error getting case with assignment:', error);
      return { success: false, message: 'Error retrieving case information' };
    }
  }
  
  /**
   * Update case status with proper validation and lawyer assignment sync
   */
  static async updateCaseStatus(caseId, newStatus, options = {}) {
    try {
      console.log(`🔄 Updating case ${caseId} status to: ${newStatus}`);
      
      const caseData = await CaseModel.findById(caseId);
      if (!caseData) {
        return { success: false, message: 'Case not found' };
      }
      
      // Validate status transition
      const validTransitions = {
        'pending': ['verified', 'cancelled'],
        'verified': ['lawyer_requested', 'cancelled'],
        'lawyer_requested': ['lawyer_assigned', 'cancelled'],
        'lawyer_assigned': ['filing_requested', 'cancelled'],
        'filing_requested': ['under_review', 'filed', 'cancelled'],
        'under_review': ['approved', 'rejected', 'cancelled'],
        'approved': ['filed', 'cancelled'],
        'rejected': ['pending', 'cancelled'],
        'filed': ['scheduling_requested', 'cancelled'],
        'scheduling_requested': ['hearing_scheduled', 'cancelled'],
        'hearing_scheduled': ['completed', 'rescheduled', 'cancelled'],
        'rescheduled': ['hearing_scheduled', 'completed', 'cancelled'],
        'completed': [],
        'cancelled': []
      };
      
      if (!validTransitions[caseData.status]?.includes(newStatus)) {
        return { 
          success: false, 
          message: `Invalid status transition from ${caseData.status} to ${newStatus}` 
        };
      }
      
      // Ensure lawyer assignment is maintained for certain statuses
      if (['lawyer_assigned', 'filing_requested', 'under_review', 'approved', 'filed', 'scheduling_requested', 'hearing_scheduled'].includes(newStatus)) {
        if (!caseData.currentLawyer) {
          console.log('⚠️ No currentLawyer found, attempting to restore from assignment...');
          
          const assignment = await CaseLawyerAssignment.findOne({
            case: caseId,
            status: { $in: ['accepted', 'active', 'completed'] }
          });
          
          if (assignment) {
            caseData.currentLawyer = assignment.lawyer;
            console.log(`✅ Restored currentLawyer from assignment: ${assignment.lawyer}`);
          } else {
            return { 
              success: false, 
              message: 'No lawyer assignment found for this case' 
            };
          }
        }
      }
      
      // Update case status
      const updateData = { 
        status: newStatus,
        currentLawyer: caseData.currentLawyer, // Preserve lawyer assignment
        ...options
      };
      
      console.log(`🔍 Before update - Case ID: ${caseId}, Status: ${caseData.status}`);
      console.log(`🔍 Update data:`, updateData);
      
      const updatedCase = await CaseModel.findByIdAndUpdate(
        caseId, 
        updateData, 
        { new: true }
      );
      
      console.log(`🔍 After update - Case ID: ${updatedCase?._id}, Status: ${updatedCase?.status}`);
      console.log(`🔍 Case ID changed: ${caseId !== updatedCase?._id.toString() ? 'YES' : 'NO'}`);
      
      // Sync assignment status with case status
      if (caseData.currentLawyer) {
        const assignment = await CaseLawyerAssignment.findOne({
          case: caseId,
          lawyer: caseData.currentLawyer
        });
        
        if (assignment) {
          let assignmentStatus = assignment.status;
          
          // Update assignment status based on case status
          if (newStatus === 'filing_requested' && assignment.status === 'accepted') {
            assignmentStatus = 'active';
            assignment.activatedAt = new Date();
            assignment.caseStatusWhenActivated = newStatus;
          } else if (newStatus === 'completed' && assignment.status === 'active') {
            assignmentStatus = 'completed';
            assignment.completedAt = new Date();
          }
          
          if (assignmentStatus !== assignment.status) {
            assignment.status = assignmentStatus;
            await assignment.save();
            console.log(`✅ Updated assignment status to ${assignmentStatus} for case ${caseId}`);
          }
        }
      }
      
      console.log(`✅ Case ${caseId} status updated to: ${newStatus}`);
      
      return {
        success: true,
        case: updatedCase,
        message: `Case status updated to ${newStatus}`
      };
      
    } catch (error) {
      console.error('Error updating case status:', error);
      return { success: false, message: 'Error updating case status' };
    }
  }
  
  /**
   * Request court filing with proper validation
   */
  static async requestCourtFiling(caseId, clientId, message) {
    try {
      console.log(`📋 Client ${clientId} requesting court filing for case ${caseId}`);
      
      // Get case with assignment info
      const caseInfo = await this.getCaseWithAssignment(caseId);
      if (!caseInfo.success) {
        return caseInfo;
      }
      
      const { case: caseData, assignment } = caseInfo;
      
      // Validate case ownership
      console.log('🔍 Case ownership validation:');
      console.log('  Case user:', caseData.user);
      console.log('  Case user type:', typeof caseData.user);
      console.log('  Client ID:', clientId);
      
      // Handle populated user object vs ObjectId
      let caseUserId;
      if (caseData.user && caseData.user._id) {
        // User is populated object
        caseUserId = caseData.user._id.toString();
        console.log('  Extracted user ID from populated object:', caseUserId);
      } else {
        // User is ObjectId
        caseUserId = caseData.user.toString();
        console.log('  User ID from ObjectId:', caseUserId);
      }
      
      const clientIdStr = clientId.toString();
      console.log('  Final comparison:', caseUserId, '===', clientIdStr, '=', caseUserId === clientIdStr);
      
      if (caseUserId !== clientIdStr) {
        console.log('❌ Access denied - User ID mismatch');
        console.log('  Case belongs to:', caseUserId);
        console.log('  Requesting user:', clientIdStr);
        return { success: false, message: 'Access denied - Case does not belong to this user' };
      }
      
      // Validate case status - allow filing for cases with lawyer assigned
      console.log('🔍 Case status validation:');
      console.log('  Case status:', caseData.status);
      console.log('  Current lawyer:', caseData.currentLawyer);
      console.log('  Assignment:', assignment ? assignment.status : 'No assignment');
      
      const validStatuses = ['lawyer_assigned', 'filing_requested', 'under_review', 'approved'];
      if (!validStatuses.includes(caseData.status)) {
        return { 
          success: false, 
          message: `Case is not ready for filing. Current status: ${caseData.status}. Case must have a lawyer assigned.` 
        };
      }
      
      // Validate lawyer assignment
      if (!caseData.currentLawyer && !assignment) {
        return { 
          success: false, 
          message: 'No lawyer assigned to this case' 
        };
      }
      
      // Update case status
      const result = await this.updateCaseStatus(caseId, 'filing_requested', {
        filingRequested: true,
        filingRequestDate: new Date(),
        filingRequestMessage: message
      });
      
      // Update assignment status to active when filing is requested
      if (assignment && assignment.status === 'accepted') {
        try {
          await CaseLawyerAssignment.findByIdAndUpdate(assignment._id, {
            status: 'active',
            activatedAt: new Date(),
            caseStatusWhenActivated: 'filing_requested'
          });
          console.log(`✅ Assignment ${assignment._id} activated for filing request`);
        } catch (error) {
          console.error(`❌ Error updating assignment ${assignment._id}:`, error.message);
          // Continue with the flow even if assignment update fails
        }
      }
      
      if (!result.success) {
        return result;
      }
      
      console.log(`✅ Court filing requested for case ${caseId}`);
      
      return {
        success: true,
        message: 'Court filing requested successfully',
        case: result.case
      };
      
    } catch (error) {
      console.error('Error requesting court filing:', error);
      return { success: false, message: 'Error requesting court filing' };
    }
  }
  
  /**
   * Submit case to court with proper validation
   */
  static async submitCourtFiling(caseId, lawyerId, reviewNotes) {
    try {
      console.log(`⚖️ Lawyer ${lawyerId} submitting case ${caseId} to court`);
      console.log(`🔍 Case ID type: ${typeof caseId}, value: ${caseId}`);
      
      // Get case with assignment info
      const caseInfo = await this.getCaseWithAssignment(caseId);
      if (!caseInfo.success) {
        console.log(`❌ Failed to get case info: ${caseInfo.message}`);
        return caseInfo;
      }
      
      const { case: caseData, assignment } = caseInfo;
      
      // Validate lawyer assignment
      console.log(`🔍 Lawyer assignment validation:`);
      console.log(`  Case currentLawyer: ${caseData.currentLawyer}`);
      console.log(`  Requesting lawyer: ${lawyerId}`);
      console.log(`  Assignment lawyer: ${assignment?.lawyer}`);
      console.log(`  Assignment status: ${assignment?.status}`);
      
      // Check if lawyer is assigned to this case (either in case or assignment)
      const caseLawyerId = caseData.currentLawyer?._id?.toString() || caseData.currentLawyer?.toString();
      const assignmentLawyerId = assignment?.lawyer?._id?.toString() || assignment?.lawyer?.toString();
      
      console.log(`  Extracted caseLawyerId: ${caseLawyerId}`);
      console.log(`  Extracted assignmentLawyerId: ${assignmentLawyerId}`);
      console.log(`  Requesting lawyerId: ${lawyerId}`);
      console.log(`  Case match: ${caseLawyerId === lawyerId}`);
      console.log(`  Assignment match: ${assignmentLawyerId === lawyerId}`);
      
      const isLawyerAssigned = caseLawyerId === lawyerId || assignmentLawyerId === lawyerId;
      
      if (!isLawyerAssigned) {
        console.log(`❌ Lawyer ${lawyerId} is not assigned to case ${caseId}`);
        return { success: false, message: 'You are not assigned to this case' };
      }
      
      console.log(`✅ Lawyer assignment validated`);
      
      // Validate case status
      if (caseData.status !== 'filing_requested') {
        return { 
          success: false, 
          message: `Case is not ready for filing. Current status: ${caseData.status}` 
        };
      }
      
      // Update case status and filing details
      const courtReference = `CL${new Date().getFullYear()}-${caseId.slice(-6)}`;
      const result = await this.updateCaseStatus(caseId, 'filed', {
        filingStatus: 'filed',
        lawyerNotes: reviewNotes,
        courtDetails: {
          name: this.getDistrictCourtName(caseData.district),
          reference: courtReference,
          filingDate: new Date(),
          filedBy: lawyerId
        }
      });
      
      if (!result.success) {
        return result;
      }
      
      console.log(`✅ Case ${caseId} filed in court with reference: ${courtReference}`);
      
      return {
        success: true,
        message: 'Case filed successfully',
        case: result.case,
        courtReference
      };
      
    } catch (error) {
      console.error('Error submitting court filing:', error);
      return { success: false, message: 'Error submitting court filing' };
    }
  }
  
  /**
   * Request court scheduling with proper validation
   */
  static async requestCourtScheduling(caseId, lawyerId, message) {
    try {
      console.log(`📅 Lawyer ${lawyerId} requesting court scheduling for case ${caseId}`);
      
      // Get case with assignment info
      const caseInfo = await this.getCaseWithAssignment(caseId);
      if (!caseInfo.success) {
        return caseInfo;
      }
      
      const { case: caseData, assignment } = caseInfo;
      
      // Validate lawyer assignment (check both case and assignment)
      const caseLawyerId = caseData.currentLawyer?._id?.toString() || caseData.currentLawyer?.toString();
      const assignmentLawyerId = assignment?.lawyer?._id?.toString() || assignment?.lawyer?.toString();
      
      console.log(`🔍 Court scheduling validation:`);
      console.log(`  Case currentLawyer: ${caseData.currentLawyer}`);
      console.log(`  Assignment lawyer: ${assignment?.lawyer}`);
      console.log(`  Requesting lawyer: ${lawyerId}`);
      console.log(`  Extracted caseLawyerId: ${caseLawyerId}`);
      console.log(`  Extracted assignmentLawyerId: ${assignmentLawyerId}`);
      console.log(`  Case match: ${caseLawyerId === lawyerId}`);
      console.log(`  Assignment match: ${assignmentLawyerId === lawyerId}`);
      
      const isLawyerAssigned = caseLawyerId === lawyerId || assignmentLawyerId === lawyerId;
      
      if (!isLawyerAssigned) {
        console.log(`❌ Lawyer ${lawyerId} is not assigned to case ${caseId} for court scheduling`);
        return { success: false, message: 'You are not assigned to this case' };
      }
      
      // Validate case status - allow filed cases and cases that have been filed
      const validStatuses = ['filed', 'scheduling_requested', 'under_review', 'approved'];
      if (!validStatuses.includes(caseData.status)) {
        return { 
          success: false, 
          message: `Case is not ready for scheduling. Current status: ${caseData.status}. Valid statuses: ${validStatuses.join(', ')}` 
        };
      }
      
      // Check if scheduling already requested
      const existingRequest = await CourtScheduleRequest.findOne({ case: caseId });
      if (existingRequest) {
        return { 
          success: false, 
          message: 'Court scheduling has already been requested for this case' 
        };
      }
      
      // Find or create court filing record
      const CourtFiling = require('../Model/CourtFiling');
      let courtFiling = await CourtFiling.findOne({ case: caseId });
      
      if (!courtFiling) {
        // Create a court filing record if it doesn't exist
        courtFiling = new CourtFiling({
          case: caseId,
          lawyer: lawyerId,
          court: {
            name: 'District Court',
            district: caseData.district
          },
          filingType: caseData.caseType,
          status: 'filed',
          filedAt: caseData.courtDetails?.filingDate || new Date(),
          courtReference: caseData.courtDetails?.reference || `REF-${caseData.caseNumber}`
        });
        await courtFiling.save();
        console.log(`✅ Created court filing record for case ${caseId}`);
      }
      
      // Create schedule request
      const scheduleRequest = new CourtScheduleRequest({
        case: caseId,
        courtFiling: courtFiling._id, // Add the required courtFiling reference
        district: caseData.district,
        caseNumber: caseData.caseNumber,
        caseType: caseData.caseType,
        plaintiffName: caseData.plaintiffName,
        defendantName: caseData.defendantName,
        lawyer: lawyerId,
        lawyerName: caseData.currentLawyer?.fullName || 'Assigned Lawyer',
        client: caseData.user,
        clientName: caseData.user?.fullName || 'Client',
        filedDate: caseData.courtDetails?.filingDate || new Date(),
        priority: caseData.caseType === 'urgent' ? 'high' : 'medium',
        isScheduled: false,
        requestMessage: message
      });
      
      await scheduleRequest.save();
      
      // Update case status
      const result = await this.updateCaseStatus(caseId, 'scheduling_requested');
      
      if (!result.success) {
        return result;
      }
      
      console.log(`✅ Court scheduling requested for case ${caseId}`);
      
      return {
        success: true,
        message: 'Court scheduling requested successfully',
        scheduleRequest: scheduleRequest,
        case: result.case
      };
      
    } catch (error) {
      console.error('Error requesting court scheduling:', error);
      return { success: false, message: 'Error requesting court scheduling' };
    }
  }
  
  /**
   * Schedule case hearing with proper validation
   */
  static async scheduleCaseHearing(requestId, hearingDate, startTime, endTime, courtroom, schedulingNotes) {
    try {
      console.log(`📅 Scheduling case hearing for request ${requestId}`);
      
      // Get schedule request
      const scheduleRequest = await CourtScheduleRequest.findById(requestId);
      if (!scheduleRequest) {
        return { success: false, message: 'Schedule request not found' };
      }
      
      if (scheduleRequest.isScheduled) {
        return { success: false, message: 'Case has already been scheduled' };
      }
      
      // Check for conflicts
      const conflictingCase = await ScheduledCase.findOne({
        district: scheduleRequest.district,
        hearingDate: new Date(hearingDate + 'T00:00:00'),
        'hearingTime.startTime': startTime,
        'hearingTime.endTime': endTime
      });
      
      if (conflictingCase) {
        return { success: false, message: 'Time slot is already occupied' };
      }
      
      // Create scheduled case
      const scheduledCase = new ScheduledCase({
        scheduleRequest: requestId,
        case: scheduleRequest.case,
        district: scheduleRequest.district,
        courtroom: courtroom || scheduleRequest.courtroom,
        hearingDate: new Date(hearingDate + 'T00:00:00'),
        hearingTime: { startTime, endTime },
        caseNumber: scheduleRequest.caseNumber,
        caseType: scheduleRequest.caseType,
        plaintiffName: scheduleRequest.plaintiffName,
        defendantName: scheduleRequest.defendantName,
        lawyer: scheduleRequest.lawyer,
        lawyerName: scheduleRequest.lawyerName,
        client: scheduleRequest.client,
        clientName: scheduleRequest.clientName,
        scheduledBy: scheduleRequest.scheduledBy,
        schedulingNotes,
        estimatedDuration: scheduleRequest.estimatedDuration
      });
      
      await scheduledCase.save();
      
      // Update schedule request
      await CourtScheduleRequest.findByIdAndUpdate(requestId, {
        isScheduled: true,
        scheduledDate: new Date(hearingDate),
        scheduledTime: { startTime, endTime },
        scheduledBy: scheduleRequest.scheduledBy,
        schedulingNotes
      });
      
      // Update case status
      const result = await this.updateCaseStatus(scheduleRequest.case, 'hearing_scheduled', {
        hearingDate: new Date(hearingDate + 'T00:00:00'),
        hearingTime: { startTime, endTime },
        courtroom: courtroom || scheduleRequest.courtroom
      });
      
      if (!result.success) {
        return result;
      }
      
      console.log(`✅ Case hearing scheduled for ${hearingDate} at ${startTime}`);
      
      return {
        success: true,
        message: 'Case hearing scheduled successfully',
        scheduledCase: scheduledCase,
        case: result.case
      };
      
    } catch (error) {
      console.error('Error scheduling case hearing:', error);
      return { success: false, message: 'Error scheduling case hearing' };
    }
  }
  
  /**
   * Complete case with proper validation
   */
  static async completeCase(caseId, completionNotes) {
    try {
      console.log(`✅ Completing case ${caseId}`);
      
      // Get case with assignment info
      const caseInfo = await this.getCaseWithAssignment(caseId);
      if (!caseInfo.success) {
        return caseInfo;
      }
      
      const { case: caseData } = caseInfo;
      
      // Validate case status
      if (!['hearing_scheduled', 'rescheduled'].includes(caseData.status)) {
        return { 
          success: false, 
          message: `Case cannot be completed from status: ${caseData.status}` 
        };
      }
      
      // Update case status
      const result = await this.updateCaseStatus(caseId, 'completed', {
        completionNotes,
        completedAt: new Date()
      });
      
      if (!result.success) {
        return result;
      }
      
      // Update assignment status
      await CaseLawyerAssignment.findOneAndUpdate(
        { case: caseId, status: 'active' },
        { status: 'completed', completedAt: new Date() }
      );
      
      console.log(`✅ Case ${caseId} completed successfully`);
      
      return {
        success: true,
        message: 'Case completed successfully',
        case: result.case
      };
      
    } catch (error) {
      console.error('Error completing case:', error);
      return { success: false, message: 'Error completing case' };
    }
  }
  
  /**
   * Get district court name
   */
  static getDistrictCourtName(district) {
    const courtNames = {
      'Colombo': 'Colombo District Court',
      'Gampaha': 'Gampaha District Court',
      'Kalutara': 'Kalutara District Court',
      'Kandy': 'Kandy District Court',
      'Matale': 'Matale District Court',
      'Nuwara Eliya': 'Nuwara Eliya District Court',
      'Galle': 'Galle District Court',
      'Matara': 'Matara District Court',
      'Hambantota': 'Hambantota District Court',
      'Jaffna': 'Jaffna District Court',
      'Kilinochchi': 'Kilinochchi District Court',
      'Mannar': 'Mannar District Court',
      'Vavuniya': 'Vavuniya District Court',
      'Mullaitivu': 'Mullaitivu District Court',
      'Batticaloa': 'Batticaloa District Court',
      'Ampara': 'Ampara District Court',
      'Trincomalee': 'Trincomalee District Court',
      'Kurunegala': 'Kurunegala District Court',
      'Puttalam': 'Puttalam District Court',
      'Anuradhapura': 'Anuradhapura District Court',
      'Polonnaruwa': 'Polonnaruwa District Court',
      'Badulla': 'Badulla District Court',
      'Moneragala': 'Moneragala District Court',
      'Ratnapura': 'Ratnapura District Court',
      'Kegalle': 'Kegalle District Court'
    };
    
    return courtNames[district] || `${district} District Court`;
  }
}

module.exports = CaseFlowService;
