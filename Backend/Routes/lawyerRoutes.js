const express = require("express");
const Case = require("../Model/CaseModel");
const VerifiedLawyer = require("../Model/VerifiedLawyer");
const VerifiedClient = require("../Model/VerifiedClient");
const CaseLawyerAssignment = require("../Model/CaseLawyerAssignment");
const { protect } = require("../Controllers/UnverifiedAuthController");
const router = express.Router();

// Function to get district court name based on district
const getDistrictCourtName = (district) => {
  const districtCourtMap = {
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
  
  return districtCourtMap[district] || `${district} District Court`;
};

// Get assigned cases for lawyer
router.get("/cases", protect, async (req, res) => {
  try {
    console.log('🔍 LAWYER CASES DEBUG - Fetching cases for lawyer:', req.user.id);
    console.log('👤 User type:', req.user.userType);
    console.log('📧 User email:', req.user.email);
    
    // Check if user is a lawyer
    if (req.user.userType !== 'lawyer' && req.user.userType !== 'verified_lawyer') {
      return res.status(403).json({ message: "Access denied. This endpoint is for lawyers only." });
    }

    // Find cases assigned to this lawyer with detailed logging
    console.log('🔍 Searching for cases with currentLawyer:', req.user.id);
    
    // First, let's see all cases that might be related to this lawyer
    const allCases = await Case.find({})
      .populate('user', 'name fullName email phone')
      .sort({ createdAt: -1 });
    
    console.log(`📊 Total cases in database: ${allCases.length}`);
    
    // Filter and log cases that have this lawyer
    const relatedCases = allCases.filter(caseItem => {
      const hasLawyer = caseItem.currentLawyer && caseItem.currentLawyer.toString() === req.user.id;
      if (hasLawyer) {
        console.log(`✅ Found assigned case: ${caseItem.caseNumber} (${caseItem.status}) - currentLawyer: ${caseItem.currentLawyer}`);
      }
      return hasLawyer;
    });
    
    console.log(`🎯 Cases assigned to this lawyer: ${relatedCases.length}`);
    
    // Also check for cases that might have this lawyer in a different way
    const potentialCases = allCases.filter(caseItem => {
      const isRelated = caseItem.status === 'hearing_scheduled' || 
                       caseItem.status === 'filed' || 
                       caseItem.status === 'lawyer_assigned' ||
                       caseItem.status === 'scheduling_requested';
      if (isRelated) {
        console.log(`🔍 Potential case: ${caseItem.caseNumber} (${caseItem.status}) - currentLawyer: ${caseItem.currentLawyer}`);
      }
      return isRelated;
    });
    
    console.log(`📋 Cases that should have lawyers: ${potentialCases.length}`);

    // Find cases assigned to this lawyer (original query)
    const assignedCases = await Case.find({ currentLawyer: req.user.id })
      .populate('user', 'name fullName email phone')
      .sort({ createdAt: -1 });

    console.log(`✅ Final result: ${assignedCases.length} cases returned to lawyer dashboard`);
    assignedCases.forEach(caseItem => {
      console.log(`   📋 ${caseItem.caseNumber} (${caseItem.status}) - Client: ${caseItem.user?.name || caseItem.user?.fullName}`);
    });

    res.json({ cases: assignedCases });
  } catch (error) {
    console.error("Error fetching lawyer cases:", error);
    res.status(500).json({ message: error.message });
  }
});

// Request additional documents from client
router.post("/request-documents", protect, async (req, res) => {
  try {
    const { caseId, message, reviewNotes } = req.body;
    
    // Check if user is a lawyer
    if (req.user.userType !== 'lawyer' && req.user.userType !== 'verified_lawyer') {
      return res.status(403).json({ message: "Access denied. This endpoint is for lawyers only." });
    }

    // Check if lawyer is assigned to this case
    const caseData = await Case.findOne({ 
      _id: caseId, 
      currentLawyer: req.user.id 
    });

    if (!caseData) {
      return res.status(404).json({ message: "Case not found or you are not assigned to this case." });
    }

    // Update case with document request (preserve currentLawyer)
    const currentCase = await Case.findById(caseId);
    await Case.findByIdAndUpdate(caseId, {
      status: 'under_review',
      lawyerNotes: reviewNotes,
      documentRequest: message,
      documentRequestDate: new Date(),
      // Preserve the currentLawyer field
      currentLawyer: currentCase.currentLawyer
    });

    res.json({ 
      message: "Document request sent to client successfully",
      caseId,
      requestMessage: message
    });
  } catch (error) {
    console.error("Error requesting documents:", error);
    res.status(500).json({ message: error.message });
  }
});

// Mark case as ready to file
router.post("/ready-to-file", protect, async (req, res) => {
  try {
    const { caseId, reviewNotes } = req.body;
    
    // Check if user is a lawyer
    if (req.user.userType !== 'lawyer' && req.user.userType !== 'verified_lawyer') {
      return res.status(403).json({ message: "Access denied. This endpoint is for lawyers only." });
    }

    // Check if lawyer is assigned to this case
    const caseData = await Case.findOne({ 
      _id: caseId, 
      currentLawyer: req.user.id 
    });

    if (!caseData) {
      return res.status(404).json({ message: "Case not found or you are not assigned to this case." });
    }

    // Update case status (preserve currentLawyer)
    const currentCase = await Case.findById(caseId);
    await Case.findByIdAndUpdate(caseId, {
      status: 'approved',
      filingStatus: 'ready_to_file',
      lawyerNotes: reviewNotes,
      readyToFileDate: new Date(),
      // Preserve the currentLawyer field
      currentLawyer: currentCase.currentLawyer
    });

    res.json({ 
      message: "Case marked as ready to file successfully",
      caseId
    });
  } catch (error) {
    console.error("Error marking case ready to file:", error);
    res.status(500).json({ message: error.message });
  }
});

// Submit case filing to court
router.post("/submit-court-filing", protect, async (req, res) => {
  try {
    const { caseId, reviewNotes } = req.body;
    
    // Check if user is a lawyer
    if (req.user.userType !== 'lawyer' && req.user.userType !== 'verified_lawyer') {
      return res.status(403).json({ message: "Access denied. This endpoint is for lawyers only." });
    }

    console.log(`⚖️ Lawyer ${req.user.id} submitting case ${caseId} to court`);
    
    // Use the new case flow service
    const CaseFlowService = require('../services/caseFlowService');
    const result = await CaseFlowService.submitCourtFiling(caseId, req.user.id, reviewNotes);
    
    if (!result.success) {
      return res.status(400).json({ 
        success: false,
        message: result.message 
      });
    }
    
    console.log(`✅ Case filed successfully with reference: ${result.courtReference}`);
    
    res.json({ 
      success: true,
      message: result.message,
      caseId,
      courtReference: result.courtReference,
      filingDate: new Date(),
      nextStep: "Request court scheduling from your dashboard"
    });
  } catch (error) {
    console.error("Error filing case:", error);
    res.status(500).json({ message: error.message });
  }
});

// Request court scheduling for a filed case
router.post("/request-scheduling/:caseId", protect, async (req, res) => {
  try {
    const { caseId } = req.params;
    const { message } = req.body;
    
    console.log(`📅 Lawyer ${req.user.id} requesting court scheduling for case ${caseId}`);
    
    // Use the new case flow service
    const CaseFlowService = require('../services/caseFlowService');
    const result = await CaseFlowService.requestCourtScheduling(caseId, req.user.id, message);
    
    if (!result.success) {
      return res.status(400).json({ 
        success: false,
        message: result.message 
      });
    }
    
    console.log(`✅ Court scheduling requested successfully for case ${caseId}`);
    
    res.json({ 
      success: true,
      message: result.message,
      scheduleRequest: result.scheduleRequest,
      case: result.case
    });
    
  } catch (error) {
    console.error("Error requesting court scheduling:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get case details for lawyer review
router.get("/case/:caseId", protect, async (req, res) => {
  try {
    const { caseId } = req.params;
    
    // Check if user is a lawyer
    if (req.user.userType !== 'lawyer' && req.user.userType !== 'verified_lawyer') {
      return res.status(403).json({ message: "Access denied. This endpoint is for lawyers only." });
    }

    // Find case assigned to this lawyer
    const caseData = await Case.findOne({ 
      _id: caseId, 
      currentLawyer: req.user.id 
    }).populate('user', 'name email phone');

    if (!caseData) {
      return res.status(404).json({ message: "Case not found or you are not assigned to this case." });
    }

    res.json({ case: caseData });
  } catch (error) {
    console.error("Error fetching case details:", error);
    res.status(500).json({ message: error.message });
  }
});

// Generate PDF for lawyer assigned case
router.get("/case/:caseId/generate-pdf", protect, async (req, res) => {
  try {
    const { caseId } = req.params;
    const userId = req.user.id;
    
    console.log(`PDF generation requested by lawyer ${userId} for case ${caseId}`);
    
    // Check if user is a lawyer
    if (req.user.userType !== 'lawyer' && req.user.userType !== 'verified_lawyer') {
      return res.status(403).json({ message: "Access denied. This endpoint is for lawyers only." });
    }

    // Find case assigned to this lawyer
    const caseData = await Case.findOne({ 
      _id: caseId, 
      currentLawyer: userId 
    })
      .populate('user', 'name fullName email phone')
      .populate('currentLawyer', 'name email phone');

    if (!caseData) {
      console.log('Case not found or lawyer not assigned');
      return res.status(404).json({ message: "Case not found or you are not assigned to this case." });
    }
    
    console.log('Case found, generating PDF for lawyer...');
    
    // Use the single text PDF service
    const { generateSingleTextLegalDocument } = require('../services/singleTextPdfService');
    const pdfBuffer = await generateSingleTextLegalDocument(caseData);
    
    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Case_${caseData.caseNumber}_Lawyer.pdf`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    // Send the PDF buffer
    res.send(pdfBuffer);
    console.log('PDF generated and sent successfully to lawyer');
    
  } catch (error) {
    console.error("Error generating PDF for lawyer:", error);
    res.status(500).json({ message: "Failed to generate PDF: " + error.message });
  }
});

// Get lawyer performance data
router.get("/performance", protect, async (req, res) => {
  try {
    const lawyerId = req.user.id;
    
    // Get all ratings for this lawyer
    const Rating = require('../Model/Rating');
    const ratings = await Rating.find({ lawyer: lawyerId })
      .sort({ createdAt: -1 })
      .limit(10); // Get last 10 ratings

    // Get lawyer info
    const VerifiedLawyer = require('../Model/VerifiedLawyer');
    const lawyer = await VerifiedLawyer.findById(lawyerId).select('ratings totalReviews fullName');

    res.status(200).json({
      success: true,
      ratings: ratings,
      lawyerInfo: {
        fullName: lawyer?.fullName,
        currentRating: lawyer?.ratings || 0,
        totalReviews: lawyer?.totalReviews || 0
      }
    });

  } catch (error) {
    console.error("Error fetching lawyer performance:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error while fetching performance data",
      error: error.message 
    });
  }
});

// Test endpoint
router.get("/test", (req, res) => {
  res.json({ message: "Lawyer routes are working!", timestamp: new Date() });
});

// Get accepted cases for lawyer
router.get("/accepted-cases", protect, async (req, res) => {
  try {
    console.log('🔍 ACCEPTED CASES - Fetching accepted cases for lawyer:', req.user.id);
    
    // Check if user is a lawyer
    if (req.user.userType !== 'lawyer' && req.user.userType !== 'verified_lawyer') {
      return res.status(403).json({ message: "Access denied. This endpoint is for lawyers only." });
    }

    // Find cases where this lawyer has accepted the assignment
    const acceptedCases = await Case.find({
      currentLawyer: req.user.id,
      status: { $in: ['lawyer_assigned', 'filed', 'scheduling_requested', 'hearing_scheduled', 'rescheduled', 'completed'] }
    })
    .populate('user', 'name fullName email phone')
    .populate('currentLawyer', 'name fullName email phone')
    .sort({ createdAt: -1 });

    console.log(`✅ Found ${acceptedCases.length} accepted cases for lawyer ${req.user.id}`);

    res.json({
      success: true,
      cases: acceptedCases
    });
  } catch (error) {
    console.error("Error fetching accepted cases:", error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

module.exports = router;
