const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: [true, 'Comment must belong to a post'],
    index: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Comment must have an author']
  },
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    trim: true,
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for fetching comments by post, sorted by date
commentSchema.index({ post: 1, createdAt: 1 });
commentSchema.index({ parentComment: 1 });

// Virtual for nested replies
commentSchema.virtual('replies', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'parentComment',
  justOne: false
});

// Update post comment count after save
commentSchema.post('save', async function(doc) {
  const Post = mongoose.model('Post');
  const count = await mongoose.model('Comment').countDocuments({ post: doc.post });
  await Post.findByIdAndUpdate(doc.post, { commentsCount: count });
});

// Update post comment count after remove
commentSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    const Post = mongoose.model('Post');
    const count = await mongoose.model('Comment').countDocuments({ post: doc.post });
    await Post.findByIdAndUpdate(doc.post, { commentsCount: count });
  }
});

module.exports = mongoose.model('Comment', commentSchema);
