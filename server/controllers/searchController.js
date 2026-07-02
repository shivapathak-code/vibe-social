const User = require('../models/User');
const Post = require('../models/Post');
const ErrorResponse = require('../utils/ErrorResponse');

// @desc    Search users, posts, hashtags
// @route   GET /api/search
// @access  Public
exports.search = async (req, res, next) => {
  try {
    const { q, type } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (!q || q.trim().length === 0) {
      return res.status(200).json({
        success: true,
        users: [],
        posts: [],
        hashtags: []
      });
    }

    const query = q.trim();
    const results = {};

    // Search users
    if (!type || type === 'users') {
      const users = await User.find({
        $or: [
          { username: { $regex: query, $options: 'i' } },
          { fullName: { $regex: query, $options: 'i' } }
        ]
      })
        .select('fullName username avatar bio followersCount')
        .sort({ followersCount: -1 })
        .skip(type === 'users' ? skip : 0)
        .limit(type === 'users' ? limit : 5);

      results.users = users;

      if (type === 'users') {
        const total = await User.countDocuments({
          $or: [
            { username: { $regex: query, $options: 'i' } },
            { fullName: { $regex: query, $options: 'i' } }
          ]
        });
        results.totalUsers = total;
        results.pages = Math.ceil(total / limit);
      }
    }

    // Search posts
    if (!type || type === 'posts') {
      const posts = await Post.find({
        content: { $regex: query, $options: 'i' },
        isDraft: false
      })
        .populate('author', 'fullName username avatar')
        .sort({ createdAt: -1 })
        .skip(type === 'posts' ? skip : 0)
        .limit(type === 'posts' ? limit : 5);

      results.posts = posts;

      if (type === 'posts') {
        const total = await Post.countDocuments({
          content: { $regex: query, $options: 'i' },
          isDraft: false
        });
        results.totalPosts = total;
        results.pages = Math.ceil(total / limit);
      }
    }

    // Search hashtags
    if (!type || type === 'hashtags') {
      const hashtagResults = await Post.aggregate([
        { $unwind: '$hashtags' },
        { $match: { hashtags: { $regex: query, $options: 'i' } } },
        {
          $group: {
            _id: '$hashtags',
            count: { $sum: 1 },
            lastUsed: { $max: '$createdAt' }
          }
        },
        { $sort: { count: -1 } },
        { $skip: type === 'hashtags' ? skip : 0 },
        { $limit: type === 'hashtags' ? limit : 10 }
      ]);

      results.hashtags = hashtagResults.map(h => ({
        name: h._id,
        count: h.count,
        lastUsed: h.lastUsed
      }));
    }

    results.success = true;
    results.page = page;

    res.status(200).json(results);
  } catch (err) {
    next(err);
  }
};

// @desc    Get trending hashtags
// @route   GET /api/search/trending
// @access  Public
exports.getTrendingHashtags = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const hashtags = await Post.aggregate([
      { $match: { createdAt: { $gte: weekAgo }, isDraft: false } },
      { $unwind: '$hashtags' },
      {
        $group: {
          _id: '$hashtags',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: limit }
    ]);

    res.status(200).json({
      success: true,
      hashtags: hashtags.map(h => ({
        name: h._id,
        count: h.count
      }))
    });
  } catch (err) {
    next(err);
  }
};
