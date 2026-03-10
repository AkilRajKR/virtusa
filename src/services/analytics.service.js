import api from './api';

export const analyticsService = {
    async getStats() {
        const response = await api.get('/api/analytics/stats');
        return response.data;
    },

    async getTrends() {
        const response = await api.get('/api/analytics/trends');
        return response.data;
    },

    async getApprovalDistribution() {
        const response = await api.get('/api/analytics/approval-distribution');
        return response.data;
    }
};
