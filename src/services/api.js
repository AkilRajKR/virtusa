import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 120000, // 2 min for long AI processing
});

// Attach JWT token to every request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('surecare_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Handle 401 globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('surecare_token');
            localStorage.removeItem('surecare_user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
