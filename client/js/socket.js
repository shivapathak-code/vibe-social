const Socket = {
  socket: null,

  connect: (userId) => {
    if (Socket.socket) return;

    if (typeof io === 'undefined') {
      console.warn('Socket.IO client library not loaded');
      return;
    }

    Socket.socket = io(window.CONFIG.SOCKET_URL);

    Socket.socket.on('connect', () => {
      console.log('🔌 Connected to real-time sync server');
      Socket.socket.emit('user:online', userId);
    });

    // Handle new notification
    Socket.socket.on('notification:new', (notification) => {
      // Trigger badge update
      if (window.Notifications) {
        window.Notifications.incrementBadge();
      }
      
      // Trigger toast
      window.Utils.showToast(
        'New Notification',
        notification.message,
        'info'
      );
    });

    // Handle real-time comments on active posts
    Socket.socket.on('comment:new', (comment) => {
      const container = document.getElementById('comments-list-container');
      if (container && window.activeCommentPostId === comment.post) {
        // Build and prepend/append comment
        const commentEl = document.createElement('div');
        commentEl.style.padding = 'var(--space-3)';
        commentEl.style.borderBottom = '1px solid var(--border-light)';
        commentEl.className = 'animate-fade-in-up';
        
        const avatarStr = comment.author.avatar 
          ? `<img src="${comment.author.avatar}" alt="avatar">` 
          : comment.author.fullName.charAt(0);

        commentEl.innerHTML = `
          <div style="display: flex; gap: var(--space-2); align-items: flex-start;">
            <div class="avatar avatar-sm">${avatarStr}</div>
            <div style="flex: 1;">
              <div style="display: flex; justify-content: space-between;">
                <span style="font-weight: 600; font-size: var(--text-xs);">${comment.author.fullName}</span>
                <span style="font-size: 10px; color: var(--text-tertiary);">Just now</span>
              </div>
              <p style="font-size: var(--text-sm); margin-top: 2px;">${comment.content}</p>
            </div>
          </div>
        `;
        container.prepend(commentEl);
      }
    });

    window.socket = Socket.socket;
  },

  disconnect: () => {
    if (Socket.socket) {
      Socket.socket.disconnect();
      Socket.socket = null;
      window.socket = null;
    }
  }
};

window.Socket = Socket;
