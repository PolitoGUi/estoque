import axios from 'axios';

const api = axios.create({
  baseURL: '/api' // In development, vite proxies this to http://localhost:3000
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
