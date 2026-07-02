const Notifications = {
  page: 1,
  limit: 20,
  loading: false,

  init: () => {
    // Check if we are on the notifications route or page tab
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');

    // Regularly sync unread notification count badge
    Notifications.syncUnreadCount();
    setInterval(Notifications.syncUnreadCount, 45000); // Check every 45s

    // Intercept feed tabs if notifications tab parameter passed
    if (tab === 'notifications') {
      document.addEventListener('DOMContentLoaded', () => {
        Notifications.loadNotificationsPage();
      });
    }
  },

  syncUnreadCount: async () => {
    try {
      const data = await window.API.get('/notifications/unread-count');
      if (data.success) {
        Notifications.updateBadgeUI(data.unreadCount);
      }
    } catch (e) {}
  },

  updateBadgeUI: (count) => {
    const headerDot = document.getElementById('unread-notification-dot');
    const sidebarBadge = document.getElementById('unread-notification-badge');
    const mobileBadge = document.getElementById('mobile-notification-badge');

    if (count > 0) {
      if (headerDot) headerDot.classList.remove('hidden');
      
      if (sidebarBadge) {
        sidebarBadge.textContent = count;
        sidebarBadge.classList.remove('hidden');
      }

      if (mobileBadge) {
        mobileBadge.textContent = count;
        mobileBadge.classList.remove('hidden');
      }
    } else {
      if (headerDot) headerDot.classList.add('hidden');
      if (sidebarBadge) sidebarBadge.classList.add('hidden');
      if (mobileBadge) mobileBadge.classList.add('hidden');
    }
  },

  incrementBadge: () => {
    const sidebarBadge = document.getElementById('unread-notification-badge');
    let current = 0;
    if (sidebarBadge && !sidebarBadge.classList.contains('hidden')) {
      current = parseInt(sidebarBadge.textContent) || 0;
    }
    Notifications.updateBadgeUI(current + 1);
  },

  loadNotificationsPage: async () => {
    const container = document.getElementById('posts-container');
    if (!container) return;

    // Change Following/Trending header layout title to notifications context
    const header = document.querySelector('.feed-header h2');
    if (header) header.textContent = 'Notifications';

    // Hide tabs
    const tabs = document.querySelector('.tabs');
    if (tabs) tabs.classList.add('hidden');

    // Hide post composer
    const composer = document.querySelector('.post-composer');
    if (composer) composer.classList.add('hidden');

    container.innerHTML = '<div style="display:flex; justify-content:center; padding:var(--space-12);"><div class="spinner"></div></div>';

    try {
      const data = await window.API.get(`/notifications?page=${Notifications.page}&limit=${Notifications.limit}`);
      container.innerHTML = '';

      if (data.success) {
        if (data.notifications.length === 0) {
          container.innerHTML = `
            <div class="empty-state">
              <div class="empty-state-icon">🔔</div>
              <h3>All caught up!</h3>
              <p>You don't have any notifications at the moment.</p>
            </div>
          `;
          return;
        }

        const list = document.createElement('div');
        list.style.display = 'flex';
        list.style.flexDirection = 'column';
        list.style.gap = 'var(--space-2)';

        data.notifications.forEach(notif => {
          const card = document.createElement('div');
          card.className = `notification-card ${notif.read ? '' : 'unread'}`;
          
          let icon = '✨';
          if (notif.type === 'like') icon = '❤️';
          if (notif.type === 'comment' || notif.type === 'reply') icon = '💬';
          if (notif.type === 'follow') icon = '👤';
          if (notif.type === 'mention') icon = '🏷️';

          const sender = notif.sender;
          const senderAvatar = sender && sender.avatar 
            ? `<img src="${sender.avatar}" alt="avatar">` 
            : sender.fullName.charAt(0).toUpperCase();

          card.innerHTML = `
            <div style="font-size: 20px; width: 24px; text-align: center; flex-shrink: 0;">${icon}</div>
            <div class="avatar avatar-sm">${senderAvatar}</div>
            <div class="notification-text">
              <strong>${sender.fullName}</strong> ${notif.message.replace(sender.username, '')}
            </div>
            <div class="notification-time">${window.Utils.timeAgo(notif.createdAt)}</div>
          `;

          // Handle click - mark as read and redirect if appropriate
          card.addEventListener('click', async () => {
            try {
              await window.API.put('/notifications/read', { notificationIds: [notif._id] });
              
              if (notif.post) {
                window.location.href = `/feed?post=${notif.post}`;
              } else if (sender) {
                window.location.href = `/user/${sender.username}`;
              }
            } catch (err) {}
          });

          list.appendChild(card);
        });

        container.appendChild(list);

        // Mark all as read after rendering
        await window.API.put('/notifications/read');
        Notifications.updateBadgeUI(0);
      }
    } catch (e) {
      container.innerHTML = `<div style="text-align:center; color:var(--danger); padding:var(--space-4);">${e.message}</div>`;
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Notifications.init();
  
  // Handle click on sidebar/mobile notifications links
  const links = [document.getElementById('sidebar-notifications-link'), document.getElementById('mobile-notifications-link')];
  links.forEach(link => {
    if (link) {
      link.addEventListener('click', (e) => {
        // If we are on the feed page, prevent full load and render dynamically
        if (window.location.pathname === '/feed' || window.location.pathname === '/feed.html') {
          e.preventDefault();
          history.pushState(null, '', '/feed?tab=notifications');
          
          // Clear active tab indicators
          document.querySelectorAll('.sidebar-nav .nav-link').forEach(l => l.classList.remove('active'));
          document.getElementById('sidebar-notifications-link')?.classList.add('active');
          
          Notifications.loadNotificationsPage();
        }
      });
    }
  });

  // Handle post parameters inside feed URL (redirected from notifications clicks)
  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get('post');
  if (postId && (window.location.pathname === '/feed' || window.location.pathname === '/feed.html')) {
    setTimeout(() => {
      if (window.PostComponent) {
        window.PostComponent.openComments(postId);
      }
    }, 800);
  }
});

window.Notifications = Notifications;
