document.addEventListener('DOMContentLoaded', () => {
  const profileForm = document.getElementById('settings-profile-form');
  const passwordForm = document.getElementById('settings-password-form');
  const darkModeToggle = document.getElementById('settings-dark-mode-toggle');
  const privateToggle = document.getElementById('settings-private-toggle');
  const confirmDeleteBtn = document.getElementById('confirm-delete-btn');

  // Load current settings values
  const initSettings = async () => {
    try {
      const data = await window.API.get('/auth/me');
      if (data.success) {
        const user = data.user;
        
        if (profileForm) {
          document.getElementById('profile-fullName').value = user.fullName;
          document.getElementById('profile-bio').value = user.bio || '';
          document.getElementById('profile-location').value = user.location || '';
          document.getElementById('profile-website').value = user.website || '';
        }

        if (darkModeToggle) {
          darkModeToggle.checked = user.darkMode || (document.documentElement.getAttribute('data-theme') === 'dark');
        }

        if (privateToggle) {
          privateToggle.checked = user.isPrivate || false;
        }
      }
    } catch (e) {
      console.error("Failed to load settings details:", e);
    }
  };

  // Submit Profile Information
  if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const saveBtn = document.getElementById('save-info-btn');
      const origText = saveBtn.innerHTML;
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<div class="btn-spinner"></div>';

      try {
        const data = await window.API.put(`/users/${window.currentUser._id}`, {
          fullName: document.getElementById('profile-fullName').value.trim(),
          bio: document.getElementById('profile-bio').value.trim(),
          location: document.getElementById('profile-location').value.trim(),
          website: document.getElementById('profile-website').value.trim()
        });

        if (data.success) {
          window.currentUser = data.user;
          localStorage.setItem('user', JSON.stringify(data.user));
          window.Utils.showToast('Success', 'Profile details saved', 'success');
        }
      } catch (err) {
        window.Utils.showToast('Error', err.message, 'error');
      } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = origText;
      }
    });
  }

  // Submit Password Change
  if (passwordForm) {
    passwordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const changeBtn = document.getElementById('change-pass-btn');
      const origText = changeBtn.innerHTML;
      changeBtn.disabled = true;
      changeBtn.innerHTML = '<div class="btn-spinner"></div>';

      const currentPassword = document.getElementById('currentPassword').value;
      const newPassword = document.getElementById('newPassword').value;

      try {
        const data = await window.API.put('/auth/change-password', {
          currentPassword,
          newPassword
        });

        if (data.success) {
          document.getElementById('currentPassword').value = '';
          document.getElementById('newPassword').value = '';
          window.Utils.showToast('Success', 'Password changed successfully', 'success');
        }
      } catch (err) {
        window.Utils.showToast('Error', err.message, 'error');
      } finally {
        changeBtn.disabled = false;
        changeBtn.innerHTML = origText;
      }
    });
  }

  // Toggle Dark Mode
  if (darkModeToggle) {
    darkModeToggle.addEventListener('change', async (e) => {
      const isDark = e.target.checked;
      window.setTheme(isDark ? 'dark' : 'light');
      
      try {
        await window.API.put(`/users/${window.currentUser._id}`, { darkMode: isDark });
      } catch (err) {}
    });
  }

  // Toggle Private Account
  if (privateToggle) {
    privateToggle.addEventListener('change', async (e) => {
      const isPrivate = e.target.checked;
      try {
        await window.API.put(`/users/${window.currentUser._id}`, { isPrivate });
        window.Utils.showToast('Privacy Updated', `Account is now ${isPrivate ? 'private' : 'public'}`, 'success');
      } catch (err) {
        privateToggle.checked = !isPrivate;
        window.Utils.showToast('Error', err.message, 'error');
      }
    });
  }

  // Confirm delete account
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', async () => {
      confirmDeleteBtn.disabled = true;
      confirmDeleteBtn.innerHTML = '<div class="btn-spinner"></div>';

      try {
        const data = await window.API.delete(`/users/${window.currentUser._id}`);
        if (data.success) {
          window.Socket.disconnect();
          localStorage.removeItem('user');
          window.location.href = '/register';
        }
      } catch (err) {
        confirmDeleteBtn.disabled = false;
        confirmDeleteBtn.textContent = 'Yes, Purge My Account';
        window.Utils.showToast('Error purging account', err.message, 'error');
      }
    });
  }

  // Call init settings only on settings page load
  if (profileForm || darkModeToggle) {
    // Make sure router loaded user first or fetch it
    setTimeout(initSettings, 300);
  }
});
