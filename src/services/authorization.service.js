import api from './api';

export const authorizationService = {
    async createAuthorization(data) {
        const response = await api.post('/api/authorizations/', data);
        return response.data;
    },

    async uploadDocument(authId, file) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post(`/api/authorizations/${authId}/upload`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    async processAuthorization(authId, clinicalText) {
        const response = await api.post(`/api/authorizations/${authId}/process`, {
            authorization_id: authId,
            clinical_text: clinicalText
        });
        return response.data;
    },

    async getAuthorization(authId) {
        const response = await api.get(`/api/authorizations/${authId}`);
        return response.data;
    },

    async getHistory(limit = 50) {
        const response = await api.get('/api/authorizations/history', {
            params: { limit }
        });
        return response.data;
    }
};
