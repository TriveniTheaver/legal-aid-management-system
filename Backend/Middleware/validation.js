const Joi = require('joi');
const moment = require('moment');

// Card validation schema
const cardValidationSchema = Joi.object({
  cardNumber: Joi.string()
    .pattern(/^[0-9]{13,19}$/)
    .required()
    .messages({
      'string.pattern.base': 'Card number must be 13-19 digits',
      'any.required': 'Card number is required'
    }),
  expiryMonth: Joi.string()
    .pattern(/^(0[1-9]|1[0-2])$/)
    .required()
    .messages({
      'string.pattern.base': 'Expiry month must be 01-12',
      'any.required': 'Expiry month is required'
    }),
  expiryYear: Joi.string()
    .pattern(/^[0-9]{2,4}$/)
    .required()
    .messages({
      'string.pattern.base': 'Expiry year must be 2-4 digits',
      'any.required': 'Expiry year is required'
    }),
  cvv: Joi.string()
    .pattern(/^[0-9]{3,4}$/)
    .required()
    .messages({
      'string.pattern.base': 'CVV must be 3-4 digits',
      'any.required': 'CVV is required'
    }),
  cardholderName: Joi.string()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z\s]+$/)
    .required()
    .messages({
      'string.min': 'Cardholder name must be at least 2 characters',
      'string.max': 'Cardholder name must not exceed 50 characters',
      'string.pattern.base': 'Cardholder name must contain only letters and spaces',
      'any.required': 'Cardholder name is required'
    })
});

// User registration validation schema
const userRegistrationSchema = Joi.object({
  fullName: Joi.string()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z\s]+$/)
    .required()
    .messages({
      'string.min': 'Full name must be at least 2 characters',
      'string.max': 'Full name must not exceed 50 characters',
      'string.pattern.base': 'Full name must contain only letters and spaces',
      'any.required': 'Full name is required'
    }),
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character',
      'any.required': 'Password is required'
    }),
  phoneNumber: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({
      'string.pattern.base': 'Phone number must be exactly 10 digits',
      'any.required': 'Phone number is required'
    }),
  nic: Joi.string()
    .pattern(/^[0-9]{9}[vVxX]?$/)
    .required()
    .messages({
      'string.pattern.base': 'NIC must be 9 digits followed by V, X, or nothing',
      'any.required': 'NIC is required'
    }),
  address: Joi.string()
    .min(10)
    .max(200)
    .required()
    .messages({
      'string.min': 'Address must be at least 10 characters',
      'string.max': 'Address must not exceed 200 characters',
      'any.required': 'Address is required'
    })
});

// Case creation validation schema
const caseCreationSchema = Joi.object({
  caseType: Joi.string()
    .min(3)
    .max(50)
    .required()
    .messages({
      'string.min': 'Case type must be at least 3 characters',
      'string.max': 'Case type must not exceed 50 characters',
      'any.required': 'Case type is required'
    }),
  plaintiffName: Joi.string()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z\s]+$/)
    .required()
    .messages({
      'string.min': 'Plaintiff name must be at least 2 characters',
      'string.max': 'Plaintiff name must not exceed 50 characters',
      'string.pattern.base': 'Plaintiff name must contain only letters and spaces',
      'any.required': 'Plaintiff name is required'
    }),
  plaintiffNIC: Joi.string()
    .pattern(/^[0-9]{9}[vVxX]?$/)
    .required()
    .messages({
      'string.pattern.base': 'Plaintiff NIC must be 9 digits followed by V, X, or nothing',
      'any.required': 'Plaintiff NIC is required'
    }),
  defendantName: Joi.string()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z\s]+$/)
    .required()
    .messages({
      'string.min': 'Defendant name must be at least 2 characters',
      'string.max': 'Defendant name must not exceed 50 characters',
      'string.pattern.base': 'Defendant name must contain only letters and spaces',
      'any.required': 'Defendant name is required'
    }),
  caseDescription: Joi.string()
    .min(20)
    .max(1000)
    .required()
    .messages({
      'string.min': 'Case description must be at least 20 characters',
      'string.max': 'Case description must not exceed 1000 characters',
      'any.required': 'Case description is required'
    }),
  reliefSought: Joi.string()
    .min(10)
    .max(500)
    .required()
    .messages({
      'string.min': 'Relief sought must be at least 10 characters',
      'string.max': 'Relief sought must not exceed 500 characters',
      'any.required': 'Relief sought is required'
    }),
  caseValue: Joi.number()
    .min(0)
    .max(10000000)
    .optional()
    .messages({
      'number.min': 'Case value must be at least 0',
      'number.max': 'Case value must not exceed 10,000,000'
    }),
  district: Joi.string()
    .valid(
      "Colombo", "Gampaha", "Kalutara", "Kandy", "Matale", "Nuwara Eliya",
      "Galle", "Matara", "Hambantota", "Jaffna", "Kilinochchi", "Mannar",
      "Vavuniya", "Mullaitivu", "Batticaloa", "Ampara", "Trincomalee",
      "Kurunegala", "Puttalam", "Anuradhapura", "Polonnaruwa", "Badulla",
      "Moneragala", "Ratnapura", "Kegalle"
    )
    .required()
    .messages({
      'any.only': 'District must be one of the valid Sri Lankan districts',
      'any.required': 'District is required'
    })
});

// File upload validation
const fileUploadSchema = Joi.object({
  category: Joi.string()
    .valid(
      'Pleading', 'Evidence', 'Motion', 'Contract', 'Correspondence',
      'Court Order', 'Affidavit', 'Financial Document', 'Medical Record',
      'Property Document', 'Identity Document', 'Educational Certificate',
      'Employment Document', 'Insurance Document', 'Other'
    )
    .required()
    .messages({
      'any.only': 'Category must be one of the valid document categories',
      'any.required': 'Category is required'
    }),
  description: Joi.string()
    .max(500)
    .optional()
    .messages({
      'string.max': 'Description must not exceed 500 characters'
    })
});

// Validation middleware factory
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessages = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errorMessages
      });
    }

    req[property] = value;
    next();
  };
};

// Card expiry validation
const validateCardExpiry = (month, year) => {
  const currentDate = moment();
  const expiryDate = moment(`${year}-${month}`, 'YYYY-MM');
  
  if (expiryDate.isBefore(currentDate, 'month')) {
    return {
      isValid: false,
      message: 'Card has expired'
    };
  }
  
  return { isValid: true };
};

// File validation
const validateFile = (file, options = {}) => {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx', '.txt']
  } = options;

  const errors = [];

  // Check file size
  if (file.size > maxSize) {
    errors.push(`File size must not exceed ${maxSize / (1024 * 1024)}MB`);
  }

  // Check MIME type
  if (!allowedTypes.includes(file.mimetype)) {
    errors.push(`File type ${file.mimetype} is not allowed`);
  }

  // Check file extension
  const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
  if (!allowedExtensions.includes(fileExtension)) {
    errors.push(`File extension ${fileExtension} is not allowed`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  validate,
  cardValidationSchema,
  userRegistrationSchema,
  caseCreationSchema,
  fileUploadSchema,
  validateCardExpiry,
  validateFile
};
