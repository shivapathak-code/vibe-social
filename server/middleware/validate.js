const { body, validationResult } = require('express-validator');

// Handle validation results
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map(e => e.msg);
    return res.status(400).json({
      success: false,
      message: messages[0],
      errors: messages
    });
  }
  next();
};

// Registration validation
const validateRegister = [
  body('fullName')
    .trim()
    .notEmpty().withMessage('Full name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Full name must be between 2 and 50 characters'),
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3, max: 30 }).withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores')
    .toLowerCase(),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  handleValidation
];

// Login validation
const validateLogin = [
  body('login')
    .trim()
    .notEmpty().withMessage('Email or username is required'),
  body('password')
    .notEmpty().withMessage('Password is required'),
  handleValidation
];

// Update profile validation
const validateUpdateProfile = [
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Full name must be between 2 and 50 characters'),
  body('bio')
    .optional()
    .isLength({ max: 160 }).withMessage('Bio cannot exceed 160 characters'),
  body('website')
    .optional()
    .trim(),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Location cannot exceed 100 characters'),
  handleValidation
];

// Change password validation
const validateChangePassword = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  handleValidation
];

// Post validation
const validatePost = [
  body('content')
    .optional()
    .isLength({ max: 2200 }).withMessage('Post content cannot exceed 2200 characters'),
  handleValidation
];

// Comment validation
const validateComment = [
  body('content')
    .trim()
    .notEmpty().withMessage('Comment content is required')
    .isLength({ max: 1000 }).withMessage('Comment cannot exceed 1000 characters'),
  handleValidation
];

module.exports = {
  validateRegister,
  validateLogin,
  validateUpdateProfile,
  validateChangePassword,
  validatePost,
  validateComment
};
