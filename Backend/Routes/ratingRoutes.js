const express = require("express");
const Rating = require("../Model/Rating");
const Case = require("../Model/CaseModel");
const VerifiedLawyer = require("../Model/VerifiedLawyer");
const VerifiedClient = require("../Model/VerifiedClient");
const CaseLawyerAssignment = require("../Model/CaseLawyerAssignment");
const { protect } = require("../Controllers/UnverifiedAuthController");
const router = express.Router();

// Submit a rating for a lawyer
router.post("/submit", protect, async (req, res) => {
  try {
    const { caseId, rating } = req.body;
    const clientId = req.user.id;
    
    console.log('=== RATING SUBMISSION DEBUG ===');
    console.log('Case ID:', caseId);
    console.log('Rating:', rating);
    console.log('Client ID:', clientId);

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ 
        success: false,
        message: "Rating must be between 1 and 5" 
      });
    }

    // Find the case and verify client ownership
    const caseData = await Case.findById(caseId).populate('currentLawyer');
    
    console.log('Case data found:', caseData ? {
      caseNumber: caseData.caseNumber,
      status: caseData.status,
      currentLawyer: caseData.currentLawyer,
      user: caseData.user
    } : 'NOT FOUND');
    
    if (!caseData) {
      return res.status(404).json({ 
        success: false,
        message: "Case not found" 
      });
    }

    if (caseData.user.toString() !== clientId) {
      return res.status(403).json({ 
        success: false,
        message: "You can only rate lawyers for your own cases" 
      });
    }

    // Use new CaseLawyerAssignment system to find the lawyer
    let lawyerId = null;
    let lawyerName = null;
    let lawyerInfo = null;
    
    console.log(`🔍 Looking up lawyer for case ${caseData.caseNumber} using new assignment system...`);
    
    // Method 1: Check currentLawyer field in case (PRIORITY - this is the authoritative source)
    if (caseData.currentLawyer) {
      lawyerId = caseData.currentLawyer._id || caseData.currentLawyer;
      lawyerName = caseData.currentLawyer.fullName || caseData.currentLawyer.name;
      lawyerInfo = caseData.currentLawyer;
      console.log(`✅ Found lawyer via currentLawyer: ${lawyerName} (${lawyerId})`);
    }
    
    // Method 2: Check new CaseLawyerAssignment system (fallback only if currentLawyer is not set)
    if (!lawyerId) {
      try {
        const assignment = await CaseLawyerAssignment.findOne({
          case: caseId,
          status: { $in: ['accepted', 'active', 'completed'] }
        }).populate('lawyer', 'fullName email lawyerType ratings');
        
        if (assignment && assignment.lawyer) {
          lawyerId = assignment.lawyer._id;
          lawyerName = assignment.lawyer.fullName;
          lawyerInfo = assignment.lawyer;
          console.log(`✅ Found lawyer via CaseLawyerAssignment: ${lawyerName} (${lawyerId}) - Status: ${assignment.status}`);
        }
      } catch (assignmentError) {
        console.log(`❌ Error checking CaseLawyerAssignment:`, assignmentError.message);
      }
    }
    
    // Method 3: Check for any assignment with any status (fallback)
    if (!lawyerId) {
      try {
        const assignment = await CaseLawyerAssignment.findOne({
          case: caseId
        }).populate('lawyer', 'fullName email lawyerType ratings');
        
        if (assignment && assignment.lawyer) {
          lawyerId = assignment.lawyer._id;
          lawyerName = assignment.lawyer.fullName;
          lawyerInfo = assignment.lawyer;
          console.log(`✅ Found lawyer via any CaseLawyerAssignment: ${lawyerName} (${lawyerId}) - Status: ${assignment.status}`);
        }
      } catch (assignmentError) {
        console.log(`❌ Error checking any CaseLawyerAssignment:`, assignmentError.message);
      }
    }
    
    // Method 4: For hearing_scheduled cases, use the existing currentLawyer
    if (!lawyerId && caseData.status === 'hearing_scheduled' && caseData.currentLawyer) {
      console.log(`🔍 Method 4: Using existing currentLawyer for hearing_scheduled case ${caseData.caseNumber}`);
      
      // Use the existing currentLawyer without reassigning
      lawyerId = caseData.currentLawyer._id || caseData.currentLawyer;
      lawyerName = caseData.currentLawyer.fullName || caseData.currentLawyer.name || 'Assigned Lawyer';
      
      console.log(`✅ Method 4: Using existing lawyer ${lawyerName} for case ${caseData.caseNumber}`);
    }
    
    if (!lawyerId) {
      console.log(`❌ No lawyer found for case ${caseData.caseNumber} after all methods`);
      console.log(`🔍 Final case details:`, {
        status: caseData.status,
        currentLawyer: caseData.currentLawyer,
        caseNumber: caseData.caseNumber
      });
      
      return res.status(400).json({ 
        success: false,
        message: "No lawyer assigned to this case. Please contact support if you believe this is an error." 
      });
    }

    // Handle multiple ratings - try to create new, if duplicate exists, update it
    console.log(`💾 Saving rating to database:`, {
      case: caseId,
      lawyer: lawyerId,
      client: clientId,
      rating: rating,
      caseNumber: caseData.caseNumber,
      clientName: req.user.name || req.user.fullName,
      lawyerName: lawyerName
    });
    
    try {
      const newRating = new Rating({
        case: caseId,
        lawyer: lawyerId,
        client: clientId,
        rating: rating,
        caseNumber: caseData.caseNumber,
        clientName: req.user.name || req.user.fullName,
        lawyerName: lawyerName || 'Assigned Lawyer',
        ratingTimestamp: new Date() // Add unique timestamp
      });
      await newRating.save();
      console.log(`✅ Created new rating: ${rating} stars for case ${caseData.caseNumber}`);
      console.log(`📊 Rating saved with ID: ${newRating._id}`);
    } catch (duplicateError) {
      if (duplicateError.code === 11000) {
        // Duplicate key error - update existing rating instead
        console.log(`⚠️ Duplicate rating detected, updating existing rating for case ${caseData.caseNumber}`);
        
        const existingRating = await Rating.findOneAndUpdate(
          { case: caseId, client: clientId },
          { 
            rating: rating,
            updatedAt: new Date(),
            ratingTimestamp: new Date()
          },
          { new: true }
        );
        
        if (existingRating) {
          console.log(`✅ Updated existing rating to ${rating} stars for case ${caseData.caseNumber}`);
          console.log(`📊 Updated rating with ID: ${existingRating._id}`);
        } else {
          console.log(`❌ Could not update rating for case ${caseData.caseNumber}`);
        }
      } else {
        // Re-throw other errors
        throw duplicateError;
      }
    }

    // Update lawyer's overall rating
    console.log(`📊 Updating lawyer's overall rating for lawyer ID: ${lawyerId}`);
    await updateLawyerRating(lawyerId);
    console.log(`✅ Lawyer overall rating updated`);

    // Emit real-time notification to lawyer
    try {
      console.log(`🔔 Attempting to send real-time notification to lawyer ${lawyerId}`);
      console.log(`🔍 DEBUG - Lawyer ID type: ${typeof lawyerId}, value: ${lawyerId}`);
      console.log(`🔍 DEBUG - Lawyer name: ${lawyerName}`);
      
      // Import the app module to get access to socketService
      const { socketService } = require('../app');
      if (socketService && socketService().io) {
        const notificationData = {
          lawyerId: String(lawyerId), // Ensure it's a string
          caseNumber: caseData.caseNumber,
          rating: rating,
          clientName: req.user.name || req.user.fullName,
          message: `New ${rating}-star rating received from ${req.user.name || req.user.fullName}!`,
          timestamp: new Date()
        };
        
        console.log(`🔍 DEBUG - Notification data:`, notificationData);
        
        // Debug: Check connected users
        console.log(`🔍 Connected users:`, Array.from(socketService().connectedUsers.keys()));
        console.log(`🔍 Looking for lawyer: ${String(lawyerId)}`);
        
        // Check if lawyer is connected
        const isLawyerConnected = socketService().connectedUsers.has(String(lawyerId));
        console.log(`🔍 Is lawyer ${String(lawyerId)} connected?`, isLawyerConnected);
        
        // Emit to all connected clients first
        socketService().io.emit('new-rating', notificationData);
        console.log(`🎉 Emitted new-rating event to all clients for lawyer ${lawyerId}:`, notificationData);
        
        // Also emit to specific lawyer room if they're connected
        socketService().io.to(`lawyer-${String(lawyerId)}`).emit('rating-notification', notificationData);
        console.log(`📡 Sent targeted notification to lawyer room: lawyer-${String(lawyerId)}`);
        
        // Additional debug: List all rooms
        const rooms = socketService().io.sockets.adapter.rooms;
        console.log(`🔍 Available rooms:`, Array.from(rooms.keys()));
        console.log(`🔍 Lawyer room exists:`, rooms.has(`lawyer-${String(lawyerId)}`));
        
      } else {
        console.log('⚠️ Socket.IO not available, skipping real-time notification');
      }
    } catch (socketError) {
      console.log('⚠️ Socket service error, skipping real-time notification:', socketError.message);
    }
    
    // Create a database notification for the lawyer (as backup)
    try {
      const Notification = require('../Model/Notification');
      
      // Note: The Notification model might not be compatible, so we'll skip this for now
      console.log(`📝 Database notification skipped - using real-time notification only`);
    } catch (notificationError) {
      console.log('⚠️ Database notification error:', notificationError.message);
    }

    // Verify the rating was saved by fetching it back
    const savedRating = await Rating.findOne({ 
      case: caseId, 
      client: clientId, 
      lawyer: lawyerId 
    }).sort({ createdAt: -1 });
    
    console.log(`🔍 Verification - Rating saved in database:`, {
      found: !!savedRating,
      rating: savedRating?.rating,
      id: savedRating?._id,
      timestamp: savedRating?.createdAt
    });

    // Enhanced response with all necessary data for frontend
    const responseData = {
      success: true,
      message: "Rating submitted successfully",
      data: {
        ratingId: savedRating?._id,
        lawyerId: lawyerId,
        lawyerName: lawyerName || 'Assigned Lawyer',
        lawyerEmail: lawyerInfo?.email || '',
        lawyerType: lawyerInfo?.lawyerType || '',
        currentRating: lawyerInfo?.ratings || 0,
        rating: rating,
        caseNumber: caseData.caseNumber,
        caseStatus: caseData.status,
        timestamp: new Date().toISOString(),
        // Animation trigger data
        animation: {
          trigger: true,
          type: 'rating_submitted',
          duration: 2000
        }
      }
    };

    console.log(`🎉 Rating submission successful:`, {
      lawyerName: responseData.data.lawyerName,
      rating: responseData.data.rating,
      caseNumber: responseData.data.caseNumber
    });

    res.status(200).json(responseData);

  } catch (error) {
    console.error("Error submitting rating:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error while submitting rating",
      error: error.message 
    });
  }
});

// Get ratings for a specific lawyer (for performance page)
router.get("/lawyer/:lawyerId", protect, async (req, res) => {
  try {
    const { lawyerId } = req.params;

    // Get all ratings for this lawyer
    const ratings = await Rating.find({ lawyer: lawyerId })
      .sort({ createdAt: -1 })
      .limit(10); // Get last 10 ratings

    // Get lawyer info
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
    console.error("Error fetching lawyer ratings:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error while fetching ratings",
      error: error.message 
    });
  }
});

// Helper function to update lawyer's overall rating
async function updateLawyerRating(lawyerId) {
  try {
    console.log(`📊 Calculating overall rating for lawyer ${lawyerId}`);
    
    const ratings = await Rating.find({ lawyer: lawyerId });
    console.log(`Found ${ratings.length} total ratings for lawyer ${lawyerId}`);
    
    if (ratings.length === 0) {
      console.log(`⚠️ No ratings found for lawyer ${lawyerId}, skipping update`);
      return;
    }

    const totalRating = ratings.reduce((sum, rating) => sum + rating.rating, 0);
    const averageRating = totalRating / ratings.length;
    const roundedRating = Math.round(averageRating * 10) / 10;

    console.log(`📈 Rating calculation: ${totalRating} total points ÷ ${ratings.length} ratings = ${averageRating} (rounded: ${roundedRating})`);

    const updatedLawyer = await VerifiedLawyer.findByIdAndUpdate(lawyerId, {
      ratings: roundedRating, // Round to 1 decimal place
      totalReviews: ratings.length
    }, { new: true });

    if (updatedLawyer) {
      console.log(`✅ Updated lawyer ${updatedLawyer.fullName || updatedLawyer.name} rating to ${roundedRating} based on ${ratings.length} reviews`);
      console.log(`📊 Lawyer's new stats: ${roundedRating} stars from ${ratings.length} reviews`);
    } else {
      console.log(`❌ Failed to update lawyer ${lawyerId} - lawyer not found`);
    }
  } catch (error) {
    console.error("Error updating lawyer rating:", error);
  }
}

// Get lawyer information for a specific case (for rating display)
router.get("/case/:caseId/lawyer", protect, async (req, res) => {
  try {
    const { caseId } = req.params;
    const clientId = req.user.id;
    
    console.log(`🔍 Getting lawyer info for case ${caseId} by client ${clientId}`);
    
    // Verify case ownership
    const caseData = await Case.findById(caseId);
    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: "Case not found"
      });
    }
    
    if (caseData.user.toString() !== clientId) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }
    
    // Find lawyer using new assignment system
    let lawyerInfo = null;
    
    // Method 1: Check new CaseLawyerAssignment system
    try {
      const assignment = await CaseLawyerAssignment.findOne({
        case: caseId,
        status: { $in: ['accepted', 'active', 'completed'] }
      }).populate('lawyer', 'fullName email lawyerType ratings totalReviews');
      
      if (assignment && assignment.lawyer) {
        lawyerInfo = {
          _id: assignment.lawyer._id,
          fullName: assignment.lawyer.fullName,
          email: assignment.lawyer.email,
          lawyerType: assignment.lawyer.lawyerType,
          ratings: assignment.lawyer.ratings,
          totalReviews: assignment.lawyer.totalReviews,
          assignmentStatus: assignment.status
        };
        console.log(`✅ Found lawyer via CaseLawyerAssignment: ${lawyerInfo.fullName}`);
      }
    } catch (assignmentError) {
      console.log(`❌ Error checking CaseLawyerAssignment:`, assignmentError.message);
    }
    
    // Method 2: Fallback to currentLawyer
    if (!lawyerInfo && caseData.currentLawyer) {
      try {
        const lawyer = await VerifiedLawyer.findById(caseData.currentLawyer)
          .select('fullName email lawyerType ratings totalReviews');
        
        if (lawyer) {
          lawyerInfo = {
            _id: lawyer._id,
            fullName: lawyer.fullName,
            email: lawyer.email,
            lawyerType: lawyer.lawyerType,
            ratings: lawyer.ratings,
            totalReviews: lawyer.totalReviews,
            assignmentStatus: 'currentLawyer'
          };
          console.log(`✅ Found lawyer via currentLawyer: ${lawyerInfo.fullName}`);
        }
      } catch (lawyerError) {
        console.log(`❌ Error fetching lawyer:`, lawyerError.message);
      }
    }
    
    if (!lawyerInfo) {
      return res.status(404).json({
        success: false,
        message: "No assigned lawyer found for this case"
      });
    }
    
    res.json({
      success: true,
      lawyer: lawyerInfo,
      case: {
        caseNumber: caseData.caseNumber,
        status: caseData.status
      }
    });
    
  } catch (error) {
    console.error("Error getting lawyer info:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching lawyer information"
    });
  }
});

// Get current rating for a case (to check if already rated)
router.get("/case/:caseId/current-rating", protect, async (req, res) => {
  try {
    const { caseId } = req.params;
    const clientId = req.user.id;
    
    console.log(`🔍 Getting current rating for case ${caseId} by client ${clientId}`);
    
    // Find existing rating
    const existingRating = await Rating.findOne({
      case: caseId,
      client: clientId
    }).sort({ createdAt: -1 });
    
    if (existingRating) {
      res.json({
        success: true,
        hasRating: true,
        rating: {
          _id: existingRating._id,
          rating: existingRating.rating,
          lawyerName: existingRating.lawyerName,
          createdAt: existingRating.createdAt,
          updatedAt: existingRating.updatedAt
        }
      });
    } else {
      res.json({
        success: true,
        hasRating: false,
        rating: null
      });
    }
    
  } catch (error) {
    console.error("Error getting current rating:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching current rating"
    });
  }
});

// Get lawyer name for a specific case
router.get('/lawyer-name/:caseId', protect, async (req, res) => {
  try {
    const { caseId } = req.params;
    
    // Get case data with populated currentLawyer
    const caseData = await Case.findById(caseId).populate('currentLawyer', 'fullName name email');
    
    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    let lawyerName = 'Assigned Lawyer';
    let lawyerId = null;
    
    // Use the actual assigned lawyer from the case
    if (caseData.currentLawyer) {
      lawyerName = caseData.currentLawyer.fullName || caseData.currentLawyer.name || 'Assigned Lawyer';
      lawyerId = caseData.currentLawyer._id;
      console.log(`✅ Found assigned lawyer for case ${caseData.caseNumber}: ${lawyerName}`);
    } else {
      console.log(`⚠️ No currentLawyer found for case ${caseData.caseNumber}`);
    }
    
    res.json({
      success: true,
      caseNumber: caseData.caseNumber,
      lawyerName: lawyerName,
      lawyerId: lawyerId
    });
    
  } catch (error) {
    console.error('Error getting lawyer name:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting lawyer name',
      error: error.message
    });
  }
});

// Debug endpoint to list all ratings (for testing)
router.get("/debug/all", protect, async (req, res) => {
  try {
    const ratings = await Rating.find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('lawyer', 'fullName name')
      .populate('client', 'fullName name');
    
    console.log(`📊 Debug: Found ${ratings.length} ratings in database`);
    
    const formattedRatings = ratings.map(rating => ({
      id: rating._id,
      caseNumber: rating.caseNumber,
      rating: rating.rating,
      clientName: rating.clientName,
      lawyerName: rating.lawyerName,
      createdAt: rating.createdAt,
      lawyer: rating.lawyer ? {
        id: rating.lawyer._id,
        name: rating.lawyer.fullName || rating.lawyer.name
      } : null,
      client: rating.client ? {
        id: rating.client._id,
        name: rating.client.fullName || rating.client.name
      } : null
    }));
    
    res.json({
      success: true,
      totalRatings: ratings.length,
      ratings: formattedRatings
    });
    
  } catch (error) {
    console.error("Error fetching debug ratings:", error);
    res.status(500).json({ 
      success: false,
      message: "Error fetching ratings",
      error: error.message 
    });
  }
});

module.exports = router;
