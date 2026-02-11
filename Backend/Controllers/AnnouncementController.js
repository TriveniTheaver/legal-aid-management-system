const Announcement = require('../Model/Announcement');
const VerifiedClient = require('../Model/VerifiedClient');
const VerifiedLawyer = require('../Model/VerifiedLawyer');
const Staff = require('../Model/Staff');

// Create a new announcement
const createAnnouncement = async (req, res) => {
  try {
    console.log('📢 Creating new announcement...');
    console.log('User ID:', req.user.id);
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    const { 
      title, 
      message, 
      language, 
      priority, 
      schedule, 
      scheduledAt,
      recipients, 
      customRecipients,
      expiresAt 
    } = req.body;

    // Validation
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Announcement title is required'
      });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Announcement message is required'
      });
    }

    if (title.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Title cannot exceed 100 characters'
      });
    }

    if (message.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot exceed 500 characters'
      });
    }

    if (!recipients) {
      return res.status(400).json({
        success: false,
        message: 'Recipients selection is required'
      });
    }

    // Get creator info
    const creator = await Staff.findById(req.user.id);
    if (!creator) {
      return res.status(404).json({
        success: false,
        message: 'Creator not found'
      });
    }

    // Calculate total recipients
    let totalRecipients = 0;
    let recipientList = [];

    if (recipients === 'All Users') {
      const [clientCount, lawyerCount, staffCount] = await Promise.all([
        VerifiedClient.countDocuments(),
        VerifiedLawyer.countDocuments(),
        Staff.countDocuments({ _id: { $ne: req.user.id } })
      ]);
      totalRecipients = clientCount + lawyerCount + staffCount;
    } else if (recipients === 'Clients') {
      totalRecipients = await VerifiedClient.countDocuments();
    } else if (recipients === 'Lawyers') {
      totalRecipients = await VerifiedLawyer.countDocuments();
    } else if (recipients === 'Staff') {
      totalRecipients = await Staff.countDocuments({ _id: { $ne: req.user.id } });
    } else if (recipients === 'Custom' && customRecipients && customRecipients.length > 0) {
      totalRecipients = customRecipients.length;
      recipientList = customRecipients;
    }

    // Create announcement data
    const announcementData = {
      title: title.trim(),
      message: message.trim(),
      language: language || 'English',
      priority: priority || 'Normal Priority',
      schedule: schedule || 'Send Immediately',
      scheduledAt: schedule === 'Schedule for Later' && scheduledAt ? new Date(scheduledAt) : null,
      recipients,
      customRecipients: recipientList,
      createdBy: req.user.id,
      createdByName: creator.fullName || creator.name || 'System Admin',
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      totalRecipients,
      status: schedule === 'Send Immediately' ? 'Published' : 'Scheduled'
    };

    console.log('📢 Creating announcement with data:', JSON.stringify(announcementData, null, 2));

    const announcement = new Announcement(announcementData);
    await announcement.save();

    console.log('📢 Announcement created successfully:', announcement.announcementId);

    res.status(201).json({
      success: true,
      message: 'Announcement published successfully!',
      data: {
        announcementId: announcement.announcementId,
        title: announcement.title,
        status: announcement.status,
        totalRecipients: announcement.totalRecipients,
        createdAt: announcement.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Error creating announcement:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create announcement',
      error: error.message
    });
  }
};

// Get all announcements (for analytics manager)
const getAllAnnouncements = async (req, res) => {
  try {
    console.log('📢 Fetching all announcements...');

    const { page = 1, limit = 10, status, priority, recipients } = req.query;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (recipients) filter.recipients = recipients;

    const [announcements, total] = await Promise.all([
      Announcement.find(filter)
        .populate('createdBy', 'fullName name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Announcement.countDocuments(filter)
    ]);

    // Add computed fields
    const announcementsWithStats = announcements.map(announcement => ({
      ...announcement,
      acknowledgmentRate: announcement.totalRecipients > 0 ? 
        Math.round((announcement.acknowledgedBy.length / announcement.totalRecipients) * 100) : 0,
      isExpired: announcement.expiresAt ? new Date() > new Date(announcement.expiresAt) : false
    }));

    res.status(200).json({
      success: true,
      data: {
        announcements: announcementsWithStats,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('❌ Error fetching announcements:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch announcements',
      error: error.message
    });
  }
};

// Get announcement statistics
const getAnnouncementStats = async (req, res) => {
  try {
    console.log('📊 Fetching announcement statistics...');

    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalAnnouncements,
      publishedAnnouncements,
      scheduledAnnouncements,
      announcementsLast30Days,
      announcementsLast7Days,
      priorityStats,
      recipientStats,
      topAnnouncements
    ] = await Promise.all([
      Announcement.countDocuments(),
      Announcement.countDocuments({ status: 'Published' }),
      Announcement.countDocuments({ status: 'Scheduled' }),
      Announcement.countDocuments({ createdAt: { $gte: last30Days } }),
      Announcement.countDocuments({ createdAt: { $gte: last7Days } }),
      Announcement.aggregate([
        { $group: { _id: '$priority', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Announcement.aggregate([
        { $group: { _id: '$recipients', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Announcement.find({ status: 'Published' })
        .sort({ acknowledgedBy: -1, views: -1 })
        .limit(5)
        .select('title priority acknowledgedBy views createdAt')
        .lean()
    ]);

    // Calculate average acknowledgment rate
    const avgAcknowledgmentRate = await Announcement.aggregate([
      { $match: { status: 'Published', totalRecipients: { $gt: 0 } } },
      { 
        $project: { 
          rate: { 
            $multiply: [
              { $divide: [{ $size: '$acknowledgedBy' }, '$totalRecipients'] },
              100
            ]
          }
        }
      },
      { $group: { _id: null, avgRate: { $avg: '$rate' } } }
    ]);

    const stats = {
      overview: {
        total: totalAnnouncements,
        published: publishedAnnouncements,
        scheduled: scheduledAnnouncements,
        last30Days: announcementsLast30Days,
        last7Days: announcementsLast7Days
      },
      performance: {
        averageAcknowledgmentRate: avgAcknowledgmentRate[0]?.avgRate || 0,
        topAnnouncements
      },
      distribution: {
        byPriority: priorityStats,
        byRecipients: recipientStats
      }
    };

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('❌ Error fetching announcement stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch announcement statistics',
      error: error.message
    });
  }
};

// Get user's announcements
const getUserAnnouncements = async (req, res) => {
  try {
    console.log('📢 Fetching user announcements...');
    console.log('User ID:', req.user.id);
    console.log('User Type:', req.user.userType);

    const userId = req.user.id;
    const userType = req.user.userType === 'verified_client' ? 'VerifiedClient' : 
                    req.user.userType === 'verified_lawyer' ? 'VerifiedLawyer' : 'Staff';

    // Get active announcements for this user
    const announcements = await Announcement.getActiveForUser(userId, userType);

    // Add acknowledgment status
    const announcementsWithStatus = announcements.map(announcement => ({
      ...announcement.toObject(),
      isAcknowledged: announcement.hasUserAcknowledged(userId),
      isExpired: announcement.isExpired()
    }));

    // Separate acknowledged and unacknowledged
    const unacknowledged = announcementsWithStatus.filter(a => !a.isAcknowledged);
    const acknowledged = announcementsWithStatus.filter(a => a.isAcknowledged);

    res.status(200).json({
      success: true,
      data: {
        unacknowledged,
        acknowledged,
        total: announcementsWithStatus.length,
        unreadCount: unacknowledged.length
      }
    });

  } catch (error) {
    console.error('❌ Error fetching user announcements:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user announcements',
      error: error.message
    });
  }
};

// Acknowledge an announcement
const acknowledgeAnnouncement = async (req, res) => {
  try {
    console.log('📢 Acknowledging announcement...');
    console.log('Announcement ID:', req.params.announcementId);
    console.log('User ID:', req.user.id);

    const { announcementId } = req.params;
    const userId = req.user.id;
    const userType = req.user.userType === 'verified_client' ? 'VerifiedClient' : 
                    req.user.userType === 'verified_lawyer' ? 'VerifiedLawyer' : 'Staff';

    // Find the announcement
    const announcement = await Announcement.findOne({ announcementId });
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    // Check if already acknowledged
    if (announcement.hasUserAcknowledged(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Announcement already acknowledged'
      });
    }

    // Add acknowledgment
    announcement.acknowledgedBy.push({
      userId,
      userType,
      acknowledgedAt: new Date(),
      userName: req.user.fullName || req.user.name || 'User'
    });

    await announcement.save();

    console.log('📢 Announcement acknowledged successfully');

    res.status(200).json({
      success: true,
      message: 'Announcement acknowledged successfully'
    });

  } catch (error) {
    console.error('❌ Error acknowledging announcement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to acknowledge announcement',
      error: error.message
    });
  }
};

// Delete an announcement
const deleteAnnouncement = async (req, res) => {
  try {
    console.log('🗑️ Deleting announcement...');
    console.log('Announcement ID:', req.params.announcementId);

    const { announcementId } = req.params;

    const announcement = await Announcement.findOneAndDelete({ announcementId });
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    console.log('🗑️ Announcement deleted successfully');

    res.status(200).json({
      success: true,
      message: 'Announcement deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting announcement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete announcement',
      error: error.message
    });
  }
};

// Resend an announcement
const resendAnnouncement = async (req, res) => {
  try {
    console.log('📤 Resending announcement...');
    console.log('Announcement ID:', req.params.announcementId);

    const { announcementId } = req.params;

    const announcement = await Announcement.findOne({ announcementId });
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    // Update status and published date
    announcement.status = 'Published';
    announcement.publishedAt = new Date();
    await announcement.save();

    console.log('📤 Announcement resent successfully');

    res.status(200).json({
      success: true,
      message: 'Announcement resent successfully'
    });

  } catch (error) {
    console.error('❌ Error resending announcement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend announcement',
      error: error.message
    });
  }
};

// Get available users for custom recipient selection
const getAvailableUsers = async (req, res) => {
  try {
    console.log('👥 Fetching available users...');
    console.log('User Type:', req.params.userType);

    const { userType } = req.params;
    let users = [];

    if (userType === 'clients') {
      users = await VerifiedClient.find({}, 'fullName email lawyerId')
        .sort({ fullName: 1 })
        .lean();
    } else if (userType === 'lawyers') {
      users = await VerifiedLawyer.find({}, 'fullName email lawyerId')
        .sort({ fullName: 1 })
        .lean();
    } else if (userType === 'staff') {
      users = await Staff.find({ _id: { $ne: req.user.id } }, 'fullName email staffId role')
        .sort({ fullName: 1 })
        .lean();
    }

    res.status(200).json({
      success: true,
      data: users
    });

  } catch (error) {
    console.error('❌ Error fetching available users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available users',
      error: error.message
    });
  }
};

module.exports = {
  createAnnouncement,
  getAllAnnouncements,
  getAnnouncementStats,
  getUserAnnouncements,
  acknowledgeAnnouncement,
  deleteAnnouncement,
  resendAnnouncement,
  getAvailableUsers
};
