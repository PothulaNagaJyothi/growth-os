import axios from 'axios';

// Create configured Axios client
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT token if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Global error logging and standard hooks
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If unauthorized (401), automatically clear token and redirect/reject
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
    }
    return Promise.reject(
      error.response?.data?.error || error.message || 'Something went wrong'
    );
  }
);

export default api;
