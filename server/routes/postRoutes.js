const express = require('express');
const router = express.Router();
const {
  createPost,
  getPosts,
  getFeed,
  getTrending,
  getPost,
  updatePost,
  deletePost,
  getUserPosts
} = require('../controllers/postController');
const { likePost, unlikePost, getLikes } = require('../controllers/likeController');
const { protect, optionalAuth } = require('../middleware/auth');
const { uploadPostMedia } = require('../middleware/upload');
const { validatePost } = require('../middleware/validate');

// Public routes
router.get('/', optionalAuth, getPosts);
router.get('/trending', optionalAuth, getTrending);
router.get('/user/:userId', optionalAuth, getUserPosts);
router.get('/:id', optionalAuth, getPost);

// Protected routes
router.post('/', protect, uploadPostMedia, validatePost, createPost);
router.put('/:id', protect, validatePost, updatePost);
router.delete('/:id', protect, deletePost);

// Feed (protected)
router.get('/feed/me', protect, getFeed);

// Likes
router.post('/:id/like', protect, likePost);
router.delete('/:id/like', protect, unlikePost);
router.get('/:id/likes', getLikes);

module.exports = router;
