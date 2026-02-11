const DocumentTemplate = require('../Model/DocumentTemplate');
const GeneratedDocument = require('../Model/GeneratedDocument');
const CaseModel = require('../Model/CaseModel');
const VerifiedClient = require('../Model/VerifiedClient');
const VerifiedLawyer = require('../Model/VerifiedLawyer');
const fs = require('fs');
const path = require('path');
const { generateSingleTextLegalDocument } = require('../services/singleTextPdfService');

// Get all templates with filtering and pagination
const getTemplates = async (req, res) => {
  try {
    console.log('📋 Fetching document templates...');
    
    const {
      category,
      subcategory,
      district,
      language = 'en',
      search,
      complexity,
      isPopular,
      limit = 20,
      page = 1,
      sortBy = 'usageCount',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = { isActive: true };
    
    if (category) query.category = category;
    if (subcategory) query.subcategory = subcategory;
    if (complexity) query.complexity = complexity;
    if (isPopular === 'true') query.isPopular = true;
    if (district) {
      query.$or = [
        { applicableDistricts: 'All' },
        { applicableDistricts: district }
      ];
    }
    if (language) {
      query.languages = language;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (page - 1) * limit;

    const [templates, totalCount] = await Promise.all([
      DocumentTemplate.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('createdBy', 'name email')
        .lean(),
      DocumentTemplate.countDocuments(query)
    ]);

    console.log(`✅ Found ${templates.length} templates out of ${totalCount} total`);

    res.status(200).json({
      success: true,
      data: {
        templates,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasNext: page * limit < totalCount,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('❌ Error fetching templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch templates',
      error: error.message
    });
  }
};

// Get template by ID
const getTemplateById = async (req, res) => {
  try {
    console.log('📋 Fetching template by ID:', req.params.id);
    
    const template = await DocumentTemplate.findById(req.params.id)
      .populate('createdBy', 'name email')
      .lean();

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Increment usage count
    await DocumentTemplate.findByIdAndUpdate(req.params.id, {
      $inc: { usageCount: 1 }
    });

    console.log('✅ Template fetched successfully');
    res.status(200).json({
      success: true,
      data: template
    });

  } catch (error) {
    console.error('❌ Error fetching template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch template',
      error: error.message
    });
  }
};

// Get templates by category
const getTemplatesByCategory = async (req, res) => {
  try {
    console.log('📋 Fetching templates by category:', req.params.category);
    
    const { district, language = 'en' } = req.query;
    
    const templates = await DocumentTemplate.getByCategory(req.params.category, {
      district,
      language,
      limit: 50
    });

    console.log(`✅ Found ${templates.length} templates in category ${req.params.category}`);
    
    res.status(200).json({
      success: true,
      data: templates
    });

  } catch (error) {
    console.error('❌ Error fetching templates by category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch templates by category',
      error: error.message
    });
  }
};

// Search templates
const searchTemplates = async (req, res) => {
  try {
    console.log('🔍 Searching templates:', req.query.q);
    
    const { q: searchQuery, category, limit = 20 } = req.query;
    
    if (!searchQuery) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const templates = await DocumentTemplate.searchTemplates(searchQuery, {
      category,
      limit: parseInt(limit)
    });

    console.log(`✅ Found ${templates.length} templates matching "${searchQuery}"`);
    
    res.status(200).json({
      success: true,
      data: templates
    });

  } catch (error) {
    console.error('❌ Error searching templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search templates',
      error: error.message
    });
  }
};

// Generate document from template
const generateDocument = async (req, res) => {
  try {
    console.log('📄 Generating document from template...');
    
    const { templateId, formData, caseId, clientId } = req.body;
    
    if (!templateId || !formData) {
      return res.status(400).json({
        success: false,
        message: 'Template ID and form data are required'
      });
    }

    // Get template
    const template = await DocumentTemplate.findById(templateId);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Validate form data
    const validationErrors = template.validateFormData(formData);
    if (Object.keys(validationErrors).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Form validation failed',
        errors: validationErrors
      });
    }

    // Generate document content
    const generatedContent = template.generateDocument(formData);
    
    // Calculate metadata
    const wordCount = generatedContent.split(/\s+/).length;
    const pageCount = Math.ceil(wordCount / 250); // Approximate pages

    // Create generated document record
    const generatedDoc = new GeneratedDocument({
      template: templateId,
      client: clientId || req.user.id,
      case: caseId || null,
      formData,
      generatedContent,
      documentType: template.documentType,
      metadata: {
        wordCount,
        pageCount
      }
    });

    await generatedDoc.save();

    // Update template usage count
    await DocumentTemplate.findByIdAndUpdate(templateId, {
      $inc: { usageCount: 1 }
    });

    console.log('✅ Document generated successfully:', generatedDoc.documentId);
    
    res.status(201).json({
      success: true,
      data: {
        documentId: generatedDoc.documentId,
        content: generatedContent,
        metadata: {
          wordCount,
          pageCount,
          templateName: template.name
        }
      }
    });

  } catch (error) {
    console.error('❌ Error generating document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate document',
      error: error.message
    });
  }
};

// Generate PDF from document
const generatePDF = async (req, res) => {
  try {
    console.log('📄 Generating professional PDF for document:', req.params.documentId);
    
    const document = await GeneratedDocument.findOne({ 
      documentId: req.params.documentId 
    }).populate('template', 'name category documentType');

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check access permissions
    if (document.client.toString() !== req.user.id && 
        (!document.lawyer || document.lawyer.toString() !== req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Set response headers
    const filename = document.template.name.replace(/[^a-z0-9\s]/gi, '_').replace(/\s+/g, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);

    // Generate professional PDF with enhanced styling
    const pdfBuffer = await generateSingleTextLegalDocument(document.generatedContent, {
      documentType: document.template.documentType,
      title: document.template.name,
      templateId: document.template._id,
      category: document.template.category,
      subcategory: document.template.subcategory,
      clientName: document.formData.fullName || document.formData.applicantName || 'Applicant',
      date: new Date().toLocaleDateString('en-GB'),
      formData: document.formData, // Pass all form data for field replacement
      isFormal: ['driving license', 'application', 'petition'].some(type => 
        document.template.name.toLowerCase().includes(type)
      )
    });

    // Send PDF to client
    res.send(pdfBuffer);

    // Update download count
    await document.recordDownload();

    console.log('✅ Professional PDF generated successfully');

  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF',
      error: error.message
    });
  }
};

// Get user's generated documents
const getUserDocuments = async (req, res) => {
  try {
    console.log('📄 Fetching user documents for:', req.user.id);
    
    const { status, template, limit = 20, page = 1 } = req.query;
    
    const documents = await GeneratedDocument.getByClient(req.user.id, {
      status,
      template,
      limit: parseInt(limit)
    });

    console.log(`✅ Found ${documents.length} documents for user`);
    
    res.status(200).json({
      success: true,
      data: documents
    });

  } catch (error) {
    console.error('❌ Error fetching user documents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user documents',
      error: error.message
    });
  }
};

// Update document status (for lawyers)
const updateDocumentStatus = async (req, res) => {
  try {
    console.log('📄 Updating document status...');
    
    const { documentId } = req.params;
    const { status, notes } = req.body;
    
    const document = await GeneratedDocument.findOne({ documentId });
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if user is the assigned lawyer
    if (document.lawyer && document.lawyer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await document.updateStatus(status, notes, req.user.id);

    console.log('✅ Document status updated successfully');
    
    res.status(200).json({
      success: true,
      message: 'Document status updated successfully',
      data: document
    });

  } catch (error) {
    console.error('❌ Error updating document status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update document status',
      error: error.message
      });
  }
};

// Get template categories
const getCategories = async (req, res) => {
  try {
    console.log('📋 Fetching template categories...');
    
    const categories = await DocumentTemplate.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          subcategories: { $addToSet: '$subcategory' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    console.log(`✅ Found ${categories.length} categories`);
    
    res.status(200).json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('❌ Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
};

// Get popular templates
const getPopularTemplates = async (req, res) => {
  try {
    console.log('📋 Fetching popular templates...');
    
    const { limit = 10 } = req.query;
    
    const templates = await DocumentTemplate.find({
      isActive: true,
      isPopular: true
    })
    .sort({ usageCount: -1, rating: -1 })
    .limit(parseInt(limit))
    .populate('createdBy', 'name email')
    .lean();

    console.log(`✅ Found ${templates.length} popular templates`);
    
    res.status(200).json({
      success: true,
      data: templates
    });

  } catch (error) {
    console.error('❌ Error fetching popular templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch popular templates',
      error: error.message
    });
  }
};

module.exports = {
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
};
