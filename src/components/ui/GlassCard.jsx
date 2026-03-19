import React from 'react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

export function GlassCard({ children, className, hoverEffect = false, variant = "default", ...props }) {
    const variants = {
        default: "bg-slate-900/40 backdrop-blur-xl border border-white/10",
        neon: "bg-slate-900/50 backdrop-blur-xl border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]",
        holographic: "bg-gradient-to-br from-slate-900/60 via-purple-900/30 to-slate-900/60 backdrop-blur-xl border border-white/20 holographic",
        cyber: "bg-slate-900/70 backdrop-blur-2xl border-l-2 border-t-2 border-cyan-500/40 border-r border-b border-white/10",
        glow: "bg-slate-900/40 backdrop-blur-xl border border-cyan-400/40 shadow-[0_0_20px_rgba(6,182,212,0.15),inset_0_0_20px_rgba(6,182,212,0.05)]"
    };

    return (
        <motion.div
            initial={hoverEffect ? { opacity: 0, y: 20 } : undefined}
            animate={hoverEffect ? { opacity: 1, y: 0 } : undefined}
            whileHover={
                hoverEffect
                    ? {
                        scale: 1.02,
                        boxShadow: "0 0 30px rgba(6, 182, 212, 0.4), inset 0 0 30px rgba(6, 182, 212, 0.05)",
                        borderColor: "rgba(6, 182, 212, 0.4)"
                    }
                    : undefined
            }
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={cn(
                "rounded-xl p-6 shadow-xl relative overflow-hidden group",
                variants[variant],
                className
            )}
            {...props}
        >
            {/* Animated gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-cyan-500/[0.07] group-hover:via-purple-500/[0.07] group-hover:to-pink-500/[0.07] transition-all duration-700 pointer-events-none" />

            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-cyan-500/0 group-hover:border-cyan-500/40 transition-all duration-500 rounded-tl-xl" />
            <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-purple-500/0 group-hover:border-purple-500/40 transition-all duration-500 rounded-br-xl" />

            {/* Shimmer effect on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </div>

            {/* Content */}
            <div className="relative z-10">{children}</div>

            {/* Subtle inner glow */}
            <div className="absolute inset-0 rounded-xl shadow-inner opacity-50 pointer-events-none" style={{
                boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.1)'
            }} />
        </motion.div>
    );
}
