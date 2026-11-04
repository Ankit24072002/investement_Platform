import axios from 'axios';

const configuredBaseURL = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');
const baseURL =
  configuredBaseURL === '/api' || configuredBaseURL.endsWith('/api')
    ? configuredBaseURL
    : `${configuredBaseURL}/api`;

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem('token')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth:unauthorized'));
    }

    return Promise.reject(error);
  }
);

export default api;
