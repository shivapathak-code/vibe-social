const Search = {
  currentQuery: '',
  searchType: 'all', // 'all', 'users', 'posts', 'hashtags'
  page: 1,
  limit: 10,
  loading: false,

  init: () => {
    const input = document.getElementById('search-input');
    if (!input) return;

    // Check query params
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q') || '';
    if (q) {
      input.value = q;
      Search.currentQuery = q;
    }

    // Debounced input handler
    input.addEventListener('input', window.Utils.debounce((e) => {
      Search.currentQuery = e.target.value.trim();
      Search.resetSearch();
    }, 450));

    // Tab bindings
    const tabs = document.querySelectorAll('#search-tabs .tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        Search.searchType = tab.dataset.searchType;
        Search.resetSearch();
      });
    });

    // Initial search
    Search.resetSearch();
  },

  resetSearch: () => {
    Search.page = 1;
    Search.loading = false;
    
    const container = document.getElementById('search-results-container');
    if (!container) return;

    if (!Search.currentQuery) {
      Search.loadTrendingVibes();
      return;
    }

    container.innerHTML = '<div style="display:flex; justify-content:center; padding:var(--space-12);"><div class="spinner"></div></div>';
    Search.performSearch();
  },

  performSearch: async () => {
    if (Search.loading) return;
    Search.loading = true;

    const container = document.getElementById('search-results-container');

    try {
      const typeQuery = Search.searchType !== 'all' ? `&type=${Search.searchType}` : '';
      const data = await window.API.get(`/search?q=${encodeURIComponent(Search.currentQuery)}${typeQuery}&page=${Search.page}&limit=${Search.limit}`);
      
      container.innerHTML = '';

      if (data.success) {
        // Handle Unified "Top Results" Tab
        if (Search.searchType === 'all') {
          Search.renderUnifiedResults(data);
        } else if (Search.searchType === 'users') {
          Search.renderUsersList(data.users);
        } else if (Search.searchType === 'posts') {
          Search.renderPostsList(data.posts);
        } else if (Search.searchType === 'hashtags') {
          Search.renderHashtagsList(data.hashtags);
        }
      }
    } catch (e) {
      container.innerHTML = `<div style="text-align:center; color:var(--danger); padding:var(--space-4);">${e.message}</div>`;
    } finally {
      Search.loading = false;
    }
  },

  renderUnifiedResults: (data) => {
    const container = document.getElementById('search-results-container');
    
    let hasResults = false;

    // Users block
    if (data.users && data.users.length > 0) {
      hasResults = true;
      const block = document.createElement('div');
      block.style.marginBottom = 'var(--space-6)';
      block.innerHTML = `<h3 style="font-size:var(--text-md); margin-bottom:var(--space-3);">People</h3><div class="users-block" style="display:flex; flex-direction:column; gap:var(--space-2);"></div>`;
      const blockBody = block.querySelector('.users-block');
      
      data.users.forEach(user => {
        const avatar = user.avatar ? `<img src="${user.avatar}" alt="avatar">` : user.fullName.charAt(0).toUpperCase();
        blockBody.innerHTML += `
          <div class="user-card" onclick="window.location.href='/user/${user.username}'">
            <div class="avatar avatar-sm">${avatar}</div>
            <div class="user-card-info">
              <div class="name">${user.fullName}</div>
              <div class="username">@${user.username}</div>
            </div>
            <div style="font-size:11px; color:var(--text-tertiary);">${user.followersCount || 0} followers</div>
          </div>
        `;
      });
      container.appendChild(block);
    }

    // Hashtags block
    if (data.hashtags && data.hashtags.length > 0) {
      hasResults = true;
      const block = document.createElement('div');
      block.style.marginBottom = 'var(--space-6)';
      block.innerHTML = `<h3 style="font-size:var(--text-md); margin-bottom:var(--space-3);">Hashtags</h3><div class="tags-block" style="display:flex; flex-direction:column; gap:var(--space-3);"></div>`;
      const blockBody = block.querySelector('.tags-block');

      data.hashtags.forEach(tag => {
        blockBody.innerHTML += `
          <div style="cursor:pointer;" onclick="window.location.href='/search?q=%23${tag.name}&type=posts'">
            <span style="font-weight:600; font-size:var(--text-sm);">#${tag.name}</span>
            <span style="font-size:11px; color:var(--text-tertiary); margin-left:var(--space-2);">${tag.count} posts</span>
          </div>
        `;
      });
      container.appendChild(block);
    }

    // Posts block
    if (data.posts && data.posts.length > 0) {
      hasResults = true;
      const block = document.createElement('div');
      block.innerHTML = `<h3 style="font-size:var(--text-md); margin-bottom:var(--space-3);">Posts</h3><div class="posts-block"></div>`;
      const blockBody = block.querySelector('.posts-block');
      
      data.posts.forEach(post => {
        const temp = document.createElement('div');
        temp.innerHTML = window.PostComponent.createPostCardHTML(post);
        blockBody.appendChild(temp.firstElementChild);
      });
      container.appendChild(block);
    }

    if (!hasResults) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🔍</div>
          <h3>No results found</h3>
          <p>We couldn't find anything matching "${Search.currentQuery}". Try a different spelling or keyword.</p>
        </div>
      `;
    }
  },

  renderUsersList: (users) => {
    const container = document.getElementById('search-results-container');
    if (users.length === 0) {
      container.innerHTML = `<div class="empty-state"><h3>No users found</h3></div>`;
      return;
    }
    
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.gap = 'var(--space-2)';

    users.forEach(user => {
      const avatar = user.avatar ? `<img src="${user.avatar}" alt="avatar">` : user.fullName.charAt(0).toUpperCase();
      wrapper.innerHTML += `
        <div class="user-card" onclick="window.location.href='/user/${user.username}'">
          <div class="avatar avatar-sm">${avatar}</div>
          <div class="user-card-info">
            <div class="name">${user.fullName}</div>
            <div class="username">@${user.username}</div>
          </div>
        </div>
      `;
    });
    container.appendChild(wrapper);
  },

  renderPostsList: (posts) => {
    const container = document.getElementById('search-results-container');
    if (posts.length === 0) {
      container.innerHTML = `<div class="empty-state"><h3>No posts found</h3></div>`;
      return;
    }
    posts.forEach(post => {
      const temp = document.createElement('div');
      temp.innerHTML = window.PostComponent.createPostCardHTML(post);
      container.appendChild(temp.firstElementChild);
    });
  },

  renderHashtagsList: (hashtags) => {
    const container = document.getElementById('search-results-container');
    if (hashtags.length === 0) {
      container.innerHTML = `<div class="empty-state"><h3>No hashtags found</h3></div>`;
      return;
    }
    
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.gap = 'var(--space-3)';

    hashtags.forEach(tag => {
      wrapper.innerHTML += `
        <div style="cursor:pointer;" onclick="window.location.href='/search?q=%23${tag.name}&type=posts'">
          <div style="font-weight:600; font-size:var(--text-sm);">#${tag.name}</div>
          <div style="font-size:11px; color:var(--text-tertiary);">${tag.count} posts</div>
        </div>
      `;
    });
    container.appendChild(wrapper);
  },

  loadTrendingVibes: async () => {
    const container = document.getElementById('search-results-container');
    if (!container) return;

    container.innerHTML = `
      <div style="margin-top:var(--space-4);">
        <h3 style="font-size:var(--text-md); margin-bottom:var(--space-4);">What's Trending Now</h3>
        <div id="search-trending-loader" style="display:flex; justify-content:center; padding:var(--space-6);"><div class="spinner spinner-sm"></div></div>
        <div id="search-trending-list" style="display:flex; flex-direction:column; gap:var(--space-4);"></div>
      </div>
    `;

    try {
      const data = await window.API.get('/search/trending?limit=8');
      document.getElementById('search-trending-loader')?.remove();

      if (data.success && data.hashtags.length > 0) {
        const list = document.getElementById('search-trending-list');
        data.hashtags.forEach(tag => {
          list.innerHTML += `
            <div style="cursor:pointer;" onclick="document.getElementById('search-input').value='#${tag.name}'; Search.currentQuery='#${tag.name}'; Search.resetSearch();">
              <div style="font-weight:600; font-size:var(--text-md);">#${tag.name}</div>
              <div style="font-size:12px; color:var(--text-tertiary);">${tag.count} posts in the last week</div>
            </div>
          `;
        });
      }
    } catch (e) {
      document.getElementById('search-trending-loader')?.remove();
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('search-results-container')) {
    Search.init();
  }
});
window.Search = Search;
