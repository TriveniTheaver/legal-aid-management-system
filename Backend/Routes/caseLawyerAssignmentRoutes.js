const express = require('express');
const router = express.Router();
const { auth } = require('../Middleware/auth');
const CaseLawyerAssignmentController = require('../Controllers/CaseLawyerAssignmentController');

// Middleware to check if user is a verified client
const checkClientRole = (req, res, next) => {
  if (req.user.userType !== 'verified_client') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only verified clients can access this resource.'
    });
  }
  next();
};

// Middleware to check if user is a verified lawyer
const checkLawyerRole = (req, res, next) => {
  if (req.user.userType !== 'verified_lawyer') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only verified lawyers can access this resource.'
    });
  }
  next();
};

// Middleware to check if user is admin or court scheduler
const checkAdminRole = (req, res, next) => {
  if (!['admin', 'court_scheduler'].includes(req.user.userType)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin or court scheduler access required.'
    });
  }
  next();
};

// Client routes
router.post('/create', auth, checkClientRole, CaseLawyerAssignmentController.createAssignment);
router.post('/auto-assign', auth, checkClientRole, CaseLawyerAssignmentController.autoAssignLawyer);
router.get('/client-assignments', auth, checkClientRole, CaseLawyerAssignmentController.getClientAssignments);
router.get('/case/:caseId/assignments', auth, checkClientRole, CaseLawyerAssignmentController.getCaseAssignments);
router.get('/case/:caseId/active', auth, checkClientRole, CaseLawyerAssignmentController.getActiveAssignment);
router.put('/case/:caseId/status', auth, checkClientRole, CaseLawyerAssignmentController.updateCaseStatus);

// Lawyer routes
router.put('/:assignmentId/accept', auth, checkLawyerRole, CaseLawyerAssignmentController.acceptAssignment);
router.put('/:assignmentId/reject', auth, checkLawyerRole, CaseLawyerAssignmentController.rejectAssignment);
router.get('/lawyer/active-cases', auth, checkLawyerRole, CaseLawyerAssignmentController.getLawyerActiveCases);

// Public routes (for getting available lawyers)
router.get('/available-lawyers/:caseType', CaseLawyerAssignmentController.getAvailableLawyers);

// Admin routes
router.get('/stats', auth, checkAdminRole, CaseLawyerAssignmentController.getAssignmentStats);

module.exports = router;
