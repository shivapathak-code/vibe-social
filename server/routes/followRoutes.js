const express = require('express');
const router = express.Router();
const {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing
} = require('../controllers/followController');
const { protect, optionalAuth } = require('../middleware/auth');

router.post('/:id/follow', protect, followUser);
router.delete('/:id/follow', protect, unfollowUser);
router.get('/:id/followers', optionalAuth, getFollowers);
router.get('/:id/following', optionalAuth, getFollowing);

module.exports = router;
