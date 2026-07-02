const Feed = {
  activeTab: 'home', // 'home' (following), 'trending', 'latest'
  page: 1,
  limit: 10,
  loading: false,
  hasMore: true,
  mediaFiles: [],

  init: () => {
    // Tab event bindings
    const tabs = document.querySelectorAll('.tabs .tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        Feed.activeTab = tab.dataset.feed;
        Feed.resetFeed();
      });
    });

    // Infinite scroll observer
    const trigger = document.getElementById('infinite-scroll-trigger');
    if (trigger) {
      const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !Feed.loading && Feed.hasMore) {
          Feed.loadMorePosts();
        }
      }, { rootMargin: '100px' });
      observer.observe(trigger);
    }

    // Composer media event bindings
    const imageInput = document.getElementById('composer-image-input');
    const videoInput = document.getElementById('composer-video-input');
    if (imageInput) imageInput.addEventListener('change', (e) => Feed.handleMediaSelect(e, 'image'));
    if (videoInput) videoInput.addEventListener('change', (e) => Feed.handleMediaSelect(e, 'video'));

    // Modal Composer media bindings
    const modalImageInput = document.getElementById('modal-image-input');
    const modalVideoInput = document.getElementById('modal-video-input');
    if (modalImageInput) modalImageInput.addEventListener('change', (e) => Feed.handleMediaSelect(e, 'image', true));
    if (modalVideoInput) modalVideoInput.addEventListener('change', (e) => Feed.handleMediaSelect(e, 'video', true));

    // Submit composer
    const composerForm = document.getElementById('feed-composer-form');
    if (composerForm) composerForm.addEventListener('submit', Feed.submitPost);

    const modalComposerForm = document.getElementById('modal-composer-form');
    if (modalComposerForm) modalComposerForm.addEventListener('submit', (e) => Feed.submitPost(e, true));

    // Search bar shortcut in right panel
    const searchBar = document.getElementById('aside-search');
    if (searchBar) {
      searchBar.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          window.location.href = `/search?q=${encodeURIComponent(searchBar.value)}`;
        }
      });
    }

    // Load widgets
    Feed.loadWidgets();

    // Initial load
    Feed.resetFeed();
  },

  resetFeed: () => {
    Feed.page = 1;
    Feed.hasMore = true;
    Feed.loading = false;
    const container = document.getElementById('posts-container');
    if (container) container.innerHTML = '';
    Feed.loadMorePosts();
  },

  loadMorePosts: async () => {
    if (Feed.loading) return;
    Feed.loading = true;

    const container = document.getElementById('posts-container');
    
    // Inject skeletons
    const skeletonsContainer = document.createElement('div');
    skeletonsContainer.id = 'feed-skeletons';
    skeletonsContainer.innerHTML = window.Utils.getPostSkeleton() + window.Utils.getPostSkeleton();
    container.appendChild(skeletonsContainer);

    try {
      let endpoint = `/posts?page=${Feed.page}&limit=${Feed.limit}`;
      if (Feed.activeTab === 'home') {
        endpoint = `/posts/feed/me?page=${Feed.page}&limit=${Feed.limit}`;
      } else if (Feed.activeTab === 'trending') {
        endpoint = `/posts/trending?page=${Feed.page}&limit=${Feed.limit}`;
      } else if (Feed.activeTab === 'latest') {
        endpoint = `/posts?sort=latest&page=${Feed.page}&limit=${Feed.limit}`;
      }

      const data = await window.API.get(endpoint);
      
      // Remove skeletons
      const skeletons = document.getElementById('feed-skeletons');
      if (skeletons) skeletons.remove();

      if (data.success) {
        if (data.posts.length < Feed.limit) {
          Feed.hasMore = false;
        }

        if (Feed.page === 1 && data.posts.length === 0) {
          container.innerHTML = `
            <div class="empty-state">
              <div class="empty-state-icon">📭</div>
              <h3>Nothing to see here</h3>
              <p>Follow some accounts or explore popular posts to light up your feed!</p>
            </div>
          `;
          return;
        }

        data.posts.forEach(post => {
          const cardHTML = window.PostComponent.createPostCardHTML(post);
          const wrapper = document.createElement('div');
          wrapper.innerHTML = cardHTML;
          container.appendChild(wrapper.firstElementChild);
        });

        Feed.page++;
      }
    } catch (error) {
      const skeletons = document.getElementById('feed-skeletons');
      if (skeletons) skeletons.remove();
      window.Utils.showToast('Failed to load feed', error.message, 'error');
    } finally {
      Feed.loading = false;
    }
  },

  handleMediaSelect: (e, type, isModal = false) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const previewContainer = document.getElementById(isModal ? 'modal-media-preview-container' : 'composer-media-preview-container');
    previewContainer.classList.remove('hidden');

    files.forEach(file => {
      // Basic type & size guard
      if (type === 'image' && !file.type.startsWith('image/')) return;
      if (type === 'video' && !file.type.startsWith('video/')) return;

      Feed.mediaFiles.push({ file, type, isModal });

      // Create preview HTML
      const reader = new FileReader();
      reader.onload = (event) => {
        const item = document.createElement('div');
        item.className = 'composer-media-item';

        let mediaEl = '';
        if (type === 'image') {
          mediaEl = `<img src="${event.target.result}" alt="preview">`;
        } else {
          mediaEl = `<video src="${event.target.result}" muted></video>`;
        }

        item.innerHTML = `
          ${mediaEl}
          <div class="composer-media-remove" onclick="Feed.removeMediaItem(this, '${file.name}')">&times;</div>
        `;
        previewContainer.appendChild(item);
      };
      reader.readAsDataURL(file);
    });
  },

  removeMediaItem: (btn, fileName) => {
    btn.closest('.composer-media-item').remove();
    Feed.mediaFiles = Feed.mediaFiles.filter(item => item.file.name !== fileName);
    
    // Hide previews if none left
    const previewContainer = btn.closest('.composer-media-preview');
    if (previewContainer && previewContainer.children.length === 0) {
      previewContainer.classList.add('hidden');
    }
  },

  submitPost: async (e, isModal = false) => {
    e.preventDefault();
    const textarea = document.getElementById(isModal ? 'modal-composer-textarea' : 'composer-textarea');
    const content = textarea.value.trim();
    const saveDraft = document.getElementById('composer-draft-check')?.checked || false;

    if (!content && Feed.mediaFiles.length === 0) {
      window.Utils.showToast('Empty Post', 'Please write something or upload media', 'warning');
      return;
    }

    const submitBtn = document.getElementById(isModal ? 'composer-submit-btn' : 'composer-submit-btn'); // Handles standard submit btn
    const origText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="btn-spinner"></div>';

    try {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('isDraft', saveDraft);

      // Append media files
      Feed.mediaFiles.forEach(item => {
        if (item.type === 'image') {
          formData.append('images', item.file);
        } else if (item.type === 'video') {
          formData.append('video', item.file);
        }
      });

      const data = await window.API.post('/posts', formData);
      if (data.success) {
        window.Utils.showToast('Success', 'Your post is online!', 'success');
        
        // Reset composer inputs
        textarea.value = '';
        Feed.mediaFiles = [];
        const preview = document.getElementById(isModal ? 'modal-media-preview-container' : 'composer-media-preview-container');
        if (preview) {
          preview.innerHTML = '';
          preview.classList.add('hidden');
        }

        if (isModal) {
          window.closeCreatePostModal();
        }

        // Prepend new post
        const container = document.getElementById('posts-container');
        if (container) {
          const temp = document.createElement('div');
          temp.innerHTML = window.PostComponent.createPostCardHTML(data.post);
          container.prepend(temp.firstElementChild);
        }
      }
    } catch (err) {
      window.Utils.showToast('Post Creation Failed', err.message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = origText;
    }
  },

  loadWidgets: async () => {
    const suggestedContainer = document.getElementById('suggested-users-container');
    const hashtagContainer = document.getElementById('trending-hashtags-container');

    // Suggested users widget
    if (suggestedContainer) {
      try {
        const data = await window.API.get('/users/suggested?limit=4');
        if (data.success && data.users.length > 0) {
          suggestedContainer.innerHTML = '';
          data.users.forEach(user => {
            const avatar = user.avatar 
              ? `<img src="${user.avatar}" alt="avatar">` 
              : user.fullName.charAt(0).toUpperCase();

            suggestedContainer.innerHTML += `
              <div class="user-card" onclick="window.location.href='/user/${user.username}'" style="padding:var(--space-2) 0;">
                <div class="avatar avatar-sm">${avatar}</div>
                <div class="user-card-info">
                  <div class="name">${user.fullName}</div>
                  <div class="username">@${user.username}</div>
                </div>
                <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); Feed.followSuggestedUser('${user._id}', this)">Follow</button>
              </div>
            `;
          });
        } else {
          suggestedContainer.innerHTML = '<div style="font-size:12px; color:var(--text-tertiary);">No suggestions available</div>';
        }
      } catch (e) {
        suggestedContainer.innerHTML = '<div style="font-size:12px; color:var(--text-tertiary);">Failed to load suggestions</div>';
      }
    }

    // Hashtags widget
    if (hashtagContainer) {
      try {
        const data = await window.API.get('/search/trending?limit=5');
        if (data.success && data.hashtags.length > 0) {
          hashtagContainer.innerHTML = '';
          data.hashtags.forEach(tag => {
            hashtagContainer.innerHTML += `
              <div style="cursor:pointer;" onclick="window.location.href='/search?q=%23${tag.name}&type=posts'">
                <div style="font-weight:600; font-size:var(--text-sm);">#${tag.name}</div>
                <div style="font-size:11px; color:var(--text-tertiary);">${tag.count} posts</div>
              </div>
            `;
          });
        } else {
          hashtagContainer.innerHTML = '<div style="font-size:12px; color:var(--text-tertiary);">No trending hashtags</div>';
        }
      } catch (e) {
        hashtagContainer.innerHTML = '<div style="font-size:12px; color:var(--text-tertiary);">Failed to load hashtags</div>';
      }
    }
  },

  followSuggestedUser: async (userId, btn) => {
    btn.disabled = true;
    try {
      const data = await window.API.post(`/users/${userId}/follow`);
      if (data.success) {
        btn.textContent = 'Following';
        btn.className = 'btn btn-secondary btn-sm';
        window.Utils.showToast('Followed', 'User followed successfully', 'success');
      }
    } catch (e) {
      btn.disabled = false;
      window.Utils.showToast('Error', e.message, 'error');
    }
  }
};

// Start Feed on DOMContentLoaded (only for feed page)
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('posts-container')) {
    Feed.init();
  }
});

window.Feed = Feed;
