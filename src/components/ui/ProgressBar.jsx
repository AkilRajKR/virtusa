import React from 'react';
import { motion } from 'framer-motion';

export function ProgressBar({ value = 0, max = 100, variant = 'default', className = '' }) {
    const percentage = Math.min((value / max) * 100, 100);

    const variants = {
        default: 'from-cyan-500 to-cyan-600',
        success: 'from-emerald-500 to-emerald-600',
        warning: 'from-amber-500 to-amber-600',
        danger: 'from-red-500 to-red-600',
    };

    return (
        <div className={`w-full h-2 bg-slate-800 rounded-full overflow-hidden ${className}`}>
            <motion.div
                className={`h-full bg-gradient-to-r ${variants[variant]} rounded-full`}
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
            />
        </div>
    );
}
