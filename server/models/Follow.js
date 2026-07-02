const mongoose = require('mongoose');

const followSchema = new mongoose.Schema({
  follower: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  following: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Compound unique index: one follow relationship per pair
followSchema.index({ follower: 1, following: 1 }, { unique: true });
followSchema.index({ follower: 1 });
followSchema.index({ following: 1 });

// Update follower/following counts after save
followSchema.post('save', async function(doc) {
  const User = mongoose.model('User');
  
  // Update follower's following count
  const followingCount = await mongoose.model('Follow').countDocuments({ follower: doc.follower });
  await User.findByIdAndUpdate(doc.follower, { followingCount });

  // Update followed user's followers count
  const followersCount = await mongoose.model('Follow').countDocuments({ following: doc.following });
  await User.findByIdAndUpdate(doc.following, { followersCount });
});

// Update counts after unfollow
followSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    const User = mongoose.model('User');
    
    const followingCount = await mongoose.model('Follow').countDocuments({ follower: doc.follower });
    await User.findByIdAndUpdate(doc.follower, { followingCount });

    const followersCount = await mongoose.model('Follow').countDocuments({ following: doc.following });
    await User.findByIdAndUpdate(doc.following, { followersCount });
  }
});

module.exports = mongoose.model('Follow', followSchema);
