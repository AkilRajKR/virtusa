import React from 'react';
import { motion } from 'framer-motion';

export function LoadingSkeleton({ variant = 'card', count = 1, className = '' }) {
    const renderSkeleton = () => {
        switch (variant) {
            case 'card':
                return (
                    <div className={`bg-slate-900/50 rounded-xl p-6 ${className}`}>
                        <div className="animate-pulse space-y-4">
                            <div className="h-4 bg-slate-800 rounded w-3/4"></div>
                            <div className="h-4 bg-slate-800 rounded w-1/2"></div>
                            <div className="h-20 bg-slate-800 rounded"></div>
                        </div>
                    </div>
                );
            case 'list':
                return (
                    <div className={`space-y-3 ${className}`}>
                        {[...Array(count)].map((_, i) => (
                            <div key={i} className="flex items-center gap-4 animate-pulse">
                                <div className="h-12 w-12 bg-slate-800 rounded-full"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-slate-800 rounded w-3/4"></div>
                                    <div className="h-3 bg-slate-800 rounded w-1/2"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            case 'text':
                return (
                    <div className={`space-y-2 ${className}`}>
                        {[...Array(count)].map((_, i) => (
                            <div key={i} className="h-4 bg-slate-800 rounded animate-pulse"></div>
                        ))}
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {renderSkeleton()}
        </motion.div>
    );
}
