const Follow = require('../models/Follow');
const User = require('../models/User');
const Notification = require('../models/Notification');
const ErrorResponse = require('../utils/ErrorResponse');

// @desc    Follow a user
// @route   POST /api/users/:id/follow
// @access  Private
exports.followUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;

    if (req.user.id === targetUserId) {
      return next(new ErrorResponse('You cannot follow yourself', 400));
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return next(new ErrorResponse('User not found', 404));
    }

    // Check if already following
    const existingFollow = await Follow.findOne({
      follower: req.user.id,
      following: targetUserId
    });

    if (existingFollow) {
      return res.status(200).json({
        success: true,
        message: 'Already following this user',
        isFollowing: true
      });
    }

    await Follow.create({
      follower: req.user.id,
      following: targetUserId
    });

    // Create notification
    const notification = await Notification.create({
      sender: req.user.id,
      receiver: targetUserId,
      type: 'follow',
      message: `${req.user.username} started following you`
    });

    const populatedNotification = await notification.populate('sender', 'fullName username avatar');

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${targetUserId}`).emit('notification:new', populatedNotification);
    }

    // Get updated counts
    const user = await User.findById(req.user.id);
    const target = await User.findById(targetUserId);

    res.status(200).json({
      success: true,
      isFollowing: true,
      followersCount: target.followersCount,
      followingCount: user.followingCount
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Unfollow a user
// @route   DELETE /api/users/:id/follow
// @access  Private
exports.unfollowUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;

    const follow = await Follow.findOneAndDelete({
      follower: req.user.id,
      following: targetUserId
    });

    if (!follow) {
      return res.status(200).json({
        success: true,
        message: 'Not following this user',
        isFollowing: false
      });
    }

    // Get updated counts
    const user = await User.findById(req.user.id);
    const target = await User.findById(targetUserId);

    res.status(200).json({
      success: true,
      isFollowing: false,
      followersCount: target ? target.followersCount : 0,
      followingCount: user.followingCount
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get user's followers
// @route   GET /api/users/:id/followers
// @access  Public
exports.getFollowers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const follows = await Follow.find({ following: req.params.id })
      .populate('follower', 'fullName username avatar bio')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Follow.countDocuments({ following: req.params.id });

    // Check which ones the current user follows back
    let followers = follows.map(f => f.follower.toObject());
    if (req.user) {
      const followerIds = followers.map(f => f._id);
      const myFollows = await Follow.find({
        follower: req.user.id,
        following: { $in: followerIds }
      }).select('following');
      const myFollowingIds = new Set(myFollows.map(f => f.following.toString()));

      followers = followers.map(f => ({
        ...f,
        isFollowing: myFollowingIds.has(f._id.toString())
      }));
    }

    res.status(200).json({
      success: true,
      count: followers.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      users: followers
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get user's following
// @route   GET /api/users/:id/following
// @access  Public
exports.getFollowing = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const follows = await Follow.find({ follower: req.params.id })
      .populate('following', 'fullName username avatar bio')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Follow.countDocuments({ follower: req.params.id });

    let following = follows.map(f => f.following.toObject());
    if (req.user) {
      const followingIds = following.map(f => f._id);
      const myFollows = await Follow.find({
        follower: req.user.id,
        following: { $in: followingIds }
      }).select('following');
      const myFollowingIds = new Set(myFollows.map(f => f.following.toString()));

      following = following.map(f => ({
        ...f,
        isFollowing: myFollowingIds.has(f._id.toString())
      }));
    }

    res.status(200).json({
      success: true,
      count: following.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      users: following
    });
  } catch (err) {
    next(err);
  }
};
