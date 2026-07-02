const Post = require('../models/Post');
const Like = require('../models/Like');
const Follow = require('../models/Follow');
const User = require('../models/User');
const Notification = require('../models/Notification');
const ErrorResponse = require('../utils/ErrorResponse');
const { processPostImage } = require('../utils/imageProcessor');

// @desc    Create a post
// @route   POST /api/posts
// @access  Private
exports.createPost = async (req, res, next) => {
  try {
    const { content, isDraft } = req.body;

    // Must have content or media
    if (!content && (!req.files || (!req.files.images && !req.files.video))) {
      return next(new ErrorResponse('Post must have content or media', 400));
    }

    const postData = {
      author: req.user.id,
      content: content || '',
      isDraft: isDraft === 'true' || isDraft === true
    };

    // Process uploaded images
    if (req.files && req.files.images) {
      const imagePromises = req.files.images.map(file => processPostImage(file.path));
      postData.images = await Promise.all(imagePromises);
    }

    // Process uploaded video
    if (req.files && req.files.video) {
      postData.video = `/uploads/${req.files.video[0].filename}`;
    }

    // Extract mentions from content
    if (content) {
      const mentionRegex = /@(\w+)/g;
      const mentionUsernames = [];
      let match;
      while ((match = mentionRegex.exec(content)) !== null) {
        mentionUsernames.push(match[1].toLowerCase());
      }

      if (mentionUsernames.length > 0) {
        const mentionedUsers = await User.find({
          username: { $in: mentionUsernames }
        }).select('_id');
        postData.mentions = mentionedUsers.map(u => u._id);

        // Create mention notifications
        const io = req.app.get('io');
        for (const mentionedUser of mentionedUsers) {
          if (mentionedUser._id.toString() !== req.user.id) {
            const notification = await Notification.create({
              sender: req.user.id,
              receiver: mentionedUser._id,
              type: 'mention',
              message: `${req.user.username} mentioned you in a post`
            });

            const populatedNotification = await notification.populate('sender', 'fullName username avatar');
            if (io) {
              io.to(`user:${mentionedUser._id}`).emit('notification:new', populatedNotification);
            }
          }
        }
      }
    }

    let post = await Post.create(postData);
    post = await post.populate('author', 'fullName username avatar');

    res.status(201).json({
      success: true,
      post
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all posts (paginated)
// @route   GET /api/posts
// @access  Public
exports.getPosts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const sort = req.query.sort || 'latest';

    let sortOption = { createdAt: -1 };
    if (sort === 'popular') {
      sortOption = { likesCount: -1, commentsCount: -1, createdAt: -1 };
    }

    let query = { isDraft: false };

    // Filter by hashtag
    if (req.query.hashtag) {
      query.hashtags = req.query.hashtag.toLowerCase();
    }

    const posts = await Post.find(query)
      .populate('author', 'fullName username avatar')
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean();

    // If user is authenticated, check which posts they liked
    if (req.user) {
      const postIds = posts.map(p => p._id);
      const likes = await Like.find({
        user: req.user.id,
        post: { $in: postIds }
      }).select('post');
      const likedPostIds = new Set(likes.map(l => l.post.toString()));

      posts.forEach(post => {
        post.isLiked = likedPostIds.has(post._id.toString());
      });
    }

    const total = await Post.countDocuments(query);

    res.status(200).json({
      success: true,
      count: posts.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      posts
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get home feed (posts from followed users)
// @route   GET /api/posts/feed
// @access  Private
exports.getFeed = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get users the current user follows
    const following = await Follow.find({ follower: req.user.id }).select('following');
    const followingIds = following.map(f => f.following);
    followingIds.push(req.user._id); // Include own posts

    const query = {
      author: { $in: followingIds },
      isDraft: false
    };

    const posts = await Post.find(query)
      .populate('author', 'fullName username avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Check liked status
    const postIds = posts.map(p => p._id);
    const likes = await Like.find({
      user: req.user.id,
      post: { $in: postIds }
    }).select('post');
    const likedPostIds = new Set(likes.map(l => l.post.toString()));

    posts.forEach(post => {
      post.isLiked = likedPostIds.has(post._id.toString());
    });

    const total = await Post.countDocuments(query);

    res.status(200).json({
      success: true,
      count: posts.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      posts
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get trending posts
// @route   GET /api/posts/trending
// @access  Public
exports.getTrending = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Trending = most engagement in last 7 days
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const posts = await Post.find({
      isDraft: false,
      createdAt: { $gte: weekAgo }
    })
      .populate('author', 'fullName username avatar')
      .sort({ likesCount: -1, commentsCount: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    if (req.user) {
      const postIds = posts.map(p => p._id);
      const likes = await Like.find({
        user: req.user.id,
        post: { $in: postIds }
      }).select('post');
      const likedPostIds = new Set(likes.map(l => l.post.toString()));
      posts.forEach(post => {
        post.isLiked = likedPostIds.has(post._id.toString());
      });
    }

    res.status(200).json({
      success: true,
      posts
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single post
// @route   GET /api/posts/:id
// @access  Public
exports.getPost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'fullName username avatar')
      .lean();

    if (!post) {
      return next(new ErrorResponse('Post not found', 404));
    }

    // Check if liked
    if (req.user) {
      const like = await Like.findOne({ user: req.user.id, post: post._id });
      post.isLiked = !!like;
    }

    res.status(200).json({
      success: true,
      post
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update post
// @route   PUT /api/posts/:id
// @access  Private
exports.updatePost = async (req, res, next) => {
  try {
    let post = await Post.findById(req.params.id);

    if (!post) {
      return next(new ErrorResponse('Post not found', 404));
    }

    if (post.author.toString() !== req.user.id) {
      return next(new ErrorResponse('Not authorized to update this post', 403));
    }

    const { content } = req.body;
    const updates = {};
    if (content !== undefined) updates.content = content;

    post = await Post.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('author', 'fullName username avatar');

    res.status(200).json({
      success: true,
      post
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private
exports.deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return next(new ErrorResponse('Post not found', 404));
    }

    if (post.author.toString() !== req.user.id) {
      return next(new ErrorResponse('Not authorized to delete this post', 403));
    }

    // Cascade delete likes, comments, notifications
    const Comment = require('../models/Comment');
    await Promise.all([
      Like.deleteMany({ post: post._id }),
      Comment.deleteMany({ post: post._id }),
      Notification.deleteMany({ post: post._id })
    ]);

    await Post.findByIdAndDelete(req.params.id);

    // Decrement user's post count
    await User.findByIdAndUpdate(req.user.id, { $inc: { postsCount: -1 } });

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get posts by user
// @route   GET /api/posts/user/:userId
// @access  Public
exports.getUserPosts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let userId = req.params.userId;

    // If userId is a username, find the user first
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      const user = await User.findOne({ username: userId.toLowerCase() });
      if (!user) {
        return next(new ErrorResponse('User not found', 404));
      }
      userId = user._id;
    }

    const posts = await Post.find({ author: userId, isDraft: false })
      .populate('author', 'fullName username avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    if (req.user) {
      const postIds = posts.map(p => p._id);
      const likes = await Like.find({
        user: req.user.id,
        post: { $in: postIds }
      }).select('post');
      const likedPostIds = new Set(likes.map(l => l.post.toString()));
      posts.forEach(post => {
        post.isLiked = likedPostIds.has(post._id.toString());
      });
    }

    const total = await Post.countDocuments({ author: userId, isDraft: false });

    res.status(200).json({
      success: true,
      count: posts.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      posts
    });
  } catch (err) {
    next(err);
  }
};
