const Like = require('../models/Like');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const ErrorResponse = require('../utils/ErrorResponse');

// @desc    Like a post
// @route   POST /api/posts/:id/like
// @access  Private
exports.likePost = async (req, res, next) => {
  try {
    const postId = req.params.id;

    const post = await Post.findById(postId);
    if (!post) {
      return next(new ErrorResponse('Post not found', 404));
    }

    // Check if already liked
    const existingLike = await Like.findOne({
      user: req.user.id,
      post: postId
    });

    if (existingLike) {
      return res.status(200).json({
        success: true,
        message: 'Post already liked',
        liked: true,
        likesCount: post.likesCount
      });
    }

    await Like.create({
      user: req.user.id,
      post: postId
    });

    // Get updated count
    const likesCount = await Like.countDocuments({ post: postId });
    await Post.findByIdAndUpdate(postId, { likesCount });

    // Create notification (if not liking own post)
    if (post.author.toString() !== req.user.id) {
      const notification = await Notification.create({
        sender: req.user.id,
        receiver: post.author,
        type: 'like',
        post: postId,
        message: `${req.user.username} liked your post`
      });

      const populatedNotification = await notification.populate('sender', 'fullName username avatar');

      const io = req.app.get('io');
      if (io) {
        io.to(`user:${post.author}`).emit('notification:new', populatedNotification);
      }
    }

    res.status(200).json({
      success: true,
      liked: true,
      likesCount
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Unlike a post
// @route   DELETE /api/posts/:id/like
// @access  Private
exports.unlikePost = async (req, res, next) => {
  try {
    const postId = req.params.id;

    const like = await Like.findOneAndDelete({
      user: req.user.id,
      post: postId
    });

    if (!like) {
      return res.status(200).json({
        success: true,
        message: 'Post was not liked',
        liked: false
      });
    }

    // Get updated count
    const likesCount = await Like.countDocuments({ post: postId });
    await Post.findByIdAndUpdate(postId, { likesCount });

    res.status(200).json({
      success: true,
      liked: false,
      likesCount
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get users who liked a post
// @route   GET /api/posts/:id/likes
// @access  Public
exports.getLikes = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const likes = await Like.find({ post: req.params.id })
      .populate('user', 'fullName username avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Like.countDocuments({ post: req.params.id });

    res.status(200).json({
      success: true,
      count: likes.length,
      total,
      users: likes.map(l => l.user)
    });
  } catch (err) {
    next(err);
  }
};
