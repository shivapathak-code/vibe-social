const Comment = require('../models/Comment');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const ErrorResponse = require('../utils/ErrorResponse');

// @desc    Add comment to post
// @route   POST /api/comments
// @access  Private
exports.addComment = async (req, res, next) => {
  try {
    const { postId, content, parentCommentId } = req.body;

    // Verify post exists
    const post = await Post.findById(postId);
    if (!post) {
      return next(new ErrorResponse('Post not found', 404));
    }

    const commentData = {
      post: postId,
      author: req.user.id,
      content
    };

    // If it's a reply to another comment
    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      if (!parentComment) {
        return next(new ErrorResponse('Parent comment not found', 404));
      }
      commentData.parentComment = parentCommentId;
    }

    let comment = await Comment.create(commentData);
    comment = await comment.populate('author', 'fullName username avatar');

    // Create notification for post author (if not commenting on own post)
    if (post.author.toString() !== req.user.id) {
      const notificationType = parentCommentId ? 'reply' : 'comment';
      const message = parentCommentId
        ? `${req.user.username} replied to a comment on your post`
        : `${req.user.username} commented on your post`;

      const notification = await Notification.create({
        sender: req.user.id,
        receiver: post.author,
        type: notificationType,
        post: postId,
        comment: comment._id,
        message
      });

      const populatedNotification = await notification.populate('sender', 'fullName username avatar');

      // Real-time notification
      const io = req.app.get('io');
      if (io) {
        io.to(`user:${post.author}`).emit('notification:new', populatedNotification);
        io.to(`post:${postId}`).emit('comment:new', comment);
      }
    }

    // If replying to a comment, notify the parent comment author too
    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      if (parentComment && parentComment.author.toString() !== req.user.id &&
          parentComment.author.toString() !== post.author.toString()) {
        const notification = await Notification.create({
          sender: req.user.id,
          receiver: parentComment.author,
          type: 'reply',
          post: postId,
          comment: comment._id,
          message: `${req.user.username} replied to your comment`
        });

        const populatedNotification = await notification.populate('sender', 'fullName username avatar');
        const io = req.app.get('io');
        if (io) {
          io.to(`user:${parentComment.author}`).emit('notification:new', populatedNotification);
        }
      }
    }

    res.status(201).json({
      success: true,
      comment
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get comments for a post
// @route   GET /api/comments/post/:postId
// @access  Public
exports.getComments = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Get top-level comments
    const comments = await Comment.find({
      post: postId,
      parentComment: null
    })
      .populate('author', 'fullName username avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get replies for each comment
    for (let comment of comments) {
      const replies = await Comment.find({ parentComment: comment._id })
        .populate('author', 'fullName username avatar')
        .sort({ createdAt: 1 })
        .lean();
      comment.replies = replies;
    }

    const total = await Comment.countDocuments({ post: postId, parentComment: null });

    res.status(200).json({
      success: true,
      count: comments.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      comments
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update comment
// @route   PUT /api/comments/:id
// @access  Private
exports.updateComment = async (req, res, next) => {
  try {
    let comment = await Comment.findById(req.params.id);

    if (!comment) {
      return next(new ErrorResponse('Comment not found', 404));
    }

    if (comment.author.toString() !== req.user.id) {
      return next(new ErrorResponse('Not authorized to update this comment', 403));
    }

    comment = await Comment.findByIdAndUpdate(
      req.params.id,
      { content: req.body.content },
      { new: true, runValidators: true }
    ).populate('author', 'fullName username avatar');

    res.status(200).json({
      success: true,
      comment
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete comment
// @route   DELETE /api/comments/:id
// @access  Private
exports.deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return next(new ErrorResponse('Comment not found', 404));
    }

    if (comment.author.toString() !== req.user.id) {
      return next(new ErrorResponse('Not authorized to delete this comment', 403));
    }

    // Delete all replies to this comment
    await Comment.deleteMany({ parentComment: comment._id });

    await Comment.findByIdAndDelete(req.params.id);

    // Update post comment count
    const count = await Comment.countDocuments({ post: comment.post });
    await Post.findByIdAndUpdate(comment.post, { commentsCount: count });

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};
