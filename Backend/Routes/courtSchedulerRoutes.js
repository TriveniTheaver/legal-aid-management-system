const express = require('express');
const router = express.Router();
const { auth } = require('../Middleware/auth');
const {
  getUnscheduledRequests,
  getScheduledCases,
  getAvailableTimeSlots,
  scheduleCase,
  getDashboardStats,
  getCalendarData,
  generateSchedulesPDF
} = require('../Controllers/CourtSchedulerController');

// Middleware to check if user is a court scheduler
const checkSchedulerRole = (req, res, next) => {
  console.log('🔍 Checking scheduler role...');
  console.log('User from token:', req.user);
  console.log('User type:', req.user?.userType);
  
  if (req.user.userType !== 'court_scheduler') {
    console.log('❌ Access denied - not a court scheduler');
    return res.status(403).json({
      success: false,
      message: `Access denied. User type '${req.user?.userType}' is not authorized. Only court schedulers can access this resource.`
    });
  }
  
  console.log('✅ Court scheduler access granted');
  next();
};

// Apply protection and role check to all routes
router.use(auth);
router.use(checkSchedulerRole);

// Dashboard routes
router.get('/stats', getDashboardStats);

// Schedule request routes
router.get('/unscheduled-requests', getUnscheduledRequests);
router.get('/scheduled-cases', getScheduledCases);

// Scheduling routes
router.get('/timeslots/available', getAvailableTimeSlots);
router.post('/schedule/:requestId', scheduleCase);

// Calendar routes
router.get('/calendar', getCalendarData);

// PDF generation routes
router.get('/schedules-pdf', generateSchedulesPDF);

// Case tracking routes for court schedulers
router.get('/cases', async (req, res) => {
  try {
    console.log('🔍 Court scheduler requesting all cases...');
    const Case = require('../Model/CaseModel');
    
    const cases = await Case.find()
      .populate('user', 'name email')
      .populate('currentLawyer', 'fullName name email')
      .sort({ createdAt: -1 });
    
    // Format cases for response
    const formattedCases = cases.map(caseItem => ({
      _id: caseItem._id,
      caseNumber: caseItem.caseNumber,
      caseType: caseItem.caseType,
      clientName: caseItem.plaintiffName,
      clientEmail: caseItem.user?.email || 'N/A',
      district: caseItem.district,
      status: caseItem.status,
      courtStatus: caseItem.courtStatus || 'in_hearing',
      createdAt: caseItem.createdAt,
      assignedLawyer: caseItem.currentLawyer ? {
        name: caseItem.currentLawyer.fullName || caseItem.currentLawyer.name,
        email: caseItem.currentLawyer.email
      } : null
    }));

    console.log(`✅ Returning ${formattedCases.length} cases to court scheduler`);
    
    res.json({ 
      success: true,
      data: formattedCases,
      count: formattedCases.length
    });
    
  } catch (error) {
    console.error('❌ Error fetching cases for court scheduler:', error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch cases",
      error: error.message 
    });
  }
});

// Update court status for a case
router.put('/cases/:caseId/court-status', async (req, res) => {
  try {
    const { caseId } = req.params;
    const { courtStatus } = req.body;
    
    console.log(`🏛️ Court scheduler updating court status for case ${caseId} to ${courtStatus}`);
    
    // Validate court status
    const validStatuses = ['in_hearing', 'closed'];
    if (!validStatuses.includes(courtStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid court status. Must be one of: in_hearing, closed'
      });
    }
    
    const Case = require('../Model/CaseModel');
    
    // First, get the case to check if it has hearing scheduled
    const existingCase = await Case.findById(caseId);
    
    if (!existingCase) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }
    
    // Check if case is ready for court proceedings
    const courtReadyStatuses = ['hearing_scheduled', 'filed', 'scheduled'];
    if (!courtReadyStatuses.includes(existingCase.status)) {
      return res.status(400).json({
        success: false,
        message: 'Court status can only be updated for cases that are ready for court proceedings'
      });
    }
    
    // Update the case with court status
    const updatedCase = await Case.findByIdAndUpdate(
      caseId,
      { 
        courtStatus: courtStatus,
        courtStatusUpdatedAt: new Date(),
        courtStatusUpdatedBy: req.user.id
      },
      { new: true }
    );
    
    console.log(`✅ Court status updated to ${courtStatus} for case ${caseId}`);
    
    res.json({
      success: true,
      message: 'Court status updated successfully',
      case: {
        _id: updatedCase._id,
        caseNumber: updatedCase.caseNumber,
        courtStatus: updatedCase.courtStatus
      }
    });
    
  } catch (error) {
    console.error('❌ Error updating court status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update court status',
      error: error.message
    });
  }
});

module.exports = router;
