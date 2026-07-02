const Router = {
  checkAuth: async () => {
    const isAuthPage = window.location.pathname === '/login' || 
                       window.location.pathname === '/register' || 
                       window.location.pathname === '/' ||
                       window.location.pathname === '/index.html' ||
                       window.location.pathname === '/login.html' ||
                       window.location.pathname === '/register.html';

    try {
      const data = await window.API.get('/auth/me');
      if (data.success) {
        window.currentUser = data.user;
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Connect Socket
        window.Socket.connect(data.user._id);

        // Sync header UI elements
        Router.syncUserUI(data.user);

        // Redirect to feed if on landing/auth pages
        if (isAuthPage) {
          window.location.href = '/feed';
        }
      }
    } catch (error) {
      localStorage.removeItem('user');
      // Redirect to login if on protected page
      if (!isAuthPage) {
        window.location.href = '/login';
      }
    }
  },

  syncUserUI: (user) => {
    // Header avatar
    const headerAvatar = document.getElementById('header-user-avatar');
    if (headerAvatar) {
      if (user.avatar) {
        headerAvatar.innerHTML = `<img src="${user.avatar}" alt="avatar">`;
      } else {
        headerAvatar.textContent = user.fullName.charAt(0).toUpperCase();
        headerAvatar.style.background = `linear-gradient(135deg, #6C5CE7, #A29BFE)`;
      }
      headerAvatar.href = `/user/${user.username}`;
    }

    // Composer avatar on feed page
    const composerAvatar = document.getElementById('composer-user-avatar');
    if (composerAvatar) {
      if (user.avatar) {
        composerAvatar.innerHTML = `<img src="${user.avatar}" alt="avatar">`;
      } else {
        composerAvatar.textContent = user.fullName.charAt(0).toUpperCase();
      }
    }

    // Sidebar footer user card
    const sidebarProfileFooter = document.getElementById('sidebar-profile-footer');
    if (sidebarProfileFooter) {
      const avatarStr = user.avatar 
        ? `<img src="${user.avatar}" alt="avatar">` 
        : user.fullName.charAt(0).toUpperCase();

      sidebarProfileFooter.innerHTML = `
        <div class="user-card" onclick="window.location.href='/user/${user.username}'" style="padding: var(--space-2) 0;">
          <div class="avatar avatar-md">${avatarStr}</div>
          <div class="user-card-info">
            <div class="name">${user.fullName}</div>
            <div class="username">@${user.username}</div>
          </div>
          <button class="btn btn-icon" id="logout-btn" data-tooltip="Sign Out" onclick="event.stopPropagation(); window.logout();">
            <span>🚪</span>
          </button>
        </div>
      `;
    }

    // Sidebar profile link
    const sidebarProfileLink = document.getElementById('sidebar-profile-link');
    if (sidebarProfileLink) {
      sidebarProfileLink.href = `/user/${user.username}`;
    }

    const mobileProfileLink = document.getElementById('mobile-profile-link');
    if (mobileProfileLink) {
      mobileProfileLink.href = `/user/${user.username}`;
    }
  }
};

// Global logout handler
window.logout = async () => {
  try {
    const data = await window.API.post('/auth/logout');
    if (data.success) {
      window.Socket.disconnect();
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  } catch (error) {
    window.Utils.showToast('Logout Failed', error.message, 'error');
  }
};

// Initialize auth check on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  Router.checkAuth();
});

window.Router = Router;
