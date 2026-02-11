const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const Document = require('../Model/DocumentModel');
const Case = require('../Model/CaseModel');
const VerifiedClient = require('../Model/VerifiedClient');
const VerifiedLawyer = require('../Model/VerifiedLawyer');
const { protect } = require("../Controllers/UnverifiedAuthController");
const ocrService = require('../services/ocrService');

const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads/documents');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Create user-specific directory
        const userDir = path.join(uploadsDir, req.user.id);
        if (!fs.existsSync(userDir)) {
            fs.mkdirSync(userDir, { recursive: true });
        }
        cb(null, userDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const filename = `${file.fieldname}-${uniqueSuffix}${ext}`;
        cb(null, filename);
    }
});

// File filter for allowed file types
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'text/plain'
    ];
    
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.txt'];
    const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
    
    // Check file size (max 10MB)
    if (file.size && file.size > 10 * 1024 * 1024) {
        return cb(new Error('File size must not exceed 10MB'), false);
    }
    
    // Check MIME type
    if (!allowedMimeTypes.includes(file.mimetype)) {
        return cb(new Error(`File type ${file.mimetype} is not allowed`), false);
    }
    
    // Check file extension
    if (!allowedExtensions.includes(fileExtension)) {
        return cb(new Error(`File extension ${fileExtension} is not allowed`), false);
    }
    
    cb(null, true);
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Helper function to calculate file checksum
const calculateChecksum = (filePath) => {
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
};

// Helper function for OCR processing
const processOCR = async (filePath, mimeType) => {
    try {
        if (mimeType.startsWith('image/')) {
            console.log('Starting OCR processing for:', filePath);
            
            // Extract text using OCR service
            const ocrResult = await ocrService.extractTextFromImage(filePath, {
                lang: 'eng', // Default to English, can be made configurable
                preprocessing: true,
                confidence_threshold: 30
            });
            
            console.log(`OCR completed with confidence: ${ocrResult.confidence}%`);
            console.log(`Extracted text length: ${ocrResult.text.length} characters`);
            
            return ocrResult.text;
        }
        return '';
    } catch (error) {
        console.error('OCR processing failed:', error);
        // Don't fail document upload if OCR fails
        return '';
    }
};

// Upload document
router.post('/upload', protect, upload.single('document'), async (req, res) => {
    console.log('🔄 Document upload request received');
    console.log('📁 Request details:', {
        user: req.user?.id,
        body: req.body,
        file: req.file ? {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            filename: req.file.filename
        } : 'No file'
    });

    try {
        if (!req.file) {
            console.log('❌ No file uploaded');
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const { category, description, caseId } = req.body;
        
        if (!category) {
            console.log('❌ Category is required');
            // Clean up uploaded file if validation fails
            if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({ message: 'Category is required' });
        }

        console.log('✅ Basic validation passed');

        // Validate case ownership if caseId is provided
        let caseDoc = null;
        if (caseId) {
            console.log('🔍 Validating case ownership for case:', caseId);
            caseDoc = await Case.findOne({ _id: caseId, user: req.user.id });
            if (!caseDoc) {
                console.log('❌ Case not found or access denied');
                if (fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                }
                return res.status(403).json({ message: 'Case not found or access denied' });
            }
            console.log('✅ Case validation passed');
        }

        console.log('🔢 Calculating file checksum...');
        // Calculate file checksum
        const checksum = calculateChecksum(req.file.path);
        console.log('✅ Checksum calculated:', checksum.substring(0, 8) + '...');

        console.log('🔍 Processing OCR if applicable...');
        // Process OCR if it's an image
        const extractedText = await processOCR(req.file.path, req.file.mimetype);
        console.log('✅ OCR processing completed, extracted text length:', extractedText.length);

        console.log('💾 Creating document record...');
        // Create document record
        const document = new Document({
            originalName: req.file.originalname,
            filename: req.file.filename,
            category: category,
            description: description || '',
            fileSize: req.file.size,
            mimeType: req.file.mimetype,
            uploadedBy: req.user.id,
            case: caseId || null,
            filePath: req.file.path,
            checksum: checksum,
            extractedText: extractedText,
            ocrProcessed: extractedText.length > 0
        });

        await document.save();
        console.log('✅ Document saved to database with ID:', document._id);

        // Auto-share with assigned lawyer if case has one
        if (caseDoc && caseDoc.currentLawyer) {
            console.log('👨‍💼 Auto-sharing with assigned lawyer:', caseDoc.currentLawyer);
            try {
                await document.shareWith(caseDoc.currentLawyer, 'read');
                console.log('✅ Document shared with lawyer');
            } catch (shareError) {
                console.log('⚠️ Failed to share with lawyer:', shareError.message);
                // Don't fail the upload if sharing fails
            }
        }

        // Populate response data
        await document.populate('uploadedBy', 'name email');
        await document.populate('case', 'caseNumber caseType');

        console.log(`✅ Document uploaded successfully: ${document.originalName} for user ${req.user.id}${caseId ? ` in case ${caseId}` : ''}`);

        res.status(201).json({
            message: 'Document uploaded successfully',
            document: document
        });

    } catch (error) {
        console.error('❌ Error uploading document:', error);
        console.error('❌ Error stack:', error.stack);
        
        // Clean up uploaded file if database save fails
        if (req.file && fs.existsSync(req.file.path)) {
            try {
                fs.unlinkSync(req.file.path);
                console.log('🗑️ Cleaned up uploaded file after error');
            } catch (cleanupError) {
                console.error('❌ Failed to cleanup file:', cleanupError.message);
            }
        }
        
        res.status(500).json({ 
            message: 'Failed to upload document',
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Get user's documents (with case filtering)
router.get('/my-documents', protect, async (req, res) => {
    try {
        const { caseId, category, limit = 50 } = req.query;
        
        const options = {
            limit: parseInt(limit)
        };
        
        if (caseId) {
            // Verify user owns this case
            const caseDoc = await Case.findOne({ _id: caseId, user: req.user.id });
            if (!caseDoc) {
                return res.status(403).json({ message: 'Case not found or access denied' });
            }
            options.caseId = caseId;
        }
        
        if (category) {
            options.category = category;
        }

        const documents = await Document.getDocumentsForUser(req.user.id, options);
        
        res.json({
            message: 'Documents retrieved successfully',
            documents: documents,
            total: documents.length
        });

    } catch (error) {
        console.error('Error fetching documents:', error);
        res.status(500).json({ 
            message: 'Failed to fetch documents',
            error: error.message 
        });
    }
});

// Get user's managed documents for case filing (general storage only)
router.get('/managed-documents', protect, async (req, res) => {
    try {
        console.log(`📁 Fetching managed documents for user: ${req.user.id}`);
        
        // Get documents that are in general storage (not linked to any case)
        const documents = await Document.find({
            uploadedBy: req.user.id,
            case: null, // Only general storage documents
            isActive: true
        })
        .select('originalName filename category description fileSize mimeType createdAt')
        .sort({ createdAt: -1 });
        
        console.log(`📁 Found ${documents.length} managed documents`);
        
        res.json({
            success: true,
            message: 'Managed documents retrieved successfully',
            documents: documents,
            total: documents.length
        });

    } catch (error) {
        console.error('Error fetching managed documents:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to fetch managed documents',
            error: error.message 
        });
    }
});

// Get documents for a specific case
router.get('/case/:caseId', protect, async (req, res) => {
    try {
        const { caseId } = req.params;
        
        // Verify user has access to this case (either as owner or assigned lawyer)
        const caseDoc = await Case.findById(caseId);
        if (!caseDoc) {
            return res.status(404).json({ message: 'Case not found' });
        }
        
        const hasAccess = caseDoc.user.toString() === req.user.id || 
                         (caseDoc.currentLawyer && caseDoc.currentLawyer.toString() === req.user.id);
        
        if (!hasAccess) {
            return res.status(403).json({ message: 'Access denied to this case' });
        }

        const documents = await Document.getDocumentsByCase(caseId);
        
        res.json({
            message: 'Case documents retrieved successfully',
            documents: documents,
            case: {
                id: caseDoc._id,
                caseNumber: caseDoc.caseNumber,
                caseType: caseDoc.caseType
            }
        });

    } catch (error) {
        console.error('Error fetching case documents:', error);
        res.status(500).json({ 
            message: 'Failed to fetch case documents',
            error: error.message 
        });
    }
});

// Download document
router.get('/:documentId/download', protect, async (req, res) => {
    try {
        const { documentId } = req.params;
        console.log(`🔍 Download request for document ID: ${documentId} by user: ${req.user.id}`);
        
        const document = await Document.findById(documentId)
            .populate('case', 'user currentLawyer');
        
        if (!document) {
            console.log(`❌ Document not found in database: ${documentId}`);
            return res.status(404).json({ message: 'Document not found' });
        }
        
        if (!document.isActive) {
            console.log(`❌ Document is inactive: ${documentId}`);
            return res.status(404).json({ message: 'Document not found' });
        }
        
        console.log(`📄 Document found: ${document.originalName}, filePath: ${document.filePath}`);
        
        // Check access permissions
        let hasAccess = false;
        
        // Document owner
        if (document.uploadedBy.toString() === req.user.id) {
            hasAccess = true;
            console.log(`✅ Access granted: Document owner`);
        }
        // Shared with user
        else if (document.sharedWith.some(share => share.user.toString() === req.user.id)) {
            hasAccess = true;
            console.log(`✅ Access granted: Document shared with user`);
        }
        // Lawyer assigned to the case
        else if (document.case && document.case.currentLawyer && 
                 document.case.currentLawyer.toString() === req.user.id) {
            hasAccess = true;
            console.log(`✅ Access granted: Assigned lawyer`);
        }
        
        if (!hasAccess) {
            console.log(`❌ Access denied for user: ${req.user.id}`);
            return res.status(403).json({ message: 'Access denied to this document' });
        }
        
        // Check if file exists
        const fullPath = path.resolve(document.filePath);
        console.log(`🔍 Checking file existence at: ${fullPath}`);
        
        if (!fs.existsSync(fullPath)) {
            console.log(`❌ File not found on server: ${fullPath}`);
            return res.status(404).json({ 
                message: 'File not found on server',
                filePath: document.filePath,
                resolvedPath: fullPath
            });
        }
        
        console.log(`✅ File exists, proceeding with download`);
        
        // Record access
        await document.recordAccess();
        
        // Send file
        res.setHeader('Content-Type', document.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);
        res.sendFile(fullPath);
        
        console.log(`✅ File sent successfully: ${document.originalName}`);
        
    } catch (error) {
        console.error('❌ Error downloading document:', error);
        res.status(500).json({ 
            message: 'Failed to download document',
            error: error.message 
        });
    }
});

// Delete document
router.delete('/:documentId', protect, async (req, res) => {
    try {
        const { documentId } = req.params;
        
        const document = await Document.findById(documentId);
        
        if (!document || !document.isActive) {
            return res.status(404).json({ message: 'Document not found' });
        }
        
        // Only document owner can delete
        if (document.uploadedBy.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Only document owner can delete this document' });
        }
        
        // Soft delete (mark as inactive)
        document.isActive = false;
        await document.save();
        
        // Optionally, move file to archive or delete it
        // For now, we'll keep the file but mark document as inactive
        
        res.json({
            message: 'Document deleted successfully'
        });
        
    } catch (error) {
        console.error('Error deleting document:', error);
        res.status(500).json({ 
            message: 'Failed to delete document',
            error: error.message 
        });
    }
});

// Share document with lawyer
router.post('/:documentId/share', protect, async (req, res) => {
    try {
        const { documentId } = req.params;
        const { userId, permissions = 'read' } = req.body;
        
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }
        
        const document = await Document.findById(documentId);
        
        if (!document || !document.isActive) {
            return res.status(404).json({ message: 'Document not found' });
        }
        
        // Only document owner can share
        if (document.uploadedBy.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Only document owner can share this document' });
        }
        
        // Verify target user exists
        const targetUser = await VerifiedClient.findById(userId);
        if (!targetUser) {
            return res.status(404).json({ message: 'Target user not found' });
        }
        
        // Share document
        await document.shareWith(userId, permissions);
        
        res.json({
            message: `Document shared with ${targetUser.name}`,
            sharedWith: targetUser.name
        });
        
    } catch (error) {
        console.error('Error sharing document:', error);
        res.status(500).json({ 
            message: 'Failed to share document',
            error: error.message 
        });
    }
});

// Process OCR for existing document
router.post('/:documentId/process-ocr', protect, async (req, res) => {
    try {
        const { documentId } = req.params;
        const { language = 'eng', confidence_threshold = 30 } = req.body;
        
        const document = await Document.findById(documentId);
        
        if (!document || !document.isActive) {
            return res.status(404).json({ message: 'Document not found' });
        }
        
        // Check if user owns this document or has access to it
        const hasAccess = document.uploadedBy.toString() === req.user.id ||
                         document.sharedWith.some(share => share.user.toString() === req.user.id);
        
        if (!hasAccess) {
            return res.status(403).json({ message: 'Access denied to this document' });
        }
        
        // Check if document is an image
        if (!document.mimeType.startsWith('image/')) {
            return res.status(400).json({ message: 'OCR can only be performed on image files' });
        }
        
        // Check if file exists
        if (!fs.existsSync(document.filePath)) {
            return res.status(404).json({ message: 'Document file not found on server' });
        }
        
        console.log(`Processing OCR for document: ${document.originalName}`);
        
        // Perform OCR processing
        const ocrResult = await ocrService.extractTextFromImage(document.filePath, {
            lang: language,
            preprocessing: true,
            confidence_threshold: confidence_threshold
        });
        
        // Update document with OCR results
        document.extractedText = ocrResult.text;
        document.ocrProcessed = true;
        
        // Add OCR metadata
        if (!document.ocrMetadata) {
            document.ocrMetadata = {};
        }
        
        document.ocrMetadata = {
            ...document.ocrMetadata,
            lastProcessed: new Date(),
            language: language,
            confidence: ocrResult.confidence,
            wordCount: ocrResult.words?.length || 0,
            lineCount: ocrResult.lines || 0,
            paragraphCount: ocrResult.paragraphs || 0,
            processingTime: ocrResult.processingTime
        };
        
        await document.save();
        
        res.json({
            message: 'OCR processing completed successfully',
            ocrResult: {
                text: ocrResult.text,
                confidence: ocrResult.confidence,
                wordCount: ocrResult.words?.length || 0,
                language: language,
                processingTime: ocrResult.processingTime
            }
        });
        
    } catch (error) {
        console.error('Error processing OCR:', error);
        res.status(500).json({ 
            message: 'Failed to process OCR',
            error: error.message 
        });
    }
});

// Get OCR service status and supported languages
router.get('/ocr/status', protect, async (req, res) => {
    try {
        const stats = ocrService.getStats();
        const supportedLanguages = ocrService.getSupportedLanguages();
        
        res.json({
            message: 'OCR service status',
            status: {
                ...stats,
                supportedLanguages: supportedLanguages.map(code => ({
                    code: code,
                    name: getLanguageName(code)
                }))
            }
        });
    } catch (error) {
        console.error('Error getting OCR status:', error);
        res.status(500).json({ 
            message: 'Failed to get OCR status',
            error: error.message 
        });
    }
});

// Search documents by extracted text
router.get('/search', protect, async (req, res) => {
    try {
        const { query, limit = 20, caseId } = req.query;
        
        if (!query || query.trim().length < 2) {
            return res.status(400).json({ message: 'Search query must be at least 2 characters long' });
        }
        
        const searchFilter = {
            $or: [
                { uploadedBy: req.user.id },
                { 'sharedWith.user': req.user.id }
            ],
            isActive: true,
            $text: { $search: query }
        };
        
        if (caseId) {
            searchFilter.case = caseId;
        }
        
        const documents = await Document.find(searchFilter)
            .populate('uploadedBy', 'name email')
            .populate('case', 'caseNumber caseType')
            .sort({ score: { $meta: 'textScore' } })
            .limit(parseInt(limit));
        
        res.json({
            message: 'Document search completed',
            query: query,
            results: documents.length,
            documents: documents.map(doc => ({
                ...doc.toObject(),
                searchScore: doc._doc.score
            }))
        });
        
    } catch (error) {
        console.error('Error searching documents:', error);
        res.status(500).json({ 
            message: 'Failed to search documents',
            error: error.message 
        });
    }
});

// Helper function to get language names
function getLanguageName(code) {
    const languageMap = {
        'eng': 'English',
        'fra': 'French',
        'deu': 'German',
        'spa': 'Spanish',
        'ita': 'Italian',
        'por': 'Portuguese',
        'nld': 'Dutch',
        'rus': 'Russian',
        'chi_sim': 'Chinese (Simplified)',
        'chi_tra': 'Chinese (Traditional)',
        'jpn': 'Japanese',
        'kor': 'Korean',
        'ara': 'Arabic',
        'hin': 'Hindi',
        'sin': 'Sinhala',
        'tam': 'Tamil'
    };
    return languageMap[code] || code;
}

// Get document statistics for user
router.get('/stats', protect, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Get all user documents
        const documents = await Document.find({
            $or: [
                { uploadedBy: userId },
                { 'sharedWith.user': userId }
            ],
            isActive: true
        }).populate('case', 'caseNumber caseType');
        
        // Calculate statistics
        const stats = {
            total: documents.length,
            byCategory: {},
            byCases: {},
            thisWeek: 0,
            thisMonth: 0,
            shared: 0
        };
        
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        
        documents.forEach(doc => {
            // By category
            stats.byCategory[doc.category] = (stats.byCategory[doc.category] || 0) + 1;
            
            // By case
            if (doc.case) {
                const caseKey = `${doc.case.caseNumber} - ${doc.case.caseType}`;
                stats.byCases[caseKey] = (stats.byCases[caseKey] || 0) + 1;
            } else {
                stats.byCases['General Documents'] = (stats.byCases['General Documents'] || 0) + 1;
            }
            
            // Time-based stats
            if (doc.createdAt > oneWeekAgo) {
                stats.thisWeek++;
            }
            if (doc.createdAt > oneMonthAgo) {
                stats.thisMonth++;
            }
            
            // Shared documents
            if (doc.shared) {
                stats.shared++;
            }
        });
        
        res.json({
            message: 'Document statistics retrieved successfully',
            stats: stats
        });
        
    } catch (error) {
        console.error('Error fetching document statistics:', error);
        res.status(500).json({ 
            message: 'Failed to fetch document statistics',
            error: error.message 
        });
    }
});

// Test endpoint to verify document routes are working
router.get('/test', (req, res) => {
    res.status(200).json({
        message: "Document routes are working",
        timestamp: new Date().toISOString(),
        uploadsDir: uploadsDir
    });
});

// Debug endpoint to check document info
router.get('/:documentId/debug', protect, async (req, res) => {
    try {
        const { documentId } = req.params;
        console.log(`🔍 Debug request for document: ${documentId}`);
        
        const document = await Document.findById(documentId);
        
        if (!document) {
            console.log(`❌ Document not found in database: ${documentId}`);
            return res.status(404).json({ message: 'Document not found' });
        }
        
        const fullPath = path.resolve(document.filePath);
        const fileExists = fs.existsSync(fullPath);
        
        console.log(`📄 Document debug info:`, {
            originalName: document.originalName,
            filePath: document.filePath,
            resolvedPath: fullPath,
            fileExists: fileExists
        });
        
        res.json({
            documentId: document._id,
            originalName: document.originalName,
            filename: document.filename,
            filePath: document.filePath,
            resolvedPath: fullPath,
            fileExists: fileExists,
            uploadedBy: document.uploadedBy,
            isActive: document.isActive,
            fileSize: document.fileSize,
            mimeType: document.mimeType,
            uploadsDir: uploadsDir,
            userDir: path.join(uploadsDir, document.uploadedBy.toString())
        });
        
    } catch (error) {
        console.error('❌ Debug error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;