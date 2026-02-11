const express = require("express");
const CaseModel = require("../Model/CaseModel");
const CaseLawyerAssignment = require("../Model/CaseLawyerAssignment");
const CaseFlowService = require("../services/caseFlowService");
const { protect } = require("../Controllers/UnverifiedAuthController");
const router = express.Router();

// Complete a case (for lawyers and admins)
router.post("/complete/:caseId", protect, async (req, res) => {
  try {
    const { caseId } = req.params;
    const { completionNotes } = req.body;
    const userId = req.user.id;
    
    console.log(`✅ Completing case ${caseId} by user ${userId}`);
    
    // Check if user has permission to complete case
    const caseData = await CaseModel.findById(caseId);
    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: "Case not found"
      });
    }
    
    // Check if user is the assigned lawyer or admin
    const isAssignedLawyer = caseData.currentLawyer?.toString() === userId;
    const isAdmin = req.user.userType === 'admin' || req.user.userType === 'staff';
    
    if (!isAssignedLawyer && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only the assigned lawyer or admin can complete this case."
      });
    }
    
    // Use the case flow service to complete the case
    const result = await CaseFlowService.completeCase(caseId, completionNotes);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }
    
    console.log(`✅ Case ${caseId} completed successfully`);
    
    res.json({
      success: true,
      message: result.message,
      case: result.case
    });
    
  } catch (error) {
    console.error("Error completing case:", error);
    res.status(500).json({
      success: false,
      message: "Server error while completing case"
    });
  }
});

// Cancel a case (for clients and admins)
router.post("/cancel/:caseId", protect, async (req, res) => {
  try {
    const { caseId } = req.params;
    const { cancellationReason } = req.body;
    const userId = req.user.id;
    
    console.log(`❌ Cancelling case ${caseId} by user ${userId}`);
    
    // Check if user has permission to cancel case
    const caseData = await CaseModel.findById(caseId);
    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: "Case not found"
      });
    }
    
    // Check if user is the case owner or admin
    const isCaseOwner = caseData.user.toString() === userId;
    const isAdmin = req.user.userType === 'admin' || req.user.userType === 'staff';
    
    if (!isCaseOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only the case owner or admin can cancel this case."
      });
    }
    
    // Check if case can be cancelled
    if (['completed', 'cancelled'].includes(caseData.status)) {
      return res.status(400).json({
        success: false,
        message: `Case cannot be cancelled from status: ${caseData.status}`
      });
    }
    
    // Update case status to cancelled
    const result = await CaseFlowService.updateCaseStatus(caseId, 'cancelled', {
      cancellationReason,
      cancelledAt: new Date(),
      cancelledBy: userId
    });
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }
    
    // Update assignment status if exists
    await CaseLawyerAssignment.findOneAndUpdate(
      { case: caseId, status: { $in: ['accepted', 'active'] } },
      { status: 'withdrawn', withdrawnAt: new Date() }
    );
    
    console.log(`✅ Case ${caseId} cancelled successfully`);
    
    res.json({
      success: true,
      message: "Case cancelled successfully",
      case: result.case
    });
    
  } catch (error) {
    console.error("Error cancelling case:", error);
    res.status(500).json({
      success: false,
      message: "Server error while cancelling case"
    });
  }
});

// Get case status history
router.get("/:caseId/status-history", protect, async (req, res) => {
  try {
    const { caseId } = req.params;
    const userId = req.user.id;
    
    // Get case with assignment info
    const caseInfo = await CaseFlowService.getCaseWithAssignment(caseId);
    if (!caseInfo.success) {
      return res.status(404).json({
        success: false,
        message: caseInfo.message
      });
    }
    
    const { case: caseData, assignment } = caseInfo;
    
    // Check if user has access to this case
    const isCaseOwner = caseData.user.toString() === userId;
    const isAssignedLawyer = caseData.currentLawyer?.toString() === userId;
    const isAdmin = req.user.userType === 'admin' || req.user.userType === 'staff';
    
    if (!isCaseOwner && !isAssignedLawyer && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }
    
    // Get assignment history if exists
    let assignmentHistory = [];
    if (assignment) {
      assignmentHistory = assignment.statusHistory || [];
    }
    
    res.json({
      success: true,
      case: {
        _id: caseData._id,
        caseNumber: caseData.caseNumber,
        status: caseData.status,
        createdAt: caseData.createdAt,
        updatedAt: caseData.updatedAt
      },
      assignment: assignment ? {
        status: assignment.status,
        assignedAt: assignment.assignedAt,
        acceptedAt: assignment.acceptedAt,
        activatedAt: assignment.activatedAt,
        completedAt: assignment.completedAt,
        history: assignmentHistory
      } : null
    });
    
  } catch (error) {
    console.error("Error getting case status history:", error);
    res.status(500).json({
      success: false,
      message: "Server error while getting case status history"
    });
  }
});

module.exports = router;
