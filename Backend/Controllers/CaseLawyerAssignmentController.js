const LawyerAssignmentService = require('../services/lawyerAssignmentService');
const Case = require('../Model/CaseModel');
const VerifiedLawyer = require('../Model/VerifiedLawyer');
const VerifiedClient = require('../Model/VerifiedClient');

// Create new lawyer assignment
const createAssignment = async (req, res) => {
  try {
    const { caseId, lawyerId, clientMessage } = req.body;
    const clientId = req.user.id;

    const assignment = await LawyerAssignmentService.createAssignment({
      caseId,
      lawyerId,
      clientId,
      assignmentType: 'manual',
      clientMessage
    });

    res.status(201).json({
      success: true,
      message: 'Lawyer assignment request created successfully',
      assignment
    });
  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Auto-assign lawyer
const autoAssignLawyer = async (req, res) => {
  try {
    const { caseId } = req.body;
    const clientId = req.user.id;

    const result = await LawyerAssignmentService.autoAssignLawyer(caseId, clientId);

    res.status(201).json({
      success: true,
      message: 'Lawyer auto-assignment request created successfully',
      assignment: result.assignment,
      lawyer: {
        _id: result.lawyer._id,
        name: result.lawyer.fullName,
        email: result.lawyer.email,
        specialization: result.lawyer.lawyerType
      }
    });
  } catch (error) {
    console.error('Error in auto-assignment:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Accept assignment (lawyer)
const acceptAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { lawyerResponse } = req.body;
    const lawyerId = req.user.id;

    const assignment = await LawyerAssignmentService.acceptAssignment(
      assignmentId,
      lawyerId,
      lawyerResponse
    );

    res.json({
      success: true,
      message: 'Assignment accepted successfully',
      assignment
    });
  } catch (error) {
    console.error('Error accepting assignment:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Reject assignment (lawyer)
const rejectAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { reason } = req.body;
    const lawyerId = req.user.id;

    const assignment = await CaseLawyerAssignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    if (assignment.lawyer.toString() !== lawyerId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to reject this assignment'
      });
    }

    assignment.status = 'rejected';
    assignment.lawyerResponse = reason;
    await assignment.save();

    // Update case status back to pending
    await Case.findByIdAndUpdate(assignment.case, {
      status: 'pending',
      currentLawyer: null
    });

    res.json({
      success: true,
      message: 'Assignment rejected successfully'
    });
  } catch (error) {
    console.error('Error rejecting assignment:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get active assignment for a case
const getActiveAssignment = async (req, res) => {
  try {
    const { caseId } = req.params;

    const assignment = await LawyerAssignmentService.getActiveAssignment(caseId);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'No active assignment found for this case'
      });
    }

    res.json({
      success: true,
      assignment
    });
  } catch (error) {
    console.error('Error getting active assignment:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get all assignments for a case
const getCaseAssignments = async (req, res) => {
  try {
    const { caseId } = req.params;

    const assignments = await LawyerAssignmentService.getCaseAssignments(caseId);

    res.json({
      success: true,
      assignments
    });
  } catch (error) {
    console.error('Error getting case assignments:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get lawyer's active cases
const getLawyerActiveCases = async (req, res) => {
  try {
    const lawyerId = req.user.id;

    const cases = await LawyerAssignmentService.getLawyerActiveCases(lawyerId);

    res.json({
      success: true,
      cases
    });
  } catch (error) {
    console.error('Error getting lawyer active cases:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get client's assignments
const getClientAssignments = async (req, res) => {
  try {
    const clientId = req.user.id;

    const assignments = await LawyerAssignmentService.getClientAssignments(clientId);

    res.json({
      success: true,
      assignments
    });
  } catch (error) {
    console.error('Error getting client assignments:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update case status (with assignment sync)
const updateCaseStatus = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { status } = req.body;

    // Validate case ownership
    const caseData = await Case.findById(caseId);
    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Check if user has permission to update this case
    if (caseData.user.toString() !== req.user.id && 
        caseData.currentLawyer?.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to update this case'
      });
    }

    await LawyerAssignmentService.updateCaseStatus(caseId, status);

    res.json({
      success: true,
      message: 'Case status updated successfully'
    });
  } catch (error) {
    console.error('Error updating case status:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get assignment statistics (admin only)
const getAssignmentStats = async (req, res) => {
  try {
    const stats = await LawyerAssignmentService.getAssignmentStats();

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error getting assignment stats:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get available lawyers for assignment
const getAvailableLawyers = async (req, res) => {
  try {
    const { caseType } = req.params;
    
    console.log('🔍 DEBUG: getAvailableLawyers called with caseType:', caseType);

    // Map case types to specializations
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

    const specializations = specializationMap[caseType] || ['Civil Litigation'];
    console.log('🎯 DEBUG: Mapped specializations for', caseType, ':', specializations);

    // Find available lawyers (removed isActive since it doesn't exist in schema)
    const query = {
      lawyerType: { $in: specializations },
      availability: true
    };
    console.log('🔍 DEBUG: Query being used:', JSON.stringify(query, null, 2));

    const lawyers = await VerifiedLawyer.find(query)
      .select('fullName email lawyerType ratings totalReviews casesHandled availability')
      .sort({ ratings: -1, totalReviews: -1 });

    console.log('📋 DEBUG: Found', lawyers.length, 'lawyers');
    console.log('👥 DEBUG: Lawyers found:', lawyers.map(l => ({ 
      name: l.fullName, 
      type: l.lawyerType, 
      available: l.availability
    })));

    // Debug: Check if there are ANY Family Law lawyers in the database
    if (caseType === 'familyMatter' || caseType === 'family') {
      const allFamilyLawyers = await VerifiedLawyer.find({ lawyerType: 'Family Law' });
      console.log('🏛️ DEBUG: Total Family Law lawyers in DB:', allFamilyLawyers.length);
      console.log('🏛️ DEBUG: All Family Law lawyers:', allFamilyLawyers.map(l => ({ 
        name: l.fullName, 
        type: l.lawyerType, 
        available: l.availability 
      })));
      
      // Check specifically for available Family Law lawyers
      const availableFamilyLawyers = await VerifiedLawyer.find({ 
        lawyerType: 'Family Law', 
        availability: true 
      });
      console.log('✅ DEBUG: Available Family Law lawyers:', availableFamilyLawyers.length);
      console.log('✅ DEBUG: Available Family Law lawyers details:', availableFamilyLawyers.map(l => ({ 
        name: l.fullName, 
        type: l.lawyerType, 
        available: l.availability 
      })));
    }

    res.json({
      success: true,
      lawyers
    });
  } catch (error) {
    console.error('Error getting available lawyers:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createAssignment,
  autoAssignLawyer,
  acceptAssignment,
  rejectAssignment,
  getActiveAssignment,
  getCaseAssignments,
  getLawyerActiveCases,
  getClientAssignments,
  updateCaseStatus,
  getAssignmentStats,
  getAvailableLawyers
};
