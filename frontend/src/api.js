import axios from 'axios';

let apiURL = import.meta.env.VITE_API_URL || '';
if (apiURL && !apiURL.endsWith('/api')) {
  apiURL += '/api';
}
if (!apiURL) apiURL = '/api';

console.log('🔗 API URL configurada:', apiURL);

const api = axios.create({
  baseURL: apiURL // Use VITE_API_URL in production, fallback to /api for local Docker
});

// Request interceptor to attach JWT token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => Promise.reject(error));

// Response interceptor to handle 401s (expired token)
api.interceptors.response.use(response => response, error => {
  if (error.response && error.response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  }
  return Promise.reject(error);
});

export default api;
