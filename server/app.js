const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
const commentRoutes = require('./routes/commentRoutes');
const followRoutes = require('./routes/followRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const searchRoutes = require('./routes/searchRoutes');

// Middleware imports
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// --------------- Security Middleware ---------------

// Helmet for secure HTTP headers (relaxed CSP for dev)
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per window
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many authentication attempts, please try again later.' }
});
app.use('/api/auth/', authLimiter);

// --------------- Body Parsing Middleware ---------------

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// --------------- Logging ---------------

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// --------------- Static Files ---------------

// Serve the client
app.use(express.static(path.join(__dirname, '..', 'client')));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --------------- API Routes ---------------

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/users', followRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/search', searchRoutes);

// API health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Vibe Social API is running 🚀', timestamp: new Date().toISOString() });
});

// --------------- Client-side Routing ---------------

// Serve HTML pages for client routes
const clientPages = ['login', 'register', 'feed', 'profile', 'settings', 'search'];
clientPages.forEach(page => {
  app.get(`/${page}`, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', `${page}.html`));
  });
  app.get(`/${page}.html`, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', `${page}.html`));
  });
});

// Profile by username
app.get('/user/:username', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'profile.html'));
});

// Catch-all: serve index.html
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '..', 'client', 'index.html'));
});

// --------------- Error Handler ---------------

app.use(errorHandler);

module.exports = app;
