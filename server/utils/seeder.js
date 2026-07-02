const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

// Load environment config
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Follow = require('../models/Follow');
const Like = require('../models/Like');
const Notification = require('../models/Notification');

const sampleUsers = [
  {
    fullName: 'Alex Rivera',
    username: 'alexrivera',
    email: 'alex@vibe.com',
    bio: 'Digital artist & product designer. Designing the future of social vibe. 🚀',
    website: 'alexrivera.dev',
    location: 'San Francisco, CA'
  },
  {
    fullName: 'Sarah Chen',
    username: 'sarahchen',
    email: 'sarah@vibe.com',
    bio: 'Software engineer building web apps. Lover of matcha lattes & clean code. 🍵💻',
    website: 'sarahchen.io',
    location: 'Seattle, WA'
  },
  {
    fullName: 'Marcus Thompson',
    username: 'marcus_t',
    email: 'marcus@vibe.com',
    bio: 'Photographer traveling the world. Capturing small moments with big details. 📸✨',
    website: 'marcusthompson.co',
    location: 'London, UK'
  },
  {
    fullName: 'Elena Rostova',
    username: 'elena_r',
    email: 'elena@vibe.com',
    bio: 'Coffee connoisseur, product consultant, and yoga enthusiast. Vibe high. 🧘‍♀️✨',
    website: 'elenarostova.me',
    location: 'Berlin, DE'
  }
];

const samplePosts = [
  {
    content: 'Just launched Vibe Social! Super excited to share this sleek, glassmorphic layout. Clean codebase, ultra-responsive grid, and instant real-time comment synchronization. What do you guys think? #launch #webdev #designsystem',
  },
  {
    content: 'Good morning! Started my day with a matcha latte and an elegant debugging session. Resolved some interesting race conditions in the feed pipeline. Feels good! 🍵💻 #engineerlife #developer #debugging',
  },
  {
    content: 'Golden hour in London today. The light reflecting off the Thames is absolutely magical. Here is a reminder to appreciate the small details. 🌅📸 #photography #travel #londonvibes',
  },
  {
    content: 'Reminder: The best system is the one that gets out of your way. Prioritize simplicity, responsive typography, and accessibility in everything you design. #productdesign #uxui #tips'
  }
];

const seedDB = async () => {
  try {
    console.log('🔄 Connecting to Database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected. Wiping legacy collections...');

    // Wipe existing records
    await Promise.all([
      User.deleteMany({}),
      Post.deleteMany({}),
      Comment.deleteMany({}),
      Follow.deleteMany({}),
      Like.deleteMany({}),
      Notification.deleteMany({})
    ]);

    console.log('📦 Seeding sample users...');
    // Hash passwords and save users
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash('password123', salt);

    const userPromises = sampleUsers.map(u => {
      return User.create({
        ...u,
        password: passwordHash
      });
    });
    const createdUsers = await Promise.all(userPromises);
    console.log(`✅ Seeded ${createdUsers.length} users (Default password: password123)`);

    console.log('📦 Seeding posts...');
    const postPromises = samplePosts.map((p, index) => {
      // Rotate authors
      const author = createdUsers[index % createdUsers.length];
      return Post.create({
        ...p,
        author: author._id
      });
    });
    const createdPosts = await Promise.all(postPromises);
    console.log(`✅ Seeded ${createdPosts.length} posts`);

    console.log('📦 Building social connections (follows)...');
    // Alex follows Sarah & Marcus. Sarah follows Alex.
    await Follow.create({ follower: createdUsers[0]._id, following: createdUsers[1]._id });
    await Follow.create({ follower: createdUsers[0]._id, following: createdUsers[2]._id });
    await Follow.create({ follower: createdUsers[1]._id, following: createdUsers[0]._id });
    await Follow.create({ follower: createdUsers[2]._id, following: createdUsers[0]._id });

    // Sync follower/following count cache
    for (const user of createdUsers) {
      const followers = await Follow.countDocuments({ following: user._id });
      const following = await Follow.countDocuments({ follower: user._id });
      const postsCount = await Post.countDocuments({ author: user._id });
      await User.findByIdAndUpdate(user._id, { followersCount: followers, followingCount: following, postsCount });
    }
    console.log('✅ Synchronized social follower statistics');

    console.log('📦 Seeding interactions (likes & comments)...');
    // Sarah likes Alex's post
    await Like.create({ user: createdUsers[1]._id, post: createdPosts[0]._id });
    // Marcus likes Alex's post
    await Like.create({ user: createdUsers[2]._id, post: createdPosts[0]._id });

    // Sarah comments on Alex's post
    const comment = await Comment.create({
      post: createdPosts[0]._id,
      author: createdUsers[1]._id,
      content: 'This looks incredibly premium, Alex! The transitions are so smooth. Double-tap to like feels magical.'
    });

    // Alex replies to Sarah's comment
    await Comment.create({
      post: createdPosts[0]._id,
      author: createdUsers[0]._id,
      content: 'Thanks, Sarah! Means a lot coming from you. Let me know if you run into any performance kinks.',
      parentComment: comment._id
    });

    // Update counts
    await Post.findByIdAndUpdate(createdPosts[0]._id, {
      likesCount: 2,
      commentsCount: 2
    });

    console.log('✅ Seed completed successfully! 🎉');
    process.exit(0);

  } catch (error) {
    console.error('❌ Seeder encountered error:', error);
    process.exit(1);
  }
};

seedDB();
