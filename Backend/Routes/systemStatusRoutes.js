const express = require("express");
const CaseModel = require("../Model/CaseModel");
const CaseLawyerAssignment = require("../Model/CaseLawyerAssignment");
const VerifiedLawyer = require("../Model/VerifiedLawyer");
const VerifiedClient = require("../Model/VerifiedClient");
const CourtScheduleRequest = require("../Model/CourtScheduleRequest");
const ScheduledCase = require("../Model/ScheduledCase");
const Rating = require("../Model/Rating");
const { protect } = require("../Controllers/UnverifiedAuthController");
const router = express.Router();

// Get comprehensive system status
router.get("/status", protect, async (req, res) => {
  try {
    console.log("📊 Generating comprehensive system status...");
    
    // Get case statistics
    const caseStats = await CaseModel.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get assignment statistics
    const assignmentStats = await CaseLawyerAssignment.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get lawyer statistics
    const lawyerStats = await VerifiedLawyer.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          averageRating: { $avg: "$ratings" },
          totalReviews: { $sum: "$totalReviews" }
        }
      }
    ]);
    
    // Get client statistics
    const clientStats = await VerifiedClient.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 }
        }
      }
    ]);
    
    // Get scheduling statistics
    const schedulingStats = await CourtScheduleRequest.aggregate([
      {
        $group: {
          _id: "$isScheduled",
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get rating statistics
    const ratingStats = await Rating.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          averageRating: { $avg: "$rating" }
        }
      }
    ]);
    
    // Get cases with missing lawyer assignments
    const casesWithoutLawyer = await CaseModel.find({
      status: { $in: ['lawyer_assigned', 'filing_requested', 'under_review', 'approved', 'filed', 'scheduling_requested', 'hearing_scheduled'] },
      currentLawyer: { $exists: false }
    }).select('caseNumber status createdAt');
    
    // Get cases with inconsistent status
    const inconsistentCases = await CaseModel.find({
      $or: [
        { status: 'hearing_scheduled', hearingDate: { $exists: false } },
        { status: 'filed', 'courtDetails.filingDate': { $exists: false } },
        { status: 'lawyer_assigned', currentLawyer: { $exists: false } }
      ]
    }).select('caseNumber status currentLawyer hearingDate courtDetails');
    
    // Get assignment issues
    const assignmentIssues = await CaseLawyerAssignment.find({
      status: 'accepted',
      case: { $exists: true }
    }).populate('case', 'caseNumber status currentLawyer');
    
    const inconsistentAssignments = assignmentIssues.filter(assignment => {
      return assignment.case && assignment.case.currentLawyer?.toString() !== assignment.lawyer.toString();
    });
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      system: {
        cases: {
          total: caseStats.reduce((sum, stat) => sum + stat.count, 0),
          byStatus: caseStats.reduce((acc, stat) => {
            acc[stat._id] = stat.count;
            return acc;
          }, {})
        },
        assignments: {
          total: assignmentStats.reduce((sum, stat) => sum + stat.count, 0),
          byStatus: assignmentStats.reduce((acc, stat) => {
            acc[stat._id] = stat.count;
            return acc;
          }, {})
        },
        lawyers: {
          total: lawyerStats[0]?.total || 0,
          averageRating: lawyerStats[0]?.averageRating || 0,
          totalReviews: lawyerStats[0]?.totalReviews || 0
        },
        clients: {
          total: clientStats[0]?.total || 0
        },
        scheduling: {
          total: schedulingStats.reduce((sum, stat) => sum + stat.count, 0),
          scheduled: schedulingStats.find(stat => stat._id === true)?.count || 0,
          pending: schedulingStats.find(stat => stat._id === false)?.count || 0
        },
        ratings: {
          total: ratingStats[0]?.total || 0,
          averageRating: ratingStats[0]?.averageRating || 0
        }
      },
      issues: {
        casesWithoutLawyer: {
          count: casesWithoutLawyer.length,
          cases: casesWithoutLawyer.map(c => ({
            caseNumber: c.caseNumber,
            status: c.status,
            createdAt: c.createdAt
          }))
        },
        inconsistentCases: {
          count: inconsistentCases.length,
          cases: inconsistentCases.map(c => ({
            caseNumber: c.caseNumber,
            status: c.status,
            currentLawyer: c.currentLawyer,
            hearingDate: c.hearingDate,
            courtDetails: c.courtDetails
          }))
        },
        inconsistentAssignments: {
          count: inconsistentAssignments.length,
          assignments: inconsistentAssignments.map(a => ({
            assignmentId: a._id,
            lawyer: a.lawyer,
            caseNumber: a.case?.caseNumber,
            caseStatus: a.case?.status,
            caseCurrentLawyer: a.case?.currentLawyer
          }))
        }
      },
      health: {
        overall: casesWithoutLawyer.length === 0 && inconsistentCases.length === 0 && inconsistentAssignments.length === 0 ? 'healthy' : 'issues_detected',
        caseFlow: casesWithoutLawyer.length === 0 ? 'healthy' : 'issues_detected',
        lawyerAssignments: inconsistentAssignments.length === 0 ? 'healthy' : 'issues_detected',
        statusConsistency: inconsistentCases.length === 0 ? 'healthy' : 'issues_detected'
      }
    });
    
  } catch (error) {
    console.error("Error getting system status:", error);
    res.status(500).json({
      success: false,
      message: "Server error while getting system status"
    });
  }
});

// Fix system issues automatically
router.post("/fix-issues", protect, async (req, res) => {
  try {
    console.log("🔧 Starting automatic system fixes...");
    
    const fixes = [];
    
    // Fix cases without lawyer assignments
    const casesWithoutLawyer = await CaseModel.find({
      status: { $in: ['lawyer_assigned', 'filing_requested', 'under_review', 'approved', 'filed', 'scheduling_requested', 'hearing_scheduled'] },
      currentLawyer: { $exists: false }
    });
    
    for (const caseData of casesWithoutLawyer) {
      try {
        const assignment = await CaseLawyerAssignment.findOne({
          case: caseData._id,
          status: { $in: ['accepted', 'active', 'completed'] }
        });
        
        if (assignment) {
          await CaseModel.findByIdAndUpdate(caseData._id, {
            currentLawyer: assignment.lawyer
          });
          fixes.push(`Fixed currentLawyer for case ${caseData.caseNumber}`);
        }
      } catch (error) {
        console.error(`Error fixing case ${caseData.caseNumber}:`, error);
      }
    }
    
    // Fix inconsistent assignments
    const inconsistentAssignments = await CaseLawyerAssignment.find({
      status: 'accepted'
    }).populate('case');
    
    for (const assignment of inconsistentAssignments) {
      if (assignment.case && assignment.case.currentLawyer?.toString() !== assignment.lawyer.toString()) {
        try {
          await CaseModel.findByIdAndUpdate(assignment.case._id, {
            currentLawyer: assignment.lawyer
          });
          fixes.push(`Fixed case ${assignment.case.caseNumber} currentLawyer to match assignment`);
        } catch (error) {
          console.error(`Error fixing assignment for case ${assignment.case.caseNumber}:`, error);
        }
      }
    }
    
    console.log(`✅ Completed ${fixes.length} automatic fixes`);
    
    res.json({
      success: true,
      message: `Completed ${fixes.length} automatic fixes`,
      fixes: fixes
    });
    
  } catch (error) {
    console.error("Error fixing system issues:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fixing system issues"
    });
  }
});

module.exports = router;
