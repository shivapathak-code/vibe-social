const { Server } = require('socket.io');

// Track online users: Map<userId, Set<socketId>>
const onlineUsers = new Map();

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5000',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // User comes online
    socket.on('user:online', (userId) => {
      if (!userId) return;
      
      if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set());
      }
      onlineUsers.get(userId).add(socket.id);
      socket.userId = userId;
      socket.join(`user:${userId}`);

      // Broadcast online status
      io.emit('user:status', { userId, status: 'online' });
    });

    // Send notification to specific user
    socket.on('notification:send', (data) => {
      const { receiverId, notification } = data;
      io.to(`user:${receiverId}`).emit('notification:new', notification);
    });

    // User typing in comments
    socket.on('typing:start', (data) => {
      socket.to(`post:${data.postId}`).emit('typing:update', {
        userId: data.userId,
        username: data.username,
        isTyping: true
      });
    });

    socket.on('typing:stop', (data) => {
      socket.to(`post:${data.postId}`).emit('typing:update', {
        userId: data.userId,
        username: data.username,
        isTyping: false
      });
    });

    // Join post room for real-time comments
    socket.on('post:join', (postId) => {
      socket.join(`post:${postId}`);
    });

    socket.on('post:leave', (postId) => {
      socket.leave(`post:${postId}`);
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
      
      if (socket.userId) {
        const userSockets = onlineUsers.get(socket.userId);
        if (userSockets) {
          userSockets.delete(socket.id);
          if (userSockets.size === 0) {
            onlineUsers.delete(socket.userId);
            io.emit('user:status', { userId: socket.userId, status: 'offline' });
          }
        }
      }
    });
  });

  return io;
};

const getOnlineUsers = () => {
  return Array.from(onlineUsers.keys());
};

const isUserOnline = (userId) => {
  return onlineUsers.has(userId);
};

module.exports = { initializeSocket, getOnlineUsers, isUserOnline };
