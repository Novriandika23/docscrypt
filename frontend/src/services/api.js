import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  timeout: 30000, // 30 seconds timeout for file operations
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  verify: () => api.get('/auth/verify'),
};

// File API
export const fileAPI = {
  upload: (formData) => {
    return api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  list: () => api.get('/files/list'),
  delete: (fileId) => api.delete(`/files/${fileId}`),
};

// Encryption API
export const encryptionAPI = {
  test: () => api.get('/encryption/test'),
  info: () => api.get('/encryption/info'),
  encrypt: (fileId) => api.post(`/encryption/encrypt/${fileId}`),
  decrypt: (fileId) => api.post(`/encryption/decrypt/${fileId}`),
  download: (fileId) => {
    return api.get(`/encryption/download/${fileId}`, {
      responseType: 'blob',
    });
  },
  downloadEncrypted: (fileId) => {
    return api.get(`/encryption/download-encrypted/${fileId}`, {
      responseType: 'blob',
    });
  },
  decryptUpload: (formData) => {
    return api.post('/encryption/decrypt-upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  downloadDecrypted: (tempId) => {
    return api.get(`/encryption/download-decrypted/${tempId}`, {
      responseType: 'blob',
    });
  },
};

// Utility functions
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
};

export const getAuthToken = () => {
  return localStorage.getItem('token');
};

export const isAuthenticated = () => {
  const token = getAuthToken();
  return !!token;
};

export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const setCurrentUser = (user) => {
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
  } else {
    localStorage.removeItem('user');
  }
};

export default api;
