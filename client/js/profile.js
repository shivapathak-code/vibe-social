const Profile = {
  username: null,
  activeTab: 'posts', // 'posts' or 'likes'
  page: 1,
  limit: 10,
  loading: false,
  hasMore: true,

  init: () => {
    // Determine username from path /user/:username or query parameter
    const pathParts = window.location.pathname.split('/');
    const userIndex = pathParts.indexOf('user');
    
    if (userIndex !== -1 && pathParts[userIndex + 1]) {
      Profile.username = pathParts[userIndex + 1];
    } else {
      // Fallback: Use current user username
      const user = JSON.parse(localStorage.getItem('user'));
      if (user) {
        Profile.username = user.username;
      } else {
        window.location.href = '/login';
        return;
      }
    }

    // Tabs binding
    const tabs = document.querySelectorAll('.tabs .tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        Profile.activeTab = tab.dataset.tab;
        Profile.resetFeed();
      });
    });

    // File input changes
    const avatarInput = document.getElementById('avatar-file-input');
    const coverInput = document.getElementById('cover-file-input');
    if (avatarInput) avatarInput.addEventListener('change', (e) => Profile.uploadAvatar(e));
    if (coverInput) coverInput.addEventListener('change', (e) => Profile.uploadCover(e));

    // Edit profile submit
    const editForm = document.getElementById('edit-profile-form');
    if (editForm) editForm.addEventListener('submit', Profile.submitEditProfile);

    // Initial load
    Profile.loadProfile();
  },

  loadProfile: async () => {
    try {
      const data = await window.API.get(`/users/${Profile.username}`);
      if (data.success) {
        const user = data.user;
        Profile.user = user;

        // Render full details
        document.getElementById('profile-full-name').textContent = user.fullName;
        document.getElementById('profile-username').textContent = `@${user.username}`;
        document.title = `${user.fullName} (@${user.username}) — Vibe`;
        
        // Joined details
        const joinedDate = new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
        document.getElementById('profile-meta-joined').textContent = joinedDate;

        // Bio
        document.getElementById('profile-bio-text').textContent = user.bio || 'No bio yet.';

        // Location
        const locEl = document.getElementById('profile-meta-location');
        if (user.location) {
          locEl.querySelector('.val').textContent = user.location;
          locEl.classList.remove('hidden');
        } else {
          locEl.classList.add('hidden');
        }

        // Website
        const webEl = document.getElementById('profile-meta-website');
        if (user.website) {
          const formattedWeb = user.website.startsWith('http') ? user.website : `https://${user.website}`;
          const valLink = webEl.querySelector('.val');
          valLink.textContent = user.website.replace(/(^\w+:|^)\/\//, '');
          valLink.href = formattedWeb;
          webEl.classList.remove('hidden');
        } else {
          webEl.classList.add('hidden');
        }

        // Avatar & Cover
        const avatarRender = document.getElementById('profile-avatar-render');
        if (user.avatar) {
          avatarRender.innerHTML = `<img src="${user.avatar}" alt="avatar">`;
        } else {
          avatarRender.textContent = user.fullName.charAt(0).toUpperCase();
        }

        if (user.coverImage) {
          document.getElementById('profile-cover-img').src = user.coverImage;
        } else {
          document.getElementById('profile-cover-img').src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        }

        // Stats
        document.getElementById('stats-followers').textContent = user.followersCount || 0;
        document.getElementById('stats-following').textContent = user.followingCount || 0;
        document.getElementById('stats-posts').textContent = user.postsCount || 0;

        // Render Header Button dynamic (Edit or Follow/Unfollow)
        Profile.renderActionBtn();

        // Feed Reset & Load posts
        Profile.resetFeed();
      }
    } catch (error) {
      window.Utils.showToast('Profile Error', error.message, 'error');
    }
  },

  renderActionBtn: () => {
    const container = document.getElementById('profile-action-btn-container');
    if (!container) return;

    const isOwnProfile = window.currentUser && window.currentUser._id === Profile.user._id;

    if (isOwnProfile) {
      container.innerHTML = `
        <button class="btn btn-secondary btn-sm" onclick="Profile.openEditModal()">Edit Profile</button>
      `;

      // Show upload labels
      document.getElementById('avatar-upload-label')?.classList.remove('hidden');
      document.getElementById('cover-upload-label')?.classList.remove('hidden');
    } else {
      const isFollowing = Profile.user.isFollowing;
      const followText = isFollowing ? 'Following' : 'Follow';
      const followClass = isFollowing ? 'btn-secondary' : 'btn-primary';

      container.innerHTML = `
        <button class="btn ${followClass} btn-sm" id="profile-follow-btn" onclick="Profile.toggleFollow()">${followText}</button>
      `;

      // Hide upload labels
      document.getElementById('avatar-upload-label')?.classList.add('hidden');
      document.getElementById('cover-upload-label')?.classList.add('hidden');
    }
  },

  toggleFollow: async () => {
    const btn = document.getElementById('profile-follow-btn');
    if (!btn || Profile.loading) return;

    btn.disabled = true;
    const isFollowing = Profile.user.isFollowing;

    try {
      if (isFollowing) {
        const data = await window.API.delete(`/users/${Profile.user._id}/follow`);
        if (data.success) {
          Profile.user.isFollowing = false;
          Profile.user.followersCount = data.followersCount;
          document.getElementById('stats-followers').textContent = data.followersCount;
          Profile.renderActionBtn();
          window.Utils.showToast('Unfollowed', 'User unfollowed successfully', 'info');
        }
      } else {
        const data = await window.API.post(`/users/${Profile.user._id}/follow`);
        if (data.success) {
          Profile.user.isFollowing = true;
          Profile.user.followersCount = data.followersCount;
          document.getElementById('stats-followers').textContent = data.followersCount;
          Profile.renderActionBtn();
          window.Utils.showToast('Following', 'User followed successfully', 'success');
        }
      }
    } catch (e) {
      window.Utils.showToast('Follow Error', e.message, 'error');
    } finally {
      btn.disabled = false;
    }
  },

  uploadAvatar: async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    window.Utils.showToast('Uploading', 'Processing and uploading avatar...', 'info');

    try {
      const data = await window.API.put(`/users/${window.currentUser._id}`, formData);
      if (data.success) {
        window.currentUser.avatar = data.user.avatar;
        localStorage.setItem('user', JSON.stringify(window.currentUser));
        
        const avatarRender = document.getElementById('profile-avatar-render');
        if (avatarRender) {
          avatarRender.innerHTML = `<img src="${data.user.avatar}" alt="avatar">`;
        }

        // Update header UI
        window.Router.syncUserUI(window.currentUser);
        window.Utils.showToast('Avatar Updated', 'Profile photo refreshed successfully', 'success');
      }
    } catch (error) {
      window.Utils.showToast('Upload Failed', error.message, 'error');
    }
  },

  uploadCover: async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    window.Utils.showToast('Uploading', 'Uploading cover image...', 'info');

    try {
      const data = await window.API.put(`/users/${window.currentUser._id}/cover`, formData);
      if (data.success) {
        document.getElementById('profile-cover-img').src = data.user.coverImage;
        window.Utils.showToast('Cover Updated', 'Profile banner refreshed successfully', 'success');
      }
    } catch (error) {
      window.Utils.showToast('Upload Failed', error.message, 'error');
    }
  },

  openEditModal: () => {
    const modal = document.getElementById('edit-profile-modal');
    if (!modal) return;

    document.getElementById('edit-fullname').value = Profile.user.fullName;
    document.getElementById('edit-bio').value = Profile.user.bio || '';
    document.getElementById('edit-location').value = Profile.user.location || '';
    document.getElementById('edit-website').value = Profile.user.website || '';

    modal.classList.add('active');
  },

  submitEditProfile: async (e) => {
    e.preventDefault();
    const fullName = document.getElementById('edit-fullname').value.trim();
    const bio = document.getElementById('edit-bio').value.trim();
    const location = document.getElementById('edit-location').value.trim();
    const website = document.getElementById('edit-website').value.trim();

    const saveBtn = e.target.querySelector('button[type="submit"]');
    saveBtn.disabled = true;

    try {
      const data = await window.API.put(`/users/${window.currentUser._id}`, {
        fullName,
        bio,
        location,
        website
      });

      if (data.success) {
        window.currentUser = data.user;
        localStorage.setItem('user', JSON.stringify(data.user));

        // Reload details
        Profile.loadProfile();
        window.closeEditProfileModal();
        window.Utils.showToast('Success', 'Profile updated successfully', 'success');
      }
    } catch (error) {
      window.Utils.showToast('Update Failed', error.message, 'error');
    } finally {
      saveBtn.disabled = false;
    }
  },

  resetFeed: () => {
    Profile.page = 1;
    Profile.hasMore = true;
    Profile.loading = false;
    document.getElementById('profile-posts-container').innerHTML = '';
    Profile.loadPosts();
  },

  loadPosts: async () => {
    if (Profile.loading || !Profile.hasMore) return;
    Profile.loading = true;

    const container = document.getElementById('profile-posts-container');
    const skeletonsContainer = document.createElement('div');
    skeletonsContainer.id = 'profile-skeletons';
    skeletonsContainer.innerHTML = window.Utils.getPostSkeleton() + window.Utils.getPostSkeleton();
    container.appendChild(skeletonsContainer);

    try {
      let endpoint = `/posts/user/${Profile.user.username}?page=${Profile.page}&limit=${Profile.limit}`;
      
      const data = await window.API.get(endpoint);
      skeletonsContainer.remove();

      if (data.success) {
        if (data.posts.length < Profile.limit) {
          Profile.hasMore = false;
        }

        if (Profile.page === 1 && data.posts.length === 0) {
          container.innerHTML = `
            <div class="empty-state">
              <div class="empty-state-icon">✍️</div>
              <h3>No posts yet</h3>
              <p>Looks like this user hasn't posted anything yet.</p>
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

        Profile.page++;
      }
    } catch (e) {
      skeletonsContainer.remove();
      window.Utils.showToast('Failed to load profile posts', e.message, 'error');
    } finally {
      Profile.loading = false;
    }
  }
};

// Start Profile on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('profile-posts-container')) {
    Profile.init();
  }
});

window.Profile = Profile;
