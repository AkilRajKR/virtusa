import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

<<<<<<< HEAD
// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('auth_token');
=======
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 120000, // 2 min for long AI processing
});

// Attach JWT token to every request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('surecare_token');
>>>>>>> dashboard
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
<<<<<<< HEAD
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
=======
    (error) => Promise.reject(error)
);

// Handle 401 globally
>>>>>>> dashboard
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
<<<<<<< HEAD
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
=======
            localStorage.removeItem('surecare_token');
            localStorage.removeItem('surecare_user');
>>>>>>> dashboard
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
