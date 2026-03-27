import axios from 'axios';

export const BACKEND_URL = 'https://readora-backend-u917.onrender.com';
export const BACKEND_HOST = 'readora-backend-u917.onrender.com';

const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

// Auto-attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('readora_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
