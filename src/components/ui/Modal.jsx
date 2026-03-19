import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export function Modal({ isOpen, onClose, title, children, size = 'md' }) {
    const sizes = {
        sm: 'max-w-md',
        md: 'max-w-2xl',
        lg: 'max-w-4xl',
        xl: 'max-w-6xl'
    };

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                {/* Modal */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className={`relative w-full ${sizes[size]} bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl`}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-white/10">
                        <h2 className="text-2xl font-bold text-white">{title}</h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <X className="h-5 w-5 text-slate-400" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {children}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
}
