const express = require('express');
const router = express.Router();
const {
  addComment,
  getComments,
  updateComment,
  deleteComment
} = require('../controllers/commentController');
const { protect } = require('../middleware/auth');
const { validateComment } = require('../middleware/validate');

router.post('/', protect, validateComment, addComment);
router.get('/post/:postId', getComments);
router.put('/:id', protect, validateComment, updateComment);
router.delete('/:id', protect, deleteComment);

module.exports = router;
