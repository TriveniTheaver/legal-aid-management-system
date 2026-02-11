const ActivityLog = require('../Model/ActivityLog');

// Get all activity logs with filtering and pagination
exports.getActivityLogs = async (req, res) => {
  try {
    console.log('🔍 Fetching activity logs...');
    
    const {
      page = 1,
      limit = 50,
      category,
      action,
      userType,
      status,
      startDate,
      endDate,
      search
    } = req.query;
    
    // Build query
    const query = {};
    
    if (category) query.category = category;
    if (action) query.action = action;
    if (userType) query.userType = userType;
    if (status) query.status = status;
    
    // Date range filter
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.timestamp.$lte = end;
      }
    }
    
    // Search filter
    if (search) {
      query.$or = [
        { userName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    console.log('📊 Query:', query);
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query
    const [logs, total] = await Promise.all([
      ActivityLog.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      ActivityLog.countDocuments(query)
    ]);
    
    console.log(`✅ Found ${logs.length} logs out of ${total} total`);
    
    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalLogs: total,
          logsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('❌ Error fetching activity logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity logs',
      error: error.message
    });
  }
};

// Get activity statistics
exports.getActivityStats = async (req, res) => {
  try {
    console.log('📊 Fetching activity statistics...');
    
    const stats = await ActivityLog.getActivityStats();
    
    console.log('✅ Activity stats fetched successfully');
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Error fetching activity stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity statistics',
      error: error.message
    });
  }
};

// Get activities by category
exports.getActivitiesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 50 } = req.query;
    
    console.log(`🔍 Fetching ${category} activities...`);
    
    const activities = await ActivityLog.getActivitiesByCategory(category, parseInt(limit));
    
    console.log(`✅ Found ${activities.length} ${category} activities`);
    
    res.json({
      success: true,
      data: {
        category,
        activities,
        count: activities.length
      }
    });
  } catch (error) {
    console.error('❌ Error fetching activities by category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activities by category',
      error: error.message
    });
  }
};

// Get activities by user
exports.getActivitiesByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50 } = req.query;
    
    console.log(`🔍 Fetching activities for user ${userId}...`);
    
    const activities = await ActivityLog.getActivitiesByUser(userId, parseInt(limit));
    
    console.log(`✅ Found ${activities.length} activities for user`);
    
    res.json({
      success: true,
      data: {
        userId,
        activities,
        count: activities.length
      }
    });
  } catch (error) {
    console.error('❌ Error fetching activities by user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activities by user',
      error: error.message
    });
  }
};

// Get recent activities
exports.getRecentActivities = async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    
    console.log(`🔍 Fetching ${limit} recent activities...`);
    
    const activities = await ActivityLog.getRecentActivities(parseInt(limit));
    
    console.log(`✅ Found ${activities.length} recent activities`);
    
    res.json({
      success: true,
      data: {
        activities,
        count: activities.length
      }
    });
  } catch (error) {
    console.error('❌ Error fetching recent activities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent activities',
      error: error.message
    });
  }
};

// Log a new activity (utility endpoint for manual logging)
exports.logActivity = async (req, res) => {
  try {
    console.log('📝 Logging new activity...');
    
    const activityData = {
      ...req.body,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    };
    
    const log = await ActivityLog.logActivity(activityData);
    
    if (!log) {
      return res.status(500).json({
        success: false,
        message: 'Failed to log activity'
      });
    }
    
    console.log('✅ Activity logged successfully');
    
    res.status(201).json({
      success: true,
      message: 'Activity logged successfully',
      data: log
    });
  } catch (error) {
    console.error('❌ Error logging activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to log activity',
      error: error.message
    });
  }
};

// Get activity details by ID
exports.getActivityById = async (req, res) => {
  try {
    const { activityId } = req.params;
    
    console.log(`🔍 Fetching activity ${activityId}...`);
    
    const activity = await ActivityLog.findById(activityId).lean();
    
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }
    
    console.log('✅ Activity found');
    
    res.json({
      success: true,
      data: activity
    });
  } catch (error) {
    console.error('❌ Error fetching activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity',
      error: error.message
    });
  }
};

// Delete old logs (for maintenance)
exports.deleteOldLogs = async (req, res) => {
  try {
    const { days = 90 } = req.query;
    
    console.log(`🗑️ Deleting logs older than ${days} days...`);
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));
    
    const result = await ActivityLog.deleteMany({
      timestamp: { $lt: cutoffDate }
    });
    
    console.log(`✅ Deleted ${result.deletedCount} old logs`);
    
    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} logs older than ${days} days`,
      data: {
        deletedCount: result.deletedCount,
        cutoffDate
      }
    });
  } catch (error) {
    console.error('❌ Error deleting old logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete old logs',
      error: error.message
    });
  }
};

// Export logs as JSON
exports.exportLogs = async (req, res) => {
  try {
    const { startDate, endDate, category } = req.query;
    
    console.log('📤 Exporting logs...');
    
    const query = {};
    
    if (category) query.category = category;
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.timestamp.$lte = end;
      }
    }
    
    const logs = await ActivityLog.find(query)
      .sort({ timestamp: -1 })
      .lean();
    
    console.log(`✅ Exporting ${logs.length} logs`);
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=activity-logs-${Date.now()}.json`);
    res.json({
      success: true,
      exportDate: new Date(),
      totalLogs: logs.length,
      data: logs
    });
  } catch (error) {
    console.error('❌ Error exporting logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export logs',
      error: error.message
    });
  }
};

module.exports = exports;

