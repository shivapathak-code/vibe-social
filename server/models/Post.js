const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Post must have an author'],
    index: true
  },
  content: {
    type: String,
    maxlength: [2200, 'Post content cannot exceed 2200 characters'],
    default: ''
  },
  images: [{
    type: String // URL paths to uploaded images
  }],
  video: {
    type: String, // URL path to uploaded video
    default: ''
  },
  hashtags: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  likesCount: {
    type: Number,
    default: 0
  },
  commentsCount: {
    type: Number,
    default: 0
  },
  isDraft: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
postSchema.index({ createdAt: -1 });
postSchema.index({ hashtags: 1 });
postSchema.index({ content: 'text' });

// Virtual for comments
postSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'post',
  justOne: false
});

// Extract hashtags and mentions from content before saving
postSchema.pre('save', function(next) {
  if (this.isModified('content') && this.content) {
    // Extract hashtags
    const hashtagRegex = /#(\w+)/g;
    const hashtags = [];
    let match;
    while ((match = hashtagRegex.exec(this.content)) !== null) {
      hashtags.push(match[1].toLowerCase());
    }
    this.hashtags = [...new Set(hashtags)];
  }
  next();
});

// Update user's post count after save
postSchema.post('save', async function(doc) {
  if (!doc.isDraft) {
    const User = mongoose.model('User');
    await User.findByIdAndUpdate(doc.author, {
      $inc: { postsCount: 1 }
    });
  }
});

module.exports = mongoose.model('Post', postSchema);
