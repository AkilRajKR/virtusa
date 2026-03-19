import React from 'react';
import toast, { Toaster } from 'react-hot-toast';

export { toast };

export function ToastProvider() {
    return (
        <Toaster
            position="top-right"
            toastOptions={{
                duration: 4000,
                style: {
                    background: 'rgba(15, 23, 42, 0.95)',
                    color: '#fff',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    borderRadius: '12px',
                    backdropFilter: 'blur(12px)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                },
                success: {
                    iconTheme: {
                        primary: '#10b981',
                        secondary: '#fff',
                    },
                    style: {
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                    },
                },
                error: {
                    iconTheme: {
                        primary: '#ef4444',
                        secondary: '#fff',
                    },
                    style: {
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                    },
                },
            }}
        />
    );
}
