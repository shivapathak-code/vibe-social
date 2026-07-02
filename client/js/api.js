const API = {
  request: async (endpoint, options = {}) => {
    const url = `${window.CONFIG.API_BASE}${endpoint}`;
    
    // Set headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    // If options.body is FormData, remove Content-Type to let browser set boundaries
    if (options.body instanceof FormData) {
      delete headers['Content-Type'];
    }

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // Handle 401 unauthorized
        if (response.status === 401 && !endpoint.includes('/auth/me') && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error(`API Error on ${endpoint}:`, error.message);
      throw error;
    }
  },

  get: (endpoint, options = {}) => {
    return API.request(endpoint, { ...options, method: 'GET' });
  },

  post: (endpoint, body, options = {}) => {
    return API.request(endpoint, { 
      ...options, 
      method: 'POST', 
      body: body instanceof FormData ? body : JSON.stringify(body) 
    });
  },

  put: (endpoint, body, options = {}) => {
    return API.request(endpoint, { 
      ...options, 
      method: 'PUT', 
      body: body instanceof FormData ? body : JSON.stringify(body) 
    });
  },

  delete: (endpoint, options = {}) => {
    return API.request(endpoint, { ...options, method: 'DELETE' });
  }
};

window.API = API;
