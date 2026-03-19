import api from './api';

export const authService = {
    async login(email, password) {
        const response = await api.post('/api/auth/login', { email, password });
        const { access_token } = response.data;
        localStorage.setItem('auth_token', access_token);
        return access_token;
    },

    async register(data) {
        const response = await api.post('/api/auth/register', data);
        return response.data;
    },

    async getCurrentUser() {
        const response = await api.get('/api/auth/me');
        return response.data;
    },

    logout() {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
    },

    getToken() {
        return localStorage.getItem('auth_token');
    },

    isAuthenticated() {
        return !!this.getToken();
    }
};
