/**
 * SureCare AI — API Service Layer
 * All backend API calls. Role-aware endpoints.
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

    // ── Doctor Upload (initial case doc) ────────────────
    async uploadDocument(file, patientId = null, authId = null, onProgress) {
        const formData = new FormData();
        formData.append('file', file);
        if (patientId) formData.append('patient_id', patientId);
        if (authId)    formData.append('auth_id', authId);
        const res = await api.post('/api/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (e) => {
                if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
            },
        });
        return res.data;
    },

    // ── Patient Upload (missing docs) ───────────────────
    async patientUpload(file, authId, onProgress) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('auth_id', authId);
        const res = await api.post('/api/patient/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (e) => {
                if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
            },
        });
        return res.data;
    },

    // ── Doctor: Verify / Reject a document ─────────────
    async verifyDocument(documentId, action, rejectionReason = null) {
        const res = await api.post('/api/doctor/verify', {
            document_id: documentId,
            action,
            rejection_reason: rejectionReason,
        });
        return res.data;
    },

    // ── Reprocess (manual trigger) ────────────────────
    async reprocess(authId) {
        const res = await api.post('/api/reprocess', { auth_id: authId });
        return res.data;
    },

    // ── Documents for an auth ─────────────────────────
    async getDocuments(authId) {
        const res = await api.get(`/api/documents/${authId}`);
        return res.data;
    },

    // ── Case Lists (role-specific) ────────────────────
    async getPatientCases() {
        const res = await api.get('/api/patient/cases');
        return res.data;
    },
    async getDoctorCases() {
        const res = await api.get('/api/doctor/cases');
        return res.data;
    },
    async getInsuranceCases() {
        const res = await api.get('/api/insurance/cases');
        return res.data;
    },
    async addInsuranceRemarks(authId, remarks) {
        const res = await api.post('/api/insurance/remarks', { auth_id: authId, remarks });
        return res.data;
    },

    // ── Notifications ─────────────────────────────────────
    async getNotifications(authId) {
        const res = await api.get(`/api/notifications/${authId}`);
        return res.data;
    },

    // ── Appeal Workflow ───────────────────────────────────
    async initiateAppeal(authId) {
        const res = await api.post('/api/appeal/initiate', { authorization_id: authId });
        return res.data;
    },

    // ── Admin ────────────────────────────────────────
    async getAdminUsers() {
        const res = await api.get('/api/admin/users');
        return res.data;
    },

    // ── Analyze (full pipeline) ─────────────────────
    async analyzeDocument(file, documentId = null, authId = null, patientId = null) {
        const formData = new FormData();
        if (file) formData.append('file', file);
        if (documentId) formData.append('document_id', documentId);
        if (authId) formData.append('auth_id', authId);
        if (patientId) formData.append('patient_id', patientId);
        const res = await api.post('/api/analyze', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return res.data;
    },

    // ── Predict ────────────────────────────────────
    async predict(authorizationId) {
        const res = await api.post('/api/predict', { authorization_id: authorizationId });
        return res.data;
    },

    // ── Submit ─────────────────────────────────────
    async submit(authorizationId) {
        const res = await api.post('/api/submit', { authorization_id: authorizationId });
        return res.data;
    },

    // ── Appeal ─────────────────────────────────────
    async appeal(authorizationId, denialReasons = []) {
        const res = await api.post('/api/appeal', {
            authorization_id: authorizationId,
            denial_reasons: denialReasons,
        });
        return res.data;
    },

    // ── Insurance Decision ──────────────────────────
    async insuranceDecide(authorizationId, decision, reason = '') {
        const res = await api.post('/api/insurance/decide', {
            authorization_id: authorizationId, decision, reason,
        });
        return res.data;
    },

    // ── History ────────────────────────────────────
    async getHistory(limit = 50) {
        const res = await api.get('/api/history', { params: { limit } });
        return res.data;
    },
    async getHistoryDetail(authId) {
        const res = await api.get(`/api/history/${authId}`);
        return res.data;
    },

    // ── Audit ──────────────────────────────────────
    async getAuditLogs(authorizationId = null, limit = 100) {
        const params = { limit };
        if (authorizationId) params.authorization_id = authorizationId;
        const res = await api.get('/api/audit', { params });
        return res.data;
    },

    // ── Dashboard ──────────────────────────────────
    async getDashboard() {
        const res = await api.get('/api/dashboard');
        return res.data;
    },

    // ── Health ─────────────────────────────────────
    async healthCheck() {
        const res = await api.get('/health');
        return res.data;
    },
};

export default surecareService;
