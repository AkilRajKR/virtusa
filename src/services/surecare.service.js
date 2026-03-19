/**
 * SureCare AI — API Service Layer
 * All backend API interactions in one place.
 */
import api from './api';

const surecareService = {
    // ── Auth ────────────────────────────────────────────
    async login(email, password) {
        const res = await api.post('/api/auth/login', { email, password });
        return res.data;
    },

    async register(email, name, password, role) {
        const res = await api.post('/api/auth/register', { email, name, password, role });
        return res.data;
    },

    // ── Upload ──────────────────────────────────────────
    async uploadDocument(file, onProgress) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await api.post('/api/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (e) => {
                if (onProgress && e.total) {
                    onProgress(Math.round((e.loaded * 100) / e.total));
                }
            },
        });
        return res.data;
    },

    // ── Analyze (full pipeline) ─────────────────────────
    async analyzeDocument(file, documentId = null) {
        const formData = new FormData();
        if (file) formData.append('file', file);
        if (documentId) formData.append('document_id', documentId);
        const res = await api.post('/api/analyze', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return res.data;
    },

    // ── Predict ─────────────────────────────────────────
    async predict(authorizationId) {
        const res = await api.post('/api/predict', { authorization_id: authorizationId });
        return res.data;
    },

    // ── Submit (FHIR bundle) ────────────────────────────
    async submit(authorizationId) {
        const res = await api.post('/api/submit', { authorization_id: authorizationId });
        return res.data;
    },

    // ── Appeal ──────────────────────────────────────────
    async appeal(authorizationId, denialReasons = []) {
        const res = await api.post('/api/appeal', {
            authorization_id: authorizationId,
            denial_reasons: denialReasons,
        });
        return res.data;
    },

    // ── Insurance Decision ──────────────────────────────
    async insuranceDecide(authorizationId, decision, reason = '') {
        const res = await api.post('/api/insurance/decide', {
            authorization_id: authorizationId,
            decision,
            reason,
        });
        return res.data;
    },

    // ── History ─────────────────────────────────────────
    async getHistory(limit = 50) {
        const res = await api.get('/api/history', { params: { limit } });
        return res.data;
    },

    async getHistoryDetail(authId) {
        const res = await api.get(`/api/history/${authId}`);
        return res.data;
    },

    // ── Audit ───────────────────────────────────────────
    async getAuditLogs(authorizationId = null, limit = 100) {
        const params = { limit };
        if (authorizationId) params.authorization_id = authorizationId;
        const res = await api.get('/api/audit', { params });
        return res.data;
    },

    // ── Dashboard ───────────────────────────────────────
    async getDashboard() {
        const res = await api.get('/api/dashboard');
        return res.data;
    },

    // ── Health ──────────────────────────────────────────
    async healthCheck() {
        const res = await api.get('/health');
        return res.data;
    },
};

export default surecareService;
