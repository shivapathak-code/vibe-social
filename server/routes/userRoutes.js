const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUser,
  updateUser,
  updateCover,
  deleteUser,
  getSuggestedUsers
} = require('../controllers/userController');
const { protect, optionalAuth } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');
const { validateUpdateProfile } = require('../middleware/validate');

// Public routes
router.get('/suggested', protect, getSuggestedUsers);
router.get('/', getUsers);
router.get('/:id', optionalAuth, getUser);

// Protected routes
router.put('/:id', protect, uploadSingle, validateUpdateProfile, updateUser);
router.put('/:id/cover', protect, uploadSingle, updateCover);
router.delete('/:id', protect, deleteUser);

module.exports = router;
