const express = require('express');
const router = express.Router();
const AnnouncementController = require('../Controllers/AnnouncementController');
const { protect, checkAnalyticsManagerAccess } = require('../Controllers/UnverifiedAuthController');

// Analytics Manager routes (protected)
router.post('/create', protect, checkAnalyticsManagerAccess, AnnouncementController.createAnnouncement);
router.get('/all', protect, checkAnalyticsManagerAccess, AnnouncementController.getAllAnnouncements);
router.get('/stats', protect, checkAnalyticsManagerAccess, AnnouncementController.getAnnouncementStats);
router.get('/users/:userType', protect, checkAnalyticsManagerAccess, AnnouncementController.getAvailableUsers);
router.delete('/:announcementId', protect, checkAnalyticsManagerAccess, AnnouncementController.deleteAnnouncement);
router.post('/resend/:announcementId', protect, checkAnalyticsManagerAccess, AnnouncementController.resendAnnouncement);

// User routes (for all authenticated users - clients, lawyers, staff)
router.get('/my-announcements', protect, AnnouncementController.getUserAnnouncements);
router.post('/acknowledge/:announcementId', protect, AnnouncementController.acknowledgeAnnouncement);

module.exports = router;
