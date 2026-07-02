const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  getUnreadCount
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getNotifications);
router.put('/read', protect, markAsRead);
router.get('/unread-count', protect, getUnreadCount);

module.exports = router;
