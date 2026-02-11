const express = require("express");
const Checklist = require("../Model/ChecklistModel");
const Case = require("../Model/CaseModel");
const { protect } = require("../Controllers/UnverifiedAuthController");
const router = express.Router();

// Get checklist for a specific case
router.get("/case/:caseId", protect, async (req, res) => {
  try {
    const { caseId } = req.params;
    const userId = req.user.id;

    // Verify the case belongs to the user
    const caseData = await Case.findOne({ _id: caseId, user: userId });
    if (!caseData) {
      return res.status(404).json({ message: "Case not found or access denied" });
    }

    // Find or create checklist for this case
    let checklist = await Checklist.findOne({ user: userId, case: caseId });
    
    if (!checklist) {
      // Create new checklist with default checklist items
      const defaultChecklistItems = new Map([
        // Essential Documents (doc1-doc8)
        ['doc1', false], // Case filing documents and receipts
        ['doc2', false], // Government-issued photo ID
        ['doc3', false], // Court summons or hearing notice
        ['doc4', false], // Evidence documents (contracts, photos, receipts)
        ['doc5', false], // Witness contact information and statements
        ['doc6', false], // Legal representation documents (if applicable)
        ['doc7', false], // Insurance papers (if relevant to case)
        ['doc8', false], // Medical records (for injury cases)
        
        // Personal Preparation (prep1-prep8)
        ['prep1', false], // Professional attire selected and ready
        ['prep2', false], // Transportation to courthouse arranged
        ['prep3', false], // Arrive 30 minutes early planned
        ['prep4', false], // Phone turned off or on silent
        ['prep5', false], // Notepad and pen for taking notes
        ['prep6', false], // Questions for judge/lawyer prepared
        ['prep7', false], // Childcare arranged (if needed)
        ['prep8', false], // Work absence notifications sent
        
        // Day Before Court (day1-day7)
        ['day1', false], // Confirm court date, time, and location
        ['day2', false], // Review case facts and timeline
        ['day3', false], // Practice explaining your side clearly
        ['day4', false], // Get a good night's sleep
        ['day5', false], // Prepare a healthy breakfast
        ['day6', false], // Check weather for appropriate clothing
        ['day7', false], // Set multiple alarms for court day
      ]);
      
      checklist = new Checklist({
        user: userId,
        case: caseId,
        checklistItems: defaultChecklistItems
      });
      await checklist.save();
    }

    res.json({
      success: true,
      checklist: {
        _id: checklist._id,
        checklistItems: Object.fromEntries(checklist.checklistItems),
        lastUpdated: checklist.lastUpdated
      }
    });

  } catch (error) {
    console.error("Error fetching checklist:", error);
    res.status(500).json({
      message: "Failed to fetch checklist",
      error: error.message
    });
  }
});

// Update checklist items for a specific case
router.put("/case/:caseId", protect, async (req, res) => {
  try {
    const { caseId } = req.params;
    const { checklistItems } = req.body;
    const userId = req.user.id;

    // Verify the case belongs to the user
    const caseData = await Case.findOne({ _id: caseId, user: userId });
    if (!caseData) {
      return res.status(404).json({ message: "Case not found or access denied" });
    }

    // Find or create checklist for this case
    let checklist = await Checklist.findOne({ user: userId, case: caseId });
    
    if (!checklist) {
      // Create new checklist with default checklist items if none exist
      const defaultChecklistItems = new Map([
        // Essential Documents (doc1-doc8)
        ['doc1', false], ['doc2', false], ['doc3', false], ['doc4', false],
        ['doc5', false], ['doc6', false], ['doc7', false], ['doc8', false],
        // Personal Preparation (prep1-prep8)
        ['prep1', false], ['prep2', false], ['prep3', false], ['prep4', false],
        ['prep5', false], ['prep6', false], ['prep7', false], ['prep8', false],
        // Day Before Court (day1-day7)
        ['day1', false], ['day2', false], ['day3', false], ['day4', false],
        ['day5', false], ['day6', false], ['day7', false]
      ]);
      
      checklist = new Checklist({
        user: userId,
        case: caseId,
        checklistItems: defaultChecklistItems
      });
    }

    // Update checklist items
    checklist.checklistItems = new Map(Object.entries(checklistItems || {}));
    checklist.lastUpdated = new Date();
    
    await checklist.save();

    res.json({
      success: true,
      message: "Checklist updated successfully",
      checklist: {
        _id: checklist._id,
        checklistItems: Object.fromEntries(checklist.checklistItems),
        lastUpdated: checklist.lastUpdated
      }
    });

  } catch (error) {
    console.error("Error updating checklist:", error);
    res.status(500).json({
      message: "Failed to update checklist",
      error: error.message
    });
  }
});

// Get all checklists for a user
router.get("/user", protect, async (req, res) => {
  try {
    const userId = req.user.id;

    const checklists = await Checklist.find({ user: userId })
      .populate('case', 'caseNumber caseType district status')
      .sort({ lastUpdated: -1 });

    res.json({
      success: true,
      checklists: checklists.map(checklist => ({
        _id: checklist._id,
        case: checklist.case,
        checklistItems: Object.fromEntries(checklist.checklistItems),
        lastUpdated: checklist.lastUpdated
      }))
    });

  } catch (error) {
    console.error("Error fetching user checklists:", error);
    res.status(500).json({
      message: "Failed to fetch checklists",
      error: error.message
    });
  }
});

module.exports = router;
