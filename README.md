# Vibe Social 🚀

Vibe Social is a **production-ready, premium full-stack social media platform** built with Node.js, Express, MongoDB, and Vanilla JavaScript. It features glassmorphism, responsive CSS Grid layout (supporting Apple, Instagram, Threads, and X aesthetic styles), and instant real-time notifications/commenting via WebSockets (Socket.IO).

## Features

- 👤 **Complete User Profiles**: Avatars, cover headers, bios, dynamic follower lists, counts, locations, and site links.
- 🔐 **Robust Security**: JWT authorization stored in Secure HTTP cookies, password hashing with bcrypt, express rate limiting, helmet HTTP protection, and express validators.
- 📝 **Vibe Composer**: Write rich text posts with hashtags (#), mentions (@), save drafts, and upload multiple images or videos.
- 💬 **Interactive Commentary**: Nested comment threads, real-time comment synchronization, double-tap heart bursts, and toast notifications.
- 🔍 **Unified Explore**: Unified search for posts, users, or hashtag vibes, accompanied by a list of trending vibes in the last 7 days.
- ⚙️ **Custom settings**: Set accounts to private, change passwords, and toggle dark/light theme options with system sync.
- 📱 **PWA & Offline capability**: Complete installability with custom service worker caching.

---

## Getting Started

### Prerequisites
- Node.js (v16+)
- MongoDB running locally or a MongoDB Atlas URI string.

### 1. Installation
Install the project dependencies:
```bash
npm install
```

### 2. Environment Setup
Configure your `.env` variables. Open the `.env` file in the root folder and add your MongoDB Atlas credentials:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/vibe_social?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30
NODE_ENV=development
CLIENT_URL=http://localhost:5000
```

### 3. Database Seeding (Optional)
Pre-populate the database with mock profiles, connections, posts, and likes:
```bash
npm run seed
```

### 4. Running the App
Start the development server (uses `nodemon` for auto-reloading):
```bash
npm run dev
```

Open your browser and navigate to `http://localhost:5000`.

---

## Code Architecture

```text
social-media-app/
├── client/
│   ├── index.html           # Landing Splash Page
│   ├── login.html           # Login Portal
│   ├── register.html        # Register Page
│   ├── feed.html            # Main User Feed & Notifications
│   ├── profile.html         # User Profiles
│   ├── settings.html        # Settings Portal
│   ├── search.html          # Unified Search
│   ├── css/
│   │   ├── variables.css    # Typography, Gradients, Colors
│   │   ├── base.css         # Resets & Basics
│   │   ├── animations.css   # Keyframe libraries
│   │   ├── components.css   # Modals, Buttons, Forms
│   │   ├── layout.css       # CSS Grid & Mobile bar
│   │   ├── pages.css        # Page Specific placements
│   │   └── dark-mode.css    # Dark mode color overrides
│   ├── js/                  # Page scripts & API logic wrappers
│   └── sw.js                # PWA Service Worker caching
├── server/
│   ├── config/              # DB & Socket configurations
│   ├── controllers/         # API business logic
│   ├── middleware/          # JWT protect, upload filters, validators
│   ├── models/              # User, Post, Comment, Like schemas
│   ├── routes/              # Express Router mappings
│   ├── utils/               # Image compression, Custom error response
│   └── app.js               # Express application initialization
└── server.js                # Server entry point
```
