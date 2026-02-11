const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema({
  fieldName: {
    type: String,
    required: true,
    trim: true
  },
  fieldType: {
    type: String,
    enum: ['text', 'textarea', 'date', 'number', 'email', 'phone', 'dropdown', 'checkbox', 'radio', 'file'],
    required: true
  },
  label: {
    type: String,
    required: true,
    trim: true
  },
  placeholder: {
    type: String,
    default: ''
  },
  required: {
    type: Boolean,
    default: false
  },
  validation: {
    type: String,
    default: ''
  },
  options: [{
    value: String,
    label: String
  }],
  defaultValue: {
    type: String,
    default: ''
  },
  helpText: {
    type: String,
    default: ''
  },
  order: {
    type: Number,
    default: 0
  }
});

const documentTemplateSchema = new mongoose.Schema({
  templateId: {
    type: String,
    unique: true,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Court Filing', 'Family Law', 'Property Law', 'Business Law', 
      'Criminal Law', 'Consumer Rights', 'Employment Law', 'Immigration',
      'Personal Injury', 'Estate Planning', 'General Legal'
    ]
  },
  intendedFor: {
    type: String,
    enum: ['client', 'lawyer', 'both'],
    default: 'both',
    required: true
  },
  subcategory: {
    type: String,
    trim: true
  },
  documentType: {
    type: String,
    required: true,
    enum: [
      'Plaint', 'Affidavit', 'Motion', 'Notice', 'Summons', 'Order', 'Agreement',
      'Application', 'Petition', 'Statement', 'Contract', 'Deed',
      'Certificate', 'Declaration', 'Form', 'Other'
    ]
  },
  fields: [fieldSchema],
  templateContent: {
    type: String,
    required: true
  },
  courtSpecific: {
    type: Boolean,
    default: false
  },
  applicableDistricts: [{
    type: String,
    enum: [
      'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
      'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
      'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
      'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
      'Moneragala', 'Ratnapura', 'Kegalle', 'All'
    ]
  }],
  languages: {
    type: [String],
    enum: ['en', 'si', 'ta'],
    default: ['en']
  },
  complexity: {
    type: String,
    enum: ['simple', 'intermediate', 'complex'],
    default: 'simple'
  },
  estimatedTime: {
    type: Number, // in minutes
    default: 15
  },
  requiredDocuments: [{
    type: String,
    trim: true
  }],
  filingFee: {
    type: Number,
    default: 0
  },
  courtFees: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPopular: {
    type: Boolean,
    default: false
  },
  usageCount: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  tags: [{
    type: String,
    trim: true
  }],
  version: {
    type: Number,
    default: 1
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff'
  },
  metadata: {
    wordCount: Number,
    pageCount: Number,
    lastUsed: Date,
    downloadCount: Number
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
documentTemplateSchema.index({ category: 1, isActive: 1 });
// Note: templateId already has unique index from schema definition
documentTemplateSchema.index({ tags: 1 });
documentTemplateSchema.index({ applicableDistricts: 1 });
documentTemplateSchema.index({ isPopular: 1, usageCount: -1 });

// Pre-save middleware to generate templateId
documentTemplateSchema.pre('save', function(next) {
  if (!this.templateId) {
    const timestamp = Date.now().toString();
    const randomStr = Math.random().toString(36).substr(2, 6).toUpperCase();
    this.templateId = `TMP-${timestamp}-${randomStr}`;
  }
  next();
});

// Method to generate document from template
documentTemplateSchema.methods.generateDocument = function(formData) {
  let content = this.templateContent;
  
  // Replace placeholders with form data
  this.fields.forEach(field => {
    const placeholder = `{{${field.fieldName}}}`;
    const value = formData[field.fieldName] || field.defaultValue || '';
    content = content.replace(new RegExp(placeholder, 'g'), value);
  });
  
  return content;
};

// Method to validate form data
documentTemplateSchema.methods.validateFormData = function(formData) {
  const errors = {};
  
  this.fields.forEach(field => {
    if (field.required && (!formData[field.fieldName] || formData[field.fieldName].toString().trim() === '')) {
      errors[field.fieldName] = `${field.label} is required`;
    }
    
    // Add custom validation logic here
    if (formData[field.fieldName] && field.validation) {
      // Implement validation rules
    }
  });
  
  return errors;
};

// Static method to get templates by category
documentTemplateSchema.statics.getByCategory = function(category, options = {}) {
  const query = { category, isActive: true };
  
  if (options.district) {
    query.$or = [
      { applicableDistricts: 'All' },
      { applicableDistricts: options.district }
    ];
  }
  
  return this.find(query)
    .sort({ isPopular: -1, usageCount: -1, rating: -1 })
    .limit(options.limit || 50);
};

// Static method to search templates
documentTemplateSchema.statics.searchTemplates = function(searchQuery, options = {}) {
  const query = {
    isActive: true,
    $or: [
      { name: { $regex: searchQuery, $options: 'i' } },
      { description: { $regex: searchQuery, $options: 'i' } },
      { tags: { $in: [new RegExp(searchQuery, 'i')] } }
    ]
  };
  
  if (options.category) {
    query.category = options.category;
  }
  
  return this.find(query)
    .sort({ isPopular: -1, usageCount: -1, rating: -1 })
    .limit(options.limit || 20);
};

module.exports = mongoose.model('DocumentTemplate', documentTemplateSchema);
