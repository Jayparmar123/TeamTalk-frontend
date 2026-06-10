import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://teamtalk-backend-tb7m.onrender.com/api', // Backend base URL
  withCredentials: true, // Allow cookies to be sent
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to inject JWT access token from memory (Redux/Store)
// We will bind a setter/getter helper for the token
let accessToken = '';

export const setAccessToken = (token) => {
  accessToken = token;
};

export const getAccessToken = () => {
  return accessToken;
};

api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to handle expired tokens and auto-refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Avoid infinite loop if refresh endpoint itself returns 401
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/refresh') && !originalRequest.url.includes('/auth/login')) {
      originalRequest._retry = true;

      try {
        // Attempt to call the refresh endpoint to obtain a new access token
        const refreshUrl = `${import.meta.env.VITE_API_URL || 'https://teamtalk-backend-tb7m.onrender.com/api'}/auth/refresh`;
        const res = await axios.post(refreshUrl, {}, { withCredentials: true });
        
        if (res.data.success) {
          const newToken = res.data.token;
          setAccessToken(newToken);
          
          // Retry the original request with the new access token
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Clear local token and propagate logout redirect
        setAccessToken('');
        // Trigger page reload to auth screen if refresh fails
        if (window.location.pathname !== '/login') {
          window.location.href = '/login?expired=true';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
