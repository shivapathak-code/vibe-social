const User = require('../models/User');
const Follow = require('../models/Follow');
const ErrorResponse = require('../utils/ErrorResponse');
const { processAvatar, processCover } = require('../utils/imageProcessor');

// @desc    Get all users (paginated, searchable)
// @route   GET /api/users
// @access  Public
exports.getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    let query = {};
    if (search) {
      query = {
        $or: [
          { username: { $regex: search, $options: 'i' } },
          { fullName: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const users = await User.find(query)
      .select('-resetPasswordToken -resetPasswordExpire')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      users
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single user by ID or username
// @route   GET /api/users/:id
// @access  Public
exports.getUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Try finding by ID first, then by username
    let user;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      user = await User.findById(id);
    }
    if (!user) {
      user = await User.findOne({ username: id.toLowerCase() });
    }

    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }

    // Check if current user follows this user
    let isFollowing = false;
    if (req.user) {
      const follow = await Follow.findOne({
        follower: req.user.id,
        following: user._id
      });
      isFollowing = !!follow;
    }

    res.status(200).json({
      success: true,
      user: {
        ...user.toObject(),
        isFollowing
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/:id
// @access  Private
exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Ensure user can only update their own profile
    if (req.user.id !== id && req.user._id.toString() !== id) {
      return next(new ErrorResponse('Not authorized to update this profile', 403));
    }

    const allowedFields = ['fullName', 'bio', 'website', 'location', 'darkMode', 'isPrivate'];
    const updates = {};

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Handle avatar upload
    if (req.file) {
      updates.avatar = await processAvatar(req.file.path);
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update cover image
// @route   PUT /api/users/:id/cover
// @access  Private
exports.updateCover = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new ErrorResponse('Please upload an image', 400));
    }

    const coverImage = await processCover(req.file.path);

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { coverImage },
      { new: true }
    );

    res.status(200).json({
      success: true,
      user
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete user account
// @route   DELETE /api/users/:id
// @access  Private
exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (req.user.id !== id && req.user._id.toString() !== id) {
      return next(new ErrorResponse('Not authorized to delete this account', 403));
    }

    // Delete all user's data
    const mongoose = require('mongoose');
    const Post = require('../models/Post');
    const Comment = require('../models/Comment');
    const Like = require('../models/Like');
    const Notification = require('../models/Notification');

    await Promise.all([
      Post.deleteMany({ author: req.user.id }),
      Comment.deleteMany({ author: req.user.id }),
      Like.deleteMany({ user: req.user.id }),
      Follow.deleteMany({ $or: [{ follower: req.user.id }, { following: req.user.id }] }),
      Notification.deleteMany({ $or: [{ sender: req.user.id }, { receiver: req.user.id }] })
    ]);

    await User.findByIdAndDelete(req.user.id);

    // Clear cookie
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 5 * 1000),
      httpOnly: true
    });

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get suggested users (not followed)
// @route   GET /api/users/suggested
// @access  Private
exports.getSuggestedUsers = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    // Get IDs of users the current user follows
    const following = await Follow.find({ follower: req.user.id }).select('following');
    const followingIds = following.map(f => f.following);
    followingIds.push(req.user._id); // Exclude self

    const users = await User.aggregate([
      { $match: { _id: { $nin: followingIds } } },
      { $sample: { size: limit } },
      { $project: { password: 0, resetPasswordToken: 0, resetPasswordExpire: 0 } }
    ]);

    res.status(200).json({
      success: true,
      users
    });
  } catch (err) {
    next(err);
  }
};
