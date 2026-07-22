import axios from 'axios';
import { disconnectSocket, setSocketAuthToken } from './socketClient';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

let refreshAccessTokenPromise: Promise<string> | null = null;

const shouldSkipRefresh = (requestUrl?: string) => {
  if (!requestUrl) {
    return false;
  }

  return [
    '/auth/login',
    '/auth/google',
    '/auth/signup',
    '/auth/refresh-token',
    '/auth/logout',
  ].some((path) => requestUrl.includes(path));
};

const refreshAccessToken = async () => {
  if (!refreshAccessTokenPromise) {
    refreshAccessTokenPromise = api
      .post('/auth/refresh-token')
      .then((response) => {
        if (!response.data?.success) {
          throw new Error('Token refresh failed');
        }

        const newAccessToken = response.data.data.accessToken;
        localStorage.setItem('accessToken', newAccessToken);
        setSocketAuthToken(newAccessToken);
        return newAccessToken;
      })
      .finally(() => {
        refreshAccessTokenPromise = null;
      });
  }

  return refreshAccessTokenPromise;
};

// Request interceptor to add the auth token header to every request
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken && config.headers) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !shouldSkipRefresh(originalRequest.url)) {
      originalRequest._retry = true;

      try {
        const newAccessToken = await refreshAccessToken();
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (err) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        setSocketAuthToken(null);
        disconnectSocket();
        if (window.location.pathname !== '/signin' && window.location.pathname !== '/signup') {
          window.location.href = '/signin';
        }
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
