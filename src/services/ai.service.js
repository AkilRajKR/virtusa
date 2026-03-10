import api from './api';

const aiService = {
    /**
     * Run the full multi-agent pipeline on a query.
     * @param {string} query
     * @param {string} [context]
     */
    async query(query, context = null) {
        const res = await api.post('/ai/query', { query, context });
        return res.data;
    },

    /**
     * Upload a document for processing into the vector store.
     * @param {File} file
     * @param {function} onProgress
     */
    async uploadDocument(file, onProgress) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await api.post('/ai/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (e) => {
                if (onProgress && e.total) {
                    onProgress(Math.round((e.loaded * 100) / e.total));
                }
            },
        });
        return res.data;
    },

    /**
     * Get the current user's AI interaction history.
     * @param {number} limit
     */
    async getHistory(limit = 20) {
        const res = await api.get(`/ai/history?limit=${limit}`);
        return res.data;
    },

    /**
     * List all documents uploaded by current user.
     */
    async listDocuments() {
        const res = await api.get('/ai/documents');
        return res.data;
    },

    /**
     * Trigger deep analysis on an uploaded document.
     * @param {number} documentId
     */
    async analyzeDocument(documentId) {
        const res = await api.post('/ai/analyze', { document_id: documentId });
        return res.data;
    },
};

export default aiService;
