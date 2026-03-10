import React from 'react';
import { Bell, Search, Menu } from 'lucide-react';
import { Input } from '../ui/Input';
import { motion } from 'framer-motion';

export function Topbar() {
    return (
        <div className="h-16 border-b border-white/5 bg-slate-900/50 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-40 ml-64 relative overflow-hidden">
            {/* Holographic shimmer background */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/[0.02] via-purple-500/[0.02] to-pink-500/[0.02] opacity-50" />

            {/* Subtle scan line */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

            <div className="flex items-center gap-4 relative z-10">
                <Menu className="h-5 w-5 text-slate-400 lg:hidden hover:text-cyan-400 transition-colors cursor-pointer" />
                <div className="w-96">
                    <Input
                        placeholder="Search patients, claims, or policies..."
                        icon={Search}
                        variant="cyber"
                        className="bg-slate-800/50 border-slate-700/50 focus:bg-slate-800 transition-all duration-300"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4 relative z-10">
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative"
                >
                    <button className="p-2.5 text-slate-400 hover:text-cyan-400 transition-all duration-300 hover:bg-slate-800/50 rounded-full relative group">
                        <Bell className="h-5 w-5" />

                        {/* Notification badge */}
                        <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-cyan-500 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.8)]">
                            <span className="absolute inset-0 bg-cyan-500 rounded-full animate-ping opacity-75" />
                        </span>

                        {/* Glow on hover */}
                        <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]" />
                    </button>
                </motion.div>

                {/* Status indicator */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                    <div className="h-2 w-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)]">
                        <div className="absolute h-2 w-2 bg-emerald-500 rounded-full animate-ping" />
                    </div>
                    <span className="text-xs font-medium text-emerald-400">System Online</span>
                </div>
            </div>
        </div>
    );
}
