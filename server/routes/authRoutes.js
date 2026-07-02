const express = require('express');
const router = express.Router();
const {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  changePassword
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validateRegister, validateLogin, validateChangePassword } = require('../middleware/validate');

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.put('/change-password', protect, validateChangePassword, changePassword);

module.exports = router;
