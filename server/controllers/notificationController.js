const Notification = require('../models/Notification');
const ErrorResponse = require('../utils/ErrorResponse');

// @desc    Get user's notifications
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ receiver: req.user.id })
      .populate('sender', 'fullName username avatar')
      .populate('post', 'content images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Notification.countDocuments({ receiver: req.user.id });
    const unreadCount = await Notification.countDocuments({
      receiver: req.user.id,
      read: false
    });

    res.status(200).json({
      success: true,
      count: notifications.length,
      total,
      unreadCount,
      page,
      pages: Math.ceil(total / limit),
      notifications
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Mark notifications as read
// @route   PUT /api/notifications/read
// @access  Private
exports.markAsRead = async (req, res, next) => {
  try {
    const { notificationIds } = req.body;

    if (notificationIds && notificationIds.length > 0) {
      // Mark specific notifications
      await Notification.updateMany(
        { _id: { $in: notificationIds }, receiver: req.user.id },
        { read: true }
      );
    } else {
      // Mark all as read
      await Notification.updateMany(
        { receiver: req.user.id, read: false },
        { read: true }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Notifications marked as read'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
exports.getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({
      receiver: req.user.id,
      read: false
    });

    res.status(200).json({
      success: true,
      unreadCount: count
    });
  } catch (err) {
    next(err);
  }
};
