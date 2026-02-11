const express = require("express");
const CaseModel = require("../Model/CaseModel");
const CaseLawyerAssignment = require("../Model/CaseLawyerAssignment");
const VerifiedLawyer = require("../Model/VerifiedLawyer");
const VerifiedClient = require("../Model/VerifiedClient");
const CourtScheduleRequest = require("../Model/CourtScheduleRequest");
const ScheduledCase = require("../Model/ScheduledCase");
const { protect } = require("../Controllers/UnverifiedAuthController");
const router = express.Router();

// Get comprehensive client dashboard data
router.get("/dashboard", protect, async (req, res) => {
  try {
    const clientId = req.user.id;
    console.log(`📊 Getting dashboard data for client: ${clientId}`);
    
    // Get all cases for this client
    const cases = await CaseModel.find({ user: clientId })
      .populate('currentLawyer', 'fullName email lawyerType ratings')
      .sort({ createdAt: -1 });
    
    console.log(`📋 Found ${cases.length} cases for client`);
    
    // Get assignments for all cases
    const caseIds = cases.map(c => c._id);
    const assignments = await CaseLawyerAssignment.find({
      case: { $in: caseIds }
    })
    .populate('lawyer', 'fullName email lawyerType ratings')
    .sort({ assignedAt: -1 });
    
    console.log(`📋 Found ${assignments.length} assignments for client cases`);
    
    // Get scheduled hearings
    const scheduledHearings = await ScheduledCase.find({
      client: clientId
    })
    .populate('case', 'caseNumber caseType status')
    .populate('lawyer', 'fullName email')
    .sort({ hearingDate: 1 });
    
    console.log(`📅 Found ${scheduledHearings.length} scheduled hearings`);
    
    // Get schedule requests
    const scheduleRequests = await CourtScheduleRequest.find({
      client: clientId
    })
    .populate('case', 'caseNumber caseType status')
    .populate('lawyer', 'fullName email')
    .sort({ createdAt: -1 });
    
    console.log(`📋 Found ${scheduleRequests.length} schedule requests`);
    
    // Enhance cases with assignment data
    const enhancedCases = cases.map(caseData => {
      // Find assignment for this case
      const assignment = assignments.find(a => a.case.toString() === caseData._id.toString());
      
      // Find scheduled hearing for this case
      const scheduledHearing = scheduledHearings.find(sh => sh.case.toString() === caseData._id.toString());
      
      // Find schedule request for this case
      const scheduleRequest = scheduleRequests.find(sr => sr.case.toString() === caseData._id.toString());
      
      // Get lawyer info from assignment if currentLawyer is missing
      let lawyerInfo = null;
      if (caseData.currentLawyer) {
        lawyerInfo = {
          _id: caseData.currentLawyer._id,
          name: caseData.currentLawyer.fullName,
          email: caseData.currentLawyer.email,
          lawyerType: caseData.currentLawyer.lawyerType,
          ratings: caseData.currentLawyer.ratings
        };
      } else if (assignment && assignment.lawyer) {
        lawyerInfo = {
          _id: assignment.lawyer._id,
          name: assignment.lawyer.fullName,
          email: assignment.lawyer.email,
          lawyerType: assignment.lawyer.lawyerType,
          ratings: assignment.lawyer.ratings
        };
      }
      
      return {
        _id: caseData._id,
        caseNumber: caseData.caseNumber,
        caseType: caseData.caseType,
        status: caseData.status,
        plaintiffName: caseData.plaintiffName,
        defendantName: caseData.defendantName,
        district: caseData.district,
        createdAt: caseData.createdAt,
        updatedAt: caseData.updatedAt,
        currentLawyer: caseData.currentLawyer,
        lawyerInfo: lawyerInfo,
        assignment: assignment ? {
          _id: assignment._id,
          status: assignment.status,
          assignedAt: assignment.assignedAt,
          acceptedAt: assignment.acceptedAt,
          activatedAt: assignment.activatedAt,
          completedAt: assignment.completedAt
        } : null,
        scheduledHearing: scheduledHearing ? {
          _id: scheduledHearing._id,
          hearingDate: scheduledHearing.hearingDate,
          hearingTime: scheduledHearing.hearingTime,
          courtroom: scheduledHearing.courtroom,
          lawyerName: scheduledHearing.lawyerName
        } : null,
        scheduleRequest: scheduleRequest ? {
          _id: scheduleRequest._id,
          isScheduled: scheduleRequest.isScheduled,
          priority: scheduleRequest.priority,
          requestMessage: scheduleRequest.requestMessage
        } : null
      };
    });
    
    // Calculate statistics
    const stats = {
      totalCases: cases.length,
      casesByStatus: {
        pending: cases.filter(c => c.status === 'pending').length,
        verified: cases.filter(c => c.status === 'verified').length,
        lawyer_requested: cases.filter(c => c.status === 'lawyer_requested').length,
        lawyer_assigned: cases.filter(c => c.status === 'lawyer_assigned').length,
        filing_requested: cases.filter(c => c.status === 'filing_requested').length,
        under_review: cases.filter(c => c.status === 'under_review').length,
        approved: cases.filter(c => c.status === 'approved').length,
        filed: cases.filter(c => c.status === 'filed').length,
        scheduling_requested: cases.filter(c => c.status === 'scheduling_requested').length,
        hearing_scheduled: cases.filter(c => c.status === 'hearing_scheduled').length,
        completed: cases.filter(c => c.status === 'completed').length,
        cancelled: cases.filter(c => c.status === 'cancelled').length
      },
      totalAssignments: assignments.length,
      activeAssignments: assignments.filter(a => ['accepted', 'active'].includes(a.status)).length,
      scheduledHearings: scheduledHearings.length,
      scheduleRequests: scheduleRequests.length
    };
    
    console.log(`✅ Dashboard data prepared for client ${clientId}`);
    
    res.json({
      success: true,
      data: {
        cases: enhancedCases,
        stats: stats,
        scheduledHearings: scheduledHearings,
        scheduleRequests: scheduleRequests
      }
    });
    
  } catch (error) {
    console.error('Error getting client dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting dashboard data',
      error: error.message
    });
  }
});

// Get case details with full assignment history
router.get("/case/:caseId", protect, async (req, res) => {
  try {
    const { caseId } = req.params;
    const clientId = req.user.id;
    
    console.log(`📋 Getting case details for case ${caseId} by client ${clientId}`);
    
    // Get case
    const caseData = await CaseModel.findOne({
      _id: caseId,
      user: clientId
    })
    .populate('currentLawyer', 'fullName email lawyerType ratings phone')
    .populate('user', 'fullName email phone');
    
    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found or access denied'
      });
    }
    
    // Get assignment history
    const assignments = await CaseLawyerAssignment.find({
      case: caseId
    })
    .populate('lawyer', 'fullName email lawyerType ratings')
    .sort({ assignedAt: -1 });
    
    // Get scheduled hearing
    const scheduledHearing = await ScheduledCase.findOne({
      case: caseId
    })
    .populate('lawyer', 'fullName email');
    
    // Get schedule request
    const scheduleRequest = await CourtScheduleRequest.findOne({
      case: caseId
    })
    .populate('lawyer', 'fullName email');
    
    // Get current assignment
    const currentAssignment = assignments.find(a => 
      ['accepted', 'active', 'completed'].includes(a.status)
    );
    
    res.json({
      success: true,
      data: {
        case: caseData,
        assignments: assignments,
        currentAssignment: currentAssignment,
        scheduledHearing: scheduledHearing,
        scheduleRequest: scheduleRequest
      }
    });
    
  } catch (error) {
    console.error('Error getting case details:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting case details',
      error: error.message
    });
  }
});

// Get client statistics
router.get("/stats", protect, async (req, res) => {
  try {
    const clientId = req.user.id;
    
    // Get comprehensive statistics
    const [
      totalCases,
      casesByStatus,
      totalAssignments,
      activeAssignments,
      scheduledHearings,
      completedCases
    ] = await Promise.all([
      CaseModel.countDocuments({ user: clientId }),
      CaseModel.aggregate([
        { $match: { user: mongoose.Types.ObjectId(clientId) } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      CaseLawyerAssignment.countDocuments({ client: clientId }),
      CaseLawyerAssignment.countDocuments({ 
        client: clientId, 
        status: { $in: ['accepted', 'active'] } 
      }),
      ScheduledCase.countDocuments({ client: clientId }),
      CaseModel.countDocuments({ 
        user: clientId, 
        status: 'completed' 
      })
    ]);
    
    res.json({
      success: true,
      stats: {
        totalCases,
        casesByStatus: casesByStatus.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        totalAssignments,
        activeAssignments,
        scheduledHearings,
        completedCases
      }
    });
    
  } catch (error) {
    console.error('Error getting client stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting client statistics',
      error: error.message
    });
  }
});

module.exports = router;
