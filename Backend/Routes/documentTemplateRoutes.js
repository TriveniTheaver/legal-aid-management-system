const express = require('express');
const router = express.Router();
const { protect, checkClientRole, checkLawyerRole } = require('../Middleware/auth');
const {
  getTemplates,
  getTemplateById,
  getTemplatesByCategory,
  searchTemplates,
  generateDocument,
  generatePDF,
  getUserDocuments,
  updateDocumentStatus,
  getCategories,
  getPopularTemplates
} = require('../Controllers/DocumentTemplateController');

// Public routes (no authentication required for browsing)
router.get('/categories', getCategories);
router.get('/popular', getPopularTemplates);
router.get('/search', searchTemplates);
router.get('/category/:category', getTemplatesByCategory);

// Protected routes (require authentication but accessible to both clients and lawyers)
router.get('/', protect, getTemplates);
router.get('/:id', protect, getTemplateById);
router.post('/generate', protect, generateDocument);
router.get('/user/documents', protect, getUserDocuments);

// PDF generation (accessible to both clients and lawyers)
router.get('/pdf/:documentId', protect, generatePDF);

// Lawyer-only routes
router.put('/:documentId/status', protect, checkLawyerRole, updateDocumentStatus);

module.exports = router;
