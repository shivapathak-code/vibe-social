(function() {
  const getThemePreference = () => {
    if (localStorage.getItem('theme')) {
      return localStorage.getItem('theme');
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const setTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    // Update theme toggle icon if button loaded
    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
      const icon = toggleBtn.querySelector('.theme-icon');
      if (icon) {
        icon.textContent = theme === 'dark' ? '☀️' : '🌙';
      }
    }
  };

  // Set initial theme before page content loads to prevent flash
  const initialTheme = getThemePreference();
  setTheme(initialTheme);

  // Initialize theme toggle button listener on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
      // Sync toggle button icon on load
      const icon = toggleBtn.querySelector('.theme-icon');
      if (icon) {
        icon.textContent = getThemePreference() === 'dark' ? '☀️' : '🌙';
      }

      toggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);

        // Optional API call to sync user settings in DB if logged in
        if (window.API && window.currentUser) {
          window.API.put(`/users/${window.currentUser._id}`, { darkMode: newTheme === 'dark' })
            .catch(() => {}); // Silent fail for theme sync
        }
      });
    }
  });

  window.setTheme = setTheme;
})();
