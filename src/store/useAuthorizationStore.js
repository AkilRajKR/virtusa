import { create } from 'zustand';

export const useAuthorizationStore = create((set) => ({
    currentAuthorization: null,
    history: [],
    isProcessing: false,

    setCurrentAuthorization: (auth) => set({ currentAuthorization: auth }),

    setHistory: (history) => set({ history }),

    setProcessing: (isProcessing) => set({ isProcessing }),

    addToHistory: (auth) => set((state) => ({
        history: [auth, ...state.history]
    })),

    clearCurrent: () => set({ currentAuthorization: null }),
}));
