const express = require("express");
const Case = require("../Model/CaseModel");
const VerifiedLawyer = require("../Model/VerifiedLawyer");
const VerifiedClient = require("../Model/VerifiedClient");
const CaseLawyerAssignment = require("../Model/CaseLawyerAssignment");
const { protect } = require("../Controllers/UnverifiedAuthController");
const router = express.Router();

// Get available lawyers for a case type
router.get("/available/:caseType", protect, async (req, res) => {
  try {
    console.log("Getting available lawyers for case type:", req.params.caseType);
    
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
    
    const specializations = specializationMap[req.params.caseType] || ['Civil Litigation'];
    console.log("Looking for lawyers with specializations:", specializations);
    
    // Find lawyers with matching specialization
    let lawyers = await VerifiedLawyer.find({
      lawyerType: { $in: specializations },
      availability: true
    }).select('fullName email lawyerType passoutYear ratings casesHandled lawyerId');
    
    // If no specialized lawyers found, get general practice lawyers
    if (lawyers.length === 0) {
      console.log("No specialized lawyers found, getting general practice lawyers");
      lawyers = await VerifiedLawyer.find({
        availability: true,
        isActive: true
      }).select('fullName email lawyerType passoutYear ratings casesHandled lawyerId');
    }
    
    console.log(`Total lawyers found: ${lawyers.length}`);
    
    // Ensure lawyers is always an array
    if (!Array.isArray(lawyers)) {
      lawyers = [];
    }
    
    // Normalize lawyer data structure for frontend compatibility
    const normalizedLawyers = lawyers.map(lawyer => ({
      _id: lawyer._id,
      name: lawyer.fullName,
      email: lawyer.email,
      specialization: lawyer.lawyerType,
      yearsExperience: new Date().getFullYear() - lawyer.passoutYear,
      rating: lawyer.ratings || 0,
      casesHandled: lawyer.casesHandled || 0,
      lawyerId: lawyer.lawyerId
    }));
    
    res.json({
      success: true,
      lawyers: normalizedLawyers,
      count: normalizedLawyers.length
    });
    
  } catch (error) {
    console.error("Error getting available lawyers:", error);
    res.status(500).json({ 
      success: false,
      message: error.message,
      lawyers: [],
      count: 0
    });
  }
});

// Test endpoint to verify API response format
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "API is working",
    lawyers: [],
    count: 0
  });
});

// Debug endpoint to see all assignments
router.get("/debug/all-assignments", protect, async (req, res) => {
  try {
    const allAssignments = await CaseLawyerAssignment.find({})
      .populate('case', 'caseNumber caseType plaintiffName defendantName district status')
      .populate('client', 'fullName email phoneNumber')
      .populate('lawyer', 'fullName email lawyerType')
      .sort({ assignedAt: -1 });
    
    console.log(`🔍 DEBUG: Found ${allAssignments.length} total assignments in system`);
    
    res.json({
      success: true,
      assignments: allAssignments,
      count: allAssignments.length
    });
    
  } catch (error) {
    console.error("Error fetching all assignments:", error);
    res.status(500).json({ 
      success: false,
      message: error.message,
      assignments: [],
      count: 0
    });
  }
});

// Debug endpoint to check system data
router.get("/debug/system-data", async (req, res) => {
  try {
    const Case = require('../Model/CaseModel');
    const VerifiedLawyer = require('../Model/VerifiedLawyer');
    const VerifiedClient = require('../Model/VerifiedClient');
    
    const cases = await Case.find({}).limit(5);
    const lawyers = await VerifiedLawyer.find({}).limit(5);
    const clients = await VerifiedClient.find({}).limit(5);
    const assignments = await CaseLawyerAssignment.find({}).limit(5);
    
    res.json({
      success: true,
      data: {
        cases: cases.length,
        lawyers: lawyers.length,
        clients: clients.length,
        assignments: assignments.length,
        sampleCases: cases.map(c => ({ id: c._id, caseNumber: c.caseNumber, status: c.status })),
        sampleLawyers: lawyers.map(l => ({ id: l._id, name: l.fullName, availability: l.availability })),
        sampleAssignments: assignments.map(a => ({ id: a._id, status: a.status, case: a.case, lawyer: a.lawyer }))
      }
    });
    
  } catch (error) {
    console.error("Error fetching system data:", error);
    res.status(500).json({ 
      success: false,
      message: error.message
    });
  }
});

// Get pending assignments for a lawyer
router.get("/pending", protect, async (req, res) => {
  try {
    const lawyerId = req.user.id;
    console.log(`🔍 Fetching pending assignments for lawyer: ${lawyerId}`);
    
    const assignments = await CaseLawyerAssignment.find({
      lawyer: lawyerId,
      status: 'pending'
    })
    .populate('case', 'caseNumber caseType plaintiffName defendantName district status')
    .populate('client', 'fullName email phoneNumber')
    .sort({ assignedAt: -1 });
    
    console.log(`📝 Found ${assignments.length} pending assignments for lawyer ${lawyerId}`);
    console.log('Assignment details:', assignments.map(a => ({
      id: a._id,
      case: a.case?.caseNumber,
      status: a.status,
      assignedAt: a.assignedAt
    })));
    
    res.json({
      success: true,
      assignments: assignments,
      count: assignments.length
    });
    
  } catch (error) {
    console.error("Error fetching pending assignments:", error);
    res.status(500).json({ 
      success: false,
      message: error.message,
      assignments: [],
      count: 0
    });
  }
});

// Get cases to file for a lawyer
router.get("/cases-to-file", protect, async (req, res) => {
  try {
    const lawyerId = req.user.id;
    console.log(`🔍 Fetching cases to file for lawyer: ${lawyerId}`);
    
    const assignments = await CaseLawyerAssignment.find({
      lawyer: lawyerId,
      status: { $in: ['accepted', 'active'] }
    })
    .populate('case', 'caseNumber caseType plaintiffName defendantName district status filingRequested filingRequestDate')
    .populate('client', 'fullName email phoneNumber')
    .populate('lawyer', 'fullName email lawyerType')
    .sort({ assignedAt: -1 });
    
    // Filter cases that need filing - cases where client has requested filing and status is filing_requested
    const casesToFile = assignments.filter(assignment => 
      assignment.case && 
      assignment.case.filingRequested && 
      assignment.case.status === 'filing_requested'
    );
    
    console.log(`🔍 Cases to file filter results:`);
    console.log(`  Total assignments: ${assignments.length}`);
    console.log(`  Cases with filingRequested: ${assignments.filter(a => a.case?.filingRequested).length}`);
    console.log(`  Cases with filing_requested status: ${assignments.filter(a => a.case && a.case.status === 'filing_requested').length}`);
    console.log(`  Final cases to file: ${casesToFile.length}`);
    
    // Debug: Show actual case IDs being returned
    console.log(`🔍 Case IDs being returned:`);
    casesToFile.forEach((assignment, index) => {
      console.log(`  Case ${index + 1}: ID=${assignment.case?._id}, Number=${assignment.case?.caseNumber}, Status=${assignment.case?.status}`);
    });
    
    // Debug: Also show what cases actually exist in database
    const CaseModel = require('../Model/CaseModel');
    const actualCases = await CaseModel.find({}).select('_id caseNumber status').limit(5);
    console.log(`🔍 Actual cases in database:`, actualCases.map(c => ({ id: c._id, number: c.caseNumber, status: c.status })));
    
    // Debug: Show assignment data to identify the mismatch
    console.log(`🔍 Assignment data analysis:`);
    assignments.forEach((assignment, index) => {
      console.log(`  Assignment ${index + 1}: Case ID=${assignment.case?._id}, Status=${assignment.status}`);
    });
    
    // Debug: Show what cases are being returned to frontend
    console.log(`🔍 Cases being returned to frontend:`);
    casesToFile.forEach((assignment, index) => {
      console.log(`  Frontend Case ${index + 1}: ID=${assignment.case?._id}, Number=${assignment.case?.caseNumber}`);
    });
    
    console.log(`📝 Found ${casesToFile.length} cases to file`);
    
    // Fix: Ensure we return the correct case ID, not assignment ID
    const fixedCases = casesToFile.map(assignment => ({
      ...assignment.toObject(),
      _id: assignment.case._id, // Use case ID, not assignment ID
      caseId: assignment.case._id, // Add explicit caseId field
      caseNumber: assignment.case.caseNumber,
      status: assignment.case.status,
      plaintiffName: assignment.case.plaintiffName,
      defendantName: assignment.case.defendantName,
      district: assignment.case.district,
      filingRequested: assignment.case.filingRequested,
      filingRequestDate: assignment.case.filingRequestDate,
      // Add client data for frontend
      user: assignment.client,
      clientName: assignment.client?.fullName || assignment.client?.name,
      client: assignment.client
    }));
    
    console.log(`🔧 Fixed cases for frontend:`);
    fixedCases.forEach((caseData, index) => {
      console.log(`  Fixed Case ${index + 1}: ID=${caseData._id}, Number=${caseData.caseNumber}`);
    });
    
    res.json({
      success: true,
      cases: fixedCases,
      count: fixedCases.length
    });
    
  } catch (error) {
    console.error("Error fetching cases to file:", error);
    res.status(500).json({ 
      success: false,
      message: error.message,
      cases: [],
      count: 0
    });
  }
});

// Get filed cases for a lawyer
router.get("/filed-cases", protect, async (req, res) => {
  try {
    const lawyerId = req.user.id;
    console.log(`🔍 Fetching filed cases for lawyer: ${lawyerId}`);
    
    const assignments = await CaseLawyerAssignment.find({
      lawyer: lawyerId,
      status: { $in: ['active', 'completed'] }
    })
    .populate('case', 'caseNumber caseType plaintiffName defendantName district status filedAt courtReference')
    .populate('client', 'fullName email phoneNumber')
    .populate('lawyer', 'fullName email lawyerType')
    .sort({ assignedAt: -1 });
    
    // Filter cases that are filed (but not scheduling_requested)
    const filedCases = assignments.filter(assignment => 
      assignment.case && 
      assignment.case.status === 'filed'
    );
    
    console.log(`📝 Found ${filedCases.length} filed cases`);
    
    // Fix: Ensure we return the correct case ID, not assignment ID
    const fixedFiledCases = filedCases.map(assignment => ({
      ...assignment.toObject(),
      _id: assignment.case._id, // Use case ID, not assignment ID
      caseId: assignment.case._id, // Add explicit caseId field
      caseNumber: assignment.case.caseNumber,
      status: assignment.case.status,
      plaintiffName: assignment.case.plaintiffName,
      defendantName: assignment.case.defendantName,
      district: assignment.case.district,
      filedAt: assignment.case.filedAt,
      courtReference: assignment.case.courtReference,
      // Add client data for frontend
      user: assignment.client,
      clientName: assignment.client?.fullName || assignment.client?.name,
      client: assignment.client
    }));
    
    res.json({
      success: true,
      cases: fixedFiledCases,
      count: fixedFiledCases.length
    });
    
  } catch (error) {
    console.error("Error fetching filed cases:", error);
    res.status(500).json({ 
      success: false,
      message: error.message,
      cases: [],
      count: 0
    });
  }
});

// Get scheduled cases for a lawyer
router.get("/scheduled-cases", protect, async (req, res) => {
  try {
    const lawyerId = req.user.id;
    console.log(`🔍 Fetching scheduled cases for lawyer: ${lawyerId}`);
    
    const assignments = await CaseLawyerAssignment.find({
      lawyer: lawyerId,
      status: { $in: ['active', 'completed'] }
    })
    .populate('case', 'caseNumber caseType plaintiffName defendantName district status hearingDate hearingTime courtroom')
    .populate('client', 'fullName email phoneNumber')
    .populate('lawyer', 'fullName email lawyerType')
    .sort({ assignedAt: -1 });
    
    // Filter cases that are scheduled
    const scheduledCases = assignments.filter(assignment => 
      assignment.case && 
      (assignment.case.status.includes('scheduled') || assignment.case.hearingDate)
    );
    
    console.log(`📝 Found ${scheduledCases.length} scheduled cases`);
    
    // Fix: Ensure we return the correct case ID, not assignment ID
    const fixedScheduledCases = scheduledCases.map(assignment => ({
      ...assignment.toObject(),
      _id: assignment.case._id, // Use case ID, not assignment ID
      caseId: assignment.case._id, // Add explicit caseId field
      caseNumber: assignment.case.caseNumber,
      status: assignment.case.status,
      plaintiffName: assignment.case.plaintiffName,
      defendantName: assignment.case.defendantName,
      district: assignment.case.district,
      hearingDate: assignment.case.hearingDate,
      hearingTime: assignment.case.hearingTime,
      courtroom: assignment.case.courtroom,
      // Add client data for frontend
      user: assignment.client,
      clientName: assignment.client?.fullName || assignment.client?.name,
      client: assignment.client
    }));
    
    res.json({
      success: true,
      cases: fixedScheduledCases,
      count: fixedScheduledCases.length
    });
    
  } catch (error) {
    console.error("Error fetching scheduled cases:", error);
    res.status(500).json({ 
      success: false,
      message: error.message,
      cases: [],
      count: 0
    });
  }
});

// Auto-assign lawyer to case using NEW system
router.post("/auto-assign", protect, async (req, res) => {
  try {
    console.log("Auto-assign request received:", req.body);
    const { caseId } = req.body;
    
    // Get case details
    const caseData = await Case.findById(caseId);
    if (!caseData) {
      console.log("Case not found:", caseId);
      return res.status(404).json({ message: "Case not found" });
    }
    
    console.log("Case found:", caseData.caseNumber, "Type:", caseData.caseType);
    
    // Check if case already has a currentLawyer assigned and case is in active state
    // Only block if the case is in a state where lawyer change is not allowed
    if (caseData.currentLawyer && ['filed', 'scheduling_requested', 'hearing_scheduled', 'closed'].includes(caseData.status)) {
      console.log(`Case ${caseData.caseNumber} already has an active lawyer assigned and is in state: ${caseData.status}`);
      return res.status(400).json({ 
        message: "Case already has an active lawyer assigned and cannot be reassigned in current state",
        currentLawyer: caseData.currentLawyer,
        status: caseData.status
      });
    }
    
    // If case has a currentLawyer but is in a state that allows reassignment, proceed with auto-assignment
    if (caseData.currentLawyer && ['lawyer_assigned', 'filing_requested'].includes(caseData.status)) {
      console.log(`Case ${caseData.caseNumber} has current lawyer but allows reassignment. Current status: ${caseData.status}`);
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
    console.log("Looking for lawyers with specializations:", specializations);
    
    // Find best available lawyer for this case type
    let lawyer = await VerifiedLawyer.findOne({
      lawyerType: { $in: specializations },
      availability: true
    }).sort({ ratings: -1, passoutYear: 1 });
    
    if (!lawyer) {
      console.log("No specialized lawyer found, getting general practice lawyer");
      lawyer = await VerifiedLawyer.findOne({
        availability: true
      }).sort({ ratings: -1, passoutYear: 1 });
    }
    
    if (!lawyer) {
      console.log("No available lawyers found");
      return res.status(404).json({ message: "No available lawyers found" });
    }
    
    console.log("Selected lawyer:", lawyer.fullName, "Specialization:", lawyer.lawyerType);
    
    // Auto-assignment always goes to the highest-rated lawyer, regardless of existing assignments
    console.log(`Auto-assigning to highest-rated lawyer: ${lawyer.fullName} (Rating: ${lawyer.ratings})`);
    
    // Reject any existing pending assignments with other lawyers
    await CaseLawyerAssignment.updateMany(
      { 
        case: caseId, 
        status: { $in: ['pending', 'active'] },
        lawyer: { $ne: lawyer._id }
      },
      { 
        status: 'rejected',
        rejectionReason: 'Replaced by auto-assignment'
      }
    );
    
    // Create new assignment using CaseLawyerAssignment
    const assignment = new CaseLawyerAssignment({
      case: caseId,
      lawyer: lawyer._id,
      client: caseData.user,
      assignmentType: 'auto',
      status: 'pending',
      clientMessage: 'Auto-assigned by system',
      caseStatusWhenAssigned: caseData.status
    });
    
    await assignment.save();
    console.log(`✅ Assignment created successfully: ${assignment._id} for lawyer: ${lawyer.fullName}`);
    
    // Update case status to lawyer_requested (don't set currentLawyer until accepted)
    // If case was in 'filing_requested' state, keep it there as the new lawyer needs to file
    const newStatus = caseData.status === 'filing_requested' ? 'filing_requested' : 'lawyer_requested';
    
    await Case.findByIdAndUpdate(caseId, { 
      status: newStatus,
      currentLawyer: null // Don't set until accepted
    });
    
    console.log("Auto-assignment created successfully:", assignment._id);
    console.log("Returning response with lawyer:", lawyer.fullName);
    
    res.json({ 
      success: true,
      message: "Lawyer auto-assigned successfully",
      assignment: {
        _id: assignment._id,
        lawyer: {
          _id: lawyer._id,
          name: lawyer.fullName,
          email: lawyer.email,
          specialization: lawyer.lawyerType,
          rating: lawyer.ratings
        },
        status: assignment.status,
        assignedAt: assignment.assignedAt
      },
      // Also include lawyer at root level for backward compatibility
      lawyer: {
        _id: lawyer._id,
        name: lawyer.fullName,
        email: lawyer.email,
        specialization: lawyer.lawyerType,
        rating: lawyer.ratings
      }
    });
    
  } catch (error) {
    console.error("Error auto-assigning lawyer:", error);
    res.status(500).json({ message: error.message });
  }
});

// Client requests specific lawyer using NEW system
router.post("/request", protect, async (req, res) => {
  try {
    console.log("Lawyer request received:", req.body);
    const { caseId, lawyerId, message } = req.body;
    
    // Check if client owns the case
    const caseData = await Case.findOne({ _id: caseId, user: req.user.id });
    if (!caseData) {
      return res.status(404).json({ message: "Case not found or access denied" });
    }
    
    // Check if lawyer exists and is available
    const lawyer = await VerifiedLawyer.findOne({
      _id: lawyerId,
      availability: true,
      isActive: true
    });
    
    if (!lawyer) {
      return res.status(404).json({ message: "Lawyer not available" });
    }
    
    // Check if there's already a pending assignment for this case with the same lawyer
    const existingAssignment = await CaseLawyerAssignment.findOne({ 
      case: caseId, 
      lawyer: lawyerId,
      status: { $in: ['pending', 'accepted', 'active'] } 
    });
    
    if (existingAssignment) {
      return res.status(400).json({ 
        message: "You have already been assigned to this case",
        assignment: existingAssignment
      });
    }
    
    // Check if there's already a pending assignment for this case with another lawyer
    const otherAssignment = await CaseLawyerAssignment.findOne({ 
      case: caseId, 
      lawyer: { $ne: lawyerId },
      status: { $in: ['pending', 'accepted', 'active'] } 
    });
    
    if (otherAssignment) {
      return res.status(400).json({ 
        message: "Case already has a pending or active lawyer assignment with another lawyer",
        assignment: otherAssignment
      });
    }
    
    // Create assignment request using CaseLawyerAssignment
    const assignment = new CaseLawyerAssignment({
      case: caseId,
      lawyer: lawyerId,
      client: req.user.id,
      assignmentType: 'manual',
      status: 'pending',
      clientMessage: message,
      caseStatusWhenAssigned: caseData.status
    });
    
    await assignment.save();
    
    // Update case status to show lawyer request is pending (don't set currentLawyer yet)
    await Case.findByIdAndUpdate(caseId, { 
      status: 'lawyer_requested',
      currentLawyer: null // Don't set until accepted
    });
    
    console.log("Lawyer request created successfully:", assignment._id);
    
    res.json({ 
      success: true,
      message: "Lawyer request sent successfully",
      assignment: {
        _id: assignment._id,
        lawyer: {
          _id: lawyer._id,
          name: lawyer.fullName,
          email: lawyer.email,
          specialization: lawyer.lawyerType,
          rating: lawyer.ratings
        },
        status: assignment.status,
        assignedAt: assignment.assignedAt
      }
    });
    
  } catch (error) {
    console.error("Error creating lawyer request:", error);
    res.status(500).json({ message: error.message });
  }
});

// Lawyer accepts assignment using NEW system
router.put("/accept/:assignmentId", protect, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { response } = req.body;
    
    // Check if user is a lawyer
    if (req.user.userType !== 'lawyer' && req.user.userType !== 'verified_lawyer') {
      return res.status(403).json({ message: "Access denied. This endpoint is for lawyers only." });
    }
    
    // Find assignment
    const assignment = await CaseLawyerAssignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }
    
    // Check if lawyer is assigned to this assignment
    if (assignment.lawyer.toString() !== req.user.id) {
      return res.status(403).json({ message: "You are not assigned to this case" });
    }
    
    // Check if assignment is still pending
    if (assignment.status !== 'pending') {
      return res.status(400).json({ message: "Assignment is not pending" });
    }
    
    // Update assignment status
    assignment.status = 'accepted';
    assignment.acceptedAt = new Date();
    assignment.lawyerResponse = response;
    assignment.caseStatusWhenAccepted = 'lawyer_assigned';
    
    await assignment.save();
    
    // Update case status and set currentLawyer
    await Case.findByIdAndUpdate(assignment.case, {
      status: 'lawyer_assigned',
      currentLawyer: assignment.lawyer
    });
    
    console.log(`Assignment ${assignmentId} accepted by lawyer ${req.user.id}`);
    
    res.json({
      success: true,
      message: "Assignment accepted successfully",
      assignment: assignment
    });
    
  } catch (error) {
    console.error("Error accepting assignment:", error);
    res.status(500).json({ message: error.message });
  }
});

// Lawyer rejects assignment using NEW system
router.put("/reject/:assignmentId", protect, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { response } = req.body;
    
    // Check if user is a lawyer
    if (req.user.userType !== 'lawyer' && req.user.userType !== 'verified_lawyer') {
      return res.status(403).json({ message: "Access denied. This endpoint is for lawyers only." });
    }
    
    // Find assignment
    const assignment = await CaseLawyerAssignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }
    
    // Check if lawyer is assigned to this assignment
    if (assignment.lawyer.toString() !== req.user.id) {
      return res.status(403).json({ message: "You are not assigned to this case" });
    }
    
    // Check if assignment is still pending
    if (assignment.status !== 'pending') {
      return res.status(400).json({ message: "Assignment is not pending" });
    }
    
    // Update assignment status
    assignment.status = 'rejected';
    assignment.lawyerResponse = response;
    
    await assignment.save();
    
    // Update case status back to verified (client can request another lawyer)
    await Case.findByIdAndUpdate(assignment.case, {
      status: 'verified',
      currentLawyer: null
    });
    
    console.log(`Assignment ${assignmentId} rejected by lawyer ${req.user.id}`);
    
    res.json({
      success: true,
      message: "Assignment rejected successfully",
      assignment: assignment
    });
    
  } catch (error) {
    console.error("Error rejecting assignment:", error);
    res.status(500).json({ message: error.message });
  }
});

// Unified response endpoint for frontend compatibility
router.post("/response", protect, async (req, res) => {
  try {
    const { assignmentId, accepted, response } = req.body;
    
    console.log(`🔄 Lawyer ${req.user.id} responding to assignment ${assignmentId}: ${accepted ? 'ACCEPT' : 'REJECT'}`);
    
    // Check if user is a lawyer
    if (req.user.userType !== 'lawyer' && req.user.userType !== 'verified_lawyer') {
      return res.status(403).json({ message: "Only lawyers can respond to assignments" });
    }
    
    // Find assignment
    const assignment = await CaseLawyerAssignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }
    
    // Check if assignment belongs to this lawyer
    if (assignment.lawyer.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only respond to your own assignments" });
    }
    
    // Check if assignment is still pending
    if (assignment.status !== 'pending') {
      return res.status(400).json({ message: "Assignment is no longer pending" });
    }
    
    if (accepted) {
      // Accept the assignment
      assignment.status = 'accepted';
      assignment.acceptedAt = new Date();
      assignment.lawyerResponse = response;
      assignment.caseStatusWhenAccepted = 'lawyer_assigned';
      await assignment.save();
      
      // Update case with lawyer assignment
      await Case.findByIdAndUpdate(assignment.case, { 
        status: 'lawyer_assigned',
        currentLawyer: assignment.lawyer
      });
      
      console.log(`✅ Assignment ${assignmentId} accepted by lawyer ${req.user.id}`);
      
      res.json({ 
        success: true,
        message: "Assignment accepted successfully",
        assignment
      });
    } else {
      // Reject the assignment
      assignment.status = 'rejected';
      assignment.lawyerResponse = response;
      await assignment.save();
      
      // Update case status back to verified (remove lawyer request)
      await Case.findByIdAndUpdate(assignment.case, { 
        status: 'verified',
        currentLawyer: null
      });
      
      console.log(`❌ Assignment ${assignmentId} rejected by lawyer ${req.user.id}`);
      
      res.json({ 
        success: true,
        message: "Assignment rejected successfully",
        assignment
      });
    }
  } catch (error) {
    console.error("Error responding to assignment:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get lawyer's assignments using NEW system
router.get("/lawyer/assignments", protect, async (req, res) => {
  try {
    // Check if user is a lawyer
    if (req.user.userType !== 'lawyer' && req.user.userType !== 'verified_lawyer') {
      return res.status(403).json({ message: "Access denied. This endpoint is for lawyers only." });
    }
    
    const assignments = await CaseLawyerAssignment.find({
      lawyer: req.user.id
    })
    .populate('case', 'caseNumber caseType status plaintiffName defendantName')
    .populate('client', 'fullName email')
    .sort({ assignedAt: -1 });
    
    res.json({
      success: true,
      assignments: assignments
    });
    
  } catch (error) {
    console.error("Error getting lawyer assignments:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get client's assignment requests using NEW system
router.get("/client/assignments", protect, async (req, res) => {
  try {
    const assignments = await CaseLawyerAssignment.find({
      client: req.user.id
    })
    .populate('case', 'caseNumber caseType status plaintiffName defendantName')
    .populate('lawyer', 'fullName email lawyerType ratings')
    .sort({ assignedAt: -1 });
    
    res.json({
      success: true,
      assignments: assignments
    });
    
  } catch (error) {
    console.error("Error getting client assignments:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get client's schedule data (cases with hearing information)
router.get("/client-schedule", protect, async (req, res) => {
  try {
    console.log('🗓️ Fetching client schedule for user:', req.user.id);
    
    // Get all cases for this client
    const CaseModel = require('../Model/CaseModel');
    const clientCases = await CaseModel.find({
      user: req.user.id
    })
    .populate('currentLawyer', 'fullName email lawyerType ratings')
    .sort({ createdAt: -1 });
    
    console.log(`📋 Found ${clientCases.length} cases for client`);
    
    // Filter and format cases with hearing information
    const scheduledCases = clientCases.filter(caseItem => 
      caseItem.status === 'hearing_scheduled' || 
      (caseItem.hearingDate && new Date(caseItem.hearingDate) > new Date())
    );
    
    console.log(`📅 Found ${scheduledCases.length} scheduled cases`);
    
    res.json({
      success: true,
      clientCases: clientCases,
      scheduledCases: scheduledCases,
      totalCases: clientCases.length,
      scheduledCount: scheduledCases.length
    });
    
  } catch (error) {
    console.error("Error getting client schedule:", error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
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

module.exports = router;

