const http = require('http');
const dotenv = require('dotenv');

// Load env vars FIRST
dotenv.config();

const app = require('./app');
const connectDB = require('./config/db');
const { initializeSocket } = require('./config/socket');

// Connect to database
connectDB();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = initializeSocket(server);

// Make io accessible to controllers via app
app.set('io', io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║                                          ║
  ║     🚀 Vibe Social is running!           ║
  ║                                          ║
  ║     🌐 http://localhost:${PORT}             ║
  ║     📦 Mode: ${process.env.NODE_ENV || 'development'}           ║
  ║     🔌 Socket.IO: Active                 ║
  ║                                          ║
  ╚══════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`❌ Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error(`❌ Uncaught Exception: ${err.message}`);
  server.close(() => process.exit(1));
});

module.exports = server;
