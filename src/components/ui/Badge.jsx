import React from 'react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

export function Badge({ className, variant = "default", glow = false, children, ...props }) {
    const variants = {
        default: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
        success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        destructive: "bg-red-500/10 text-red-400 border-red-500/20",
        outline: "text-foreground border-slate-600",
        neon: "bg-cyan-900/30 text-cyan-300 border-cyan-400/40 shadow-[0_0_10px_rgba(6,182,212,0.3)]",
        cyber: "bg-gradient-to-r from-purple-900/40 to-pink-900/40 text-purple-300 border-purple-500/40"
    };

    const glowStyles = glow ? "shadow-[0_0_15px_currentColor] animate-pulse" : "";

    return (
        <motion.div
            whileHover={{ scale: 1.05 }}
            className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950",
                "relative overflow-hidden group",
                variants[variant],
                glowStyles,
                className
            )}
            {...props}
        >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

            <span className="relative z-10">{children}</span>
        </motion.div>
    );
}
