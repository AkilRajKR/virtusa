import React from 'react';
import { cn } from '../../lib/utils';

export const Input = React.forwardRef(({ className, icon: Icon, error, variant = "default", ...props }, ref) => {
    const variants = {
        default: "bg-slate-900/50 border-slate-700 focus-visible:border-cyan-500",
        cyber: "bg-slate-900/70 border-l-2 border-t-2 border-cyan-500/40 border-r border-b border-slate-700 focus-visible:border-cyan-400 focus-visible:shadow-[0_0_15px_rgba(6,182,212,0.3)]",
        neon: "bg-black/50 border-2 border-cyan-500/30 focus-visible:border-cyan-400 focus-visible:shadow-[0_0_20px_rgba(6,182,212,0.4)]"
    };

    return (
        <div className="relative group">
            {Icon && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-400 transition-colors duration-200">
                    <Icon className="h-4 w-4" />
                </div>
            )}
            <input
                className={cn(
                    "flex h-10 w-full rounded-md px-3 py-2 text-sm backdrop-blur-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300",
                    Icon && "pl-10",
                    error && "border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500",
                    variants[variant],
                    className
                )}
                ref={ref}
                {...props}
            />
            {error && <span className="text-xs text-red-400 mt-1 ml-1 block">{error}</span>}

            {/* Scan line effect on focus */}
            <div className="absolute inset-0 pointer-events-none opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 overflow-hidden rounded-md">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-scan" />
            </div>

            {/* Subtle glow border */}
            <div className="absolute inset-0 rounded-md pointer-events-none border border-white/5 group-focus-within:border-cyan-500/20 transition-colors duration-300" />
        </div>
    );
});
