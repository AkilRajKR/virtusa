/**
 * SureCare AI — Zustand Store
 * Global state management for pipeline results, history, and cache.
 */
import { create } from 'zustand';
import surecareService from '../services/surecare.service';

const useStore = create((set, get) => ({
    // ── Pipeline State ──────────────────────────────────
    currentResult: null,
    isProcessing: false,
    pipelineError: null,

    setCurrentResult: (result) => set({ currentResult: result, pipelineError: null }),
    clearCurrentResult: () => set({ currentResult: null, pipelineError: null }),

    // ── History ─────────────────────────────────────────
    history: [],
    historyLoading: false,
    historyError: null,
    _historyCacheTime: null,

    fetchHistory: async (force = false) => {
        const state = get();
        // Cache for 30 seconds
        if (!force && state._historyCacheTime && Date.now() - state._historyCacheTime < 30000 && state.history.length > 0) {
            return state.history;
        }
        set({ historyLoading: true, historyError: null });
        try {
            const data = await surecareService.getHistory();
            set({ history: data, historyLoading: false, _historyCacheTime: Date.now() });
            return data;
        } catch (err) {
            set({ historyError: err.response?.data?.detail || 'Failed to load history', historyLoading: false });
            return [];
        }
    },

    // ── Dashboard Metrics ───────────────────────────────
    dashboardMetrics: null,
    dashboardLoading: false,
    _dashboardCacheTime: null,

    fetchDashboard: async (force = false) => {
        const state = get();
        if (!force && state._dashboardCacheTime && Date.now() - state._dashboardCacheTime < 30000 && state.dashboardMetrics) {
            return state.dashboardMetrics;
        }
        set({ dashboardLoading: true });
        try {
            const data = await surecareService.getDashboard();
            set({ dashboardMetrics: data, dashboardLoading: false, _dashboardCacheTime: Date.now() });
            return data;
        } catch {
            set({ dashboardLoading: false });
            return null;
        }
    },

    // ── Audit Logs ──────────────────────────────────────
    auditLogs: [],
    auditLoading: false,

    fetchAuditLogs: async (authorizationId = null) => {
        set({ auditLoading: true });
        try {
            const data = await surecareService.getAuditLogs(authorizationId);
            set({ auditLogs: data, auditLoading: false });
            return data;
        } catch {
            set({ auditLoading: false });
            return [];
        }
    },

    // ── Cache Invalidation ──────────────────────────────
    invalidateCache: () => set({
        _historyCacheTime: null,
        _dashboardCacheTime: null,
    }),

    // ── Full Pipeline ───────────────────────────────────
    runPipeline: async (file) => {
        set({ isProcessing: true, pipelineError: null, currentResult: null });
        try {
            const result = await surecareService.analyzeDocument(file);
            set({ currentResult: result, isProcessing: false, _historyCacheTime: null, _dashboardCacheTime: null });
            return result;
        } catch (err) {
            const msg = err.response?.data?.detail || 'Pipeline processing failed';
            set({ pipelineError: msg, isProcessing: false });
            throw new Error(msg);
        }
    },
}));

export default useStore;
