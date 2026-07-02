const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  }
}, {
  timestamps: true
});

// Compound unique index: one like per user per post
likeSchema.index({ user: 1, post: 1 }, { unique: true });
likeSchema.index({ post: 1 });

// Update post like count after save
likeSchema.post('save', async function(doc) {
  const Post = mongoose.model('Post');
  const count = await mongoose.model('Like').countDocuments({ post: doc.post });
  await Post.findByIdAndUpdate(doc.post, { likesCount: count });
});

// Update post like count after remove
likeSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    const Post = mongoose.model('Post');
    const count = await mongoose.model('Like').countDocuments({ post: doc.post });
    await Post.findByIdAndUpdate(doc.post, { likesCount: count });
  }
});

module.exports = mongoose.model('Like', likeSchema);
