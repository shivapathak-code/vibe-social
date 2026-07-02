const PostComponent = {
  // Build HTML string for a post card
  createPostCardHTML: (post) => {
    const isLiked = post.isLiked ? 'liked' : '';
    const author = post.author;
    const authorName = author ? author.fullName : 'Vibe User';
    const authorUsername = author ? author.username : 'user';
    const authorAvatar = author && author.avatar 
      ? `<img src="${author.avatar}" alt="avatar">` 
      : authorName.charAt(0).toUpperCase();

    // Check if post belongs to current user
    const isOwnPost = window.currentUser && author && window.currentUser._id === author._id;
    const deleteBtn = isOwnPost 
      ? `<button class="btn btn-icon post-delete-btn" onclick="event.stopPropagation(); PostComponent.deletePost('${post._id}')" data-tooltip="Delete Post">🗑️</button>` 
      : '';

    // Render media content
    let mediaHTML = '';
    if (post.images && post.images.length > 0) {
      const gridClass = post.images.length > 1 ? `grid-${post.images.length}` : '';
      const imgs = post.images.map(img => `<img src="${img}" alt="post media" loading="lazy" onclick="event.stopPropagation(); PostComponent.viewImage('${img}')">`).join('');
      mediaHTML = `<div class="post-card-images ${gridClass}">${imgs}</div>`;
    } else if (post.video) {
      mediaHTML = `
        <div class="post-card-images" style="position: relative;">
          <video src="${post.video}" controls style="width: 100%; border-radius: var(--radius-lg);" preload="metadata"></video>
        </div>
      `;
    }

    return `
      <div class="post-card animate-fade-in-up" id="post-${post._id}" data-id="${post._id}" onclick="PostComponent.openPostDetail('${post._id}')">
        <div class="post-card-header">
          <div class="avatar avatar-md" onclick="event.stopPropagation(); window.location.href='/user/${authorUsername}'">${authorAvatar}</div>
          <div class="post-card-header-info">
            <span class="name" onclick="event.stopPropagation(); window.location.href='/user/${authorUsername}'">${authorName}</span>
            <span class="username" onclick="event.stopPropagation(); window.location.href='/user/${authorUsername}'">@${authorUsername}</span>
            <span style="margin: 0 4px; opacity: 0.5;">•</span>
            <span class="time">${window.Utils.timeAgo(post.createdAt)}</span>
          </div>
          ${deleteBtn}
        </div>

        <div class="post-card-content">
          ${window.Utils.renderPostText(post.content)}
        </div>

        ${mediaHTML}

        <div class="post-card-actions">
          <button class="post-action-btn ${isLiked}" onclick="event.stopPropagation(); PostComponent.toggleLike(this, '${post._id}')">
            <span class="heart-icon">❤️</span>
            <span class="count">${post.likesCount || 0}</span>
          </button>
          <button class="post-action-btn" onclick="event.stopPropagation(); PostComponent.openComments('${post._id}')">
            <span>💬</span>
            <span class="count">${post.commentsCount || 0}</span>
          </button>
        </div>
      </div>
    `;
  },

  // Toggle Like API Call & UI Update
  toggleLike: async (btn, postId) => {
    const countEl = btn.querySelector('.count');
    const isLiked = btn.classList.contains('liked');
    let currentCount = parseInt(countEl.textContent) || 0;

    btn.disabled = true;

    try {
      if (isLiked) {
        btn.classList.remove('liked');
        countEl.textContent = Math.max(0, currentCount - 1);
        await window.API.delete(`/posts/${postId}/like`);
      } else {
        btn.classList.add('liked');
        countEl.textContent = currentCount + 1;
        
        // Animated burst details
        btn.classList.add('pop-burst');
        btn.addEventListener('animationend', () => btn.classList.remove('pop-burst'), { once: true });
        
        await window.API.post(`/posts/${postId}/like`);
      }
    } catch (error) {
      // Revert if error
      if (isLiked) {
        btn.classList.add('liked');
        countEl.textContent = currentCount;
      } else {
        btn.classList.remove('liked');
        countEl.textContent = currentCount;
      }
      window.Utils.showToast('Error', 'Unable to process like trigger', 'error');
    } finally {
      btn.disabled = false;
    }
  },

  // Delete Post
  deletePost: async (postId) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const data = await window.API.delete(`/posts/${postId}`);
      if (data.success) {
        const card = document.getElementById(`post-${postId}`);
        if (card) {
          card.style.transform = 'scale(0.9) translateY(10px)';
          card.style.opacity = '0';
          card.style.transition = 'all 300ms ease-out';
          setTimeout(() => card.remove(), 300);
        }
        window.Utils.showToast('Post Deleted', 'Your vibe has been removed', 'success');
      }
    } catch (error) {
      window.Utils.showToast('Error deleting post', error.message, 'error');
    }
  },

  // Open comments sheet modal
  openComments: (postId) => {
    if (window.Comments) {
      window.Comments.openModal(postId);
    }
  },

  openPostDetail: (postId) => {
    // Treat as comments drawer / detail page
    PostComponent.openComments(postId);
  },

  viewImage: (imageUrl) => {
    // Show full screen image overlay preview
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.background = 'rgba(0,0,0,0.9)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '99999';
    overlay.style.cursor = 'zoom-out';
    overlay.className = 'animate-fade-in';

    const img = document.createElement('img');
    img.src = imageUrl;
    img.style.maxHeight = '90vh';
    img.style.maxWidth = '90vw';
    img.style.borderRadius = 'var(--radius-md)';
    img.style.objectFit = 'contain';
    img.className = 'animate-bounce-in';

    overlay.appendChild(img);
    document.body.appendChild(overlay);

    overlay.addEventListener('click', () => {
      overlay.classList.add('fade-out');
      setTimeout(() => overlay.remove(), 300);
    });
  }
};

// Double click to like on posts handler binding
document.addEventListener('dblclick', (e) => {
  const card = e.target.closest('.post-card-images');
  if (card) {
    const postCard = card.closest('.post-card');
    if (postCard) {
      const likeBtn = postCard.querySelector('.post-action-btn');
      if (likeBtn && !likeBtn.classList.contains('liked')) {
        PostComponent.toggleLike(likeBtn, postCard.dataset.id);
        
        // Show double-tap float heart
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const floatHeart = document.createElement('span');
        floatHeart.textContent = '❤️';
        floatHeart.style.position = 'absolute';
        floatHeart.style.left = `${x}px`;
        floatHeart.style.top = `${y}px`;
        floatHeart.style.fontSize = '40px';
        floatHeart.style.transform = 'translate(-50%, -50%)';
        floatHeart.style.pointerEvents = 'none';
        floatHeart.style.zIndex = '1000';
        floatHeart.style.animation = 'heartFloat 800ms ease-out forwards';
        
        card.appendChild(floatHeart);
        floatHeart.addEventListener('animationend', () => floatHeart.remove());
      }
    }
  }
});

window.PostComponent = PostComponent;
