const Utils = {
  // Format Date to relative "Time Ago"
  timeAgo: (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 5) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;

    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}w ago`;

    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  },

  // Toast Notification System
  showToast: (title, message, type = 'info', duration = 4000) => {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';
    if (type === 'warning') icon = '⚠️';

    toast.innerHTML = `
      <div class="toast-icon">${icon}</div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close">&times;</button>
      <div class="toast-progress"></div>
    `;

    container.appendChild(toast);

    // Close button
    toast.querySelector('.toast-close').addEventListener('click', () => {
      Utils.removeToast(toast);
    });

    // Auto dismiss
    const timeout = setTimeout(() => {
      Utils.removeToast(toast);
    }, duration);

    toast.dataset.timeoutId = timeout;
  },

  removeToast: (toast) => {
    if (toast.dataset.timeoutId) {
      clearTimeout(parseInt(toast.dataset.timeoutId));
    }
    toast.classList.add('removing');
    toast.addEventListener('animationend', () => {
      toast.remove();
    });
  },

  // Debounce for search and scroll
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Initialize button ripple effects
  initRipples: () => {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn');
      if (!btn || btn.disabled) return;

      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = `${size}px`;
      
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;

      btn.appendChild(ripple);

      ripple.addEventListener('animationend', () => {
        ripple.remove();
      });
    });
  },

  // Scroll reveal loader
  initScrollReveal: () => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.scroll-reveal').forEach(el => {
      observer.observe(el);
    });
  },

  // Render Post Text with clickable hashtags and mentions
  renderPostText: (text) => {
    if (!text) return '';
    // XSS sanitize
    let sanitized = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    // Linkify hashtags
    sanitized = sanitized.replace(/#(\w+)/g, '<span class="hashtag" onclick="event.stopPropagation(); window.location.href=\'/search?q=%23$1&type=posts\'">#$1</span>');

    // Linkify mentions
    sanitized = sanitized.replace(/@(\w+)/g, '<span class="mention" onclick="event.stopPropagation(); window.location.href=\'/user/$1\'">@$1</span>');

    return sanitized;
  },

  // Create skeleton loaders dynamically
  getPostSkeleton: () => {
    return `
      <div class="skeleton-card" style="margin-bottom: var(--space-6);">
        <div style="display: flex; gap: var(--space-3); align-items: center; margin-bottom: var(--space-4);">
          <div class="skeleton skeleton-avatar"></div>
          <div style="flex: 1;">
            <div class="skeleton skeleton-text short"></div>
            <div class="skeleton skeleton-text medium"></div>
          </div>
        </div>
        <div class="skeleton skeleton-text long" style="margin-bottom: var(--space-3);"></div>
        <div class="skeleton skeleton-text long" style="margin-bottom: var(--space-4);"></div>
        <div class="skeleton skeleton-image"></div>
      </div>
    `;
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Utils.initRipples();
});

window.Utils = Utils;
