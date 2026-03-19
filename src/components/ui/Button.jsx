import React from 'react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export function Button({ className, variant = "primary", size = "md", isLoading, children, ...props }) {
    const variants = {
        primary: "bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white shadow-[0_0_20px_rgba(6,182,212,0.5)] border border-cyan-400/30 hover:shadow-[0_0_30px_rgba(6,182,212,0.7)] transition-all duration-300",
        secondary: "bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 text-slate-200 border border-slate-600/50 hover:border-slate-500/70 transition-all duration-300",
        outline: "bg-transparent border-2 border-cyan-500/40 text-cyan-400 hover:bg-cyan-950/40 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all duration-300",
        ghost: "bg-transparent hover:bg-slate-800/60 text-slate-400 hover:text-white transition-all duration-300",
        danger: "bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-400 border border-red-500/30 hover:from-red-500/30 hover:to-red-600/30 hover:border-red-400/50 transition-all duration-300",
        glow: "bg-black border-2 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.6),inset_0_0_15px_rgba(6,182,212,0.1)] hover:shadow-[0_0_25px_rgba(6,182,212,0.9),inset_0_0_20px_rgba(6,182,212,0.2)] hover:text-cyan-300 transition-all duration-300",
        cyber: "relative bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-500/50 text-purple-200 hover:border-purple-400 overflow-hidden group transition-all duration-300",
        neon: "bg-gradient-to-r from-cyan-900/30 to-purple-900/30 border-2 border-cyan-400 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.5),0_0_40px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.8),0_0_50px_rgba(168,85,247,0.5)] hover:scale-105 transition-all duration-300"
    };

    const sizes = {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-5 py-2 text-sm",
        lg: "h-12 px-7 text-base font-semibold",
        icon: "h-10 w-10 p-0 flex items-center justify-center"
    };

    return (
        <motion.button
            whileHover={{ scale: variant === 'neon' ? 1.05 : 1.02 }}
            whileTap={{ scale: 0.97 }}
            className={cn(
                "inline-flex items-center justify-center rounded-lg font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden",
                "before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-700",
                variants[variant],
                sizes[size],
                className
            )}
            disabled={isLoading}
            {...props}
        >
            {variant === 'cyber' && (
                <>
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/20 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-purple-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-pink-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </>
            )}
            <span className="relative z-10 flex items-center gap-2">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {children}
            </span>
        </motion.button>
    );
}
