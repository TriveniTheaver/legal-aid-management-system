const express = require('express');
const router = express.Router();
const ActivityLogController = require('../Controllers/ActivityLogController');
const { protect, restrictTo } = require('../Controllers/UnverifiedAuthController');

// All routes require authentication and admin access
router.use(protect);
router.use(restrictTo('admin'));

// Get all activity logs with filtering and pagination
router.get('/logs', ActivityLogController.getActivityLogs);

// Get activity statistics (must be before /:activityId)
router.get('/stats', ActivityLogController.getActivityStats);

// Get recent activities (must be before /:activityId)
router.get('/recent', ActivityLogController.getRecentActivities);

// Export logs (must be before /:activityId)
router.get('/export/json', ActivityLogController.exportLogs);

// Get activities by category
router.get('/category/:category', ActivityLogController.getActivitiesByCategory);

// Get activities by user
router.get('/user/:userId', ActivityLogController.getActivitiesByUser);

// Delete old logs (maintenance)
router.delete('/cleanup', ActivityLogController.deleteOldLogs);

// Log activity (utility endpoint)
router.post('/log', ActivityLogController.logActivity);

// Get activity details by ID (must be last among GET routes)
router.get('/:activityId', ActivityLogController.getActivityById);

module.exports = router;

