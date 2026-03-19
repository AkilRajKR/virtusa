import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    LayoutDashboard,
    FileText,
    Activity,
    Settings,
    LogOut,
    ShieldCheck,
    Stethoscope,
    Zap
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

export function Sidebar() {
    const { user, logout } = useAuth();

    const links = [
        { name: 'Dashboard', icon: LayoutDashboard, path: user?.role === 'admin' ? '/dashboard/admin' : '/dashboard/doctor' },
        { name: 'My Patients', icon: Stethoscope, path: '/patients' },
        { name: 'Prior Auths', icon: ShieldCheck, path: '/auths' },
        { name: 'Reports', icon: FileText, path: '/reports' },
        { name: 'Settings', icon: Settings, path: '/settings' },
    ];

    return (
        <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex flex-col h-screen w-64 fixed left-0 top-0 z-50 p-4"
        >
            {/* Floating glass panel */}
            <div className="flex flex-col h-full glass-panel rounded-2xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative overflow-hidden">
                {/* Animated background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5 opacity-0 hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />

                {/* Logo Section */}
                <div className="flex items-center gap-3 px-2 mb-10 relative z-10">
                    <motion.div
                        className="h-10 w-10 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.6)] relative overflow-hidden group"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 400 }}
                    >
                        <Activity className="text-black h-6 w-6 relative z-10" />
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent" />
                        <motion.div
                            className="absolute inset-0 bg-white/20"
                            initial={{ x: "-100%" }}
                            whileHover={{ x: "100%" }}
                            transition={{ duration: 0.5 }}
                        />
                    </motion.div>
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-cyan-300 to-purple-400 neon-text">
                        AutoAuth AI
                    </span>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-2 relative z-10">
                    {links.map((link, index) => (
                        <NavLink
                            key={link.name}
                            to={link.path}
                            className={({ isActive }) => cn(
                                "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden",
                                isActive
                                    ? "bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)] border border-cyan-500/30"
                                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent hover:border-slate-700/50"
                            )}
                        >
                            {({ isActive }) => (
                                <>
                                    {/* Active indicator line */}
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-400 to-purple-400 rounded-r-full shadow-[0_0_10px_rgba(6,182,212,0.8)]"
                                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        />
                                    )}

                                    {/* Hover shimmer effect */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

                                    <link.icon className={cn(
                                        "h-5 w-5 relative z-10 transition-all duration-300",
                                        isActive && "drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]"
                                    )} />
                                    <span className="relative z-10 font-medium">{link.name}</span>

                                    {isActive && (
                                        <Zap className="h-3 w-3 ml-auto text-cyan-400 animate-pulse" />
                                    )}
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* User Profile Section */}
                <div className="mt-auto border-t border-white/10 pt-4 relative z-10">
                    <div className="flex items-center gap-3 px-2 mb-4 group">
                        <div className="relative">
                            <img
                                src={user?.avatar}
                                alt="User"
                                className="h-10 w-10 rounded-full border-2 border-cyan-500/40 group-hover:border-cyan-400 transition-all duration-300"
                            />
                            <div className="absolute inset-0 rounded-full ring-2 ring-cyan-500/0 group-hover:ring-cyan-500/40 transition-all duration-300" />
                            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-emerald-500 rounded-full border-2 border-slate-900 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                            <p className="text-xs text-cyan-400 capitalize font-medium">{user?.role}</p>
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={logout}
                        className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-300 border border-transparent hover:border-red-500/30 relative overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                        <LogOut className="h-4 w-4 relative z-10" />
                        <span className="relative z-10 font-medium">Logout</span>
                    </motion.button>
                </div>

                {/* Corner decorations */}
                <div className="absolute top-4 right-4 w-16 h-16 border-t-2 border-r-2 border-cyan-500/20 rounded-tr-2xl pointer-events-none" />
                <div className="absolute bottom-4 left-4 w-16 h-16 border-b-2 border-l-2 border-purple-500/20 rounded-bl-2xl pointer-events-none" />
            </div>
        </motion.div>
    );
}
