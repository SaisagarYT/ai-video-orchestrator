import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Automatically transmits HttpOnly session cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response Interceptor: Catch 401s if needed
api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);
