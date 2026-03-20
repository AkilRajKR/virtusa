<<<<<<< HEAD
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/Button';
import { LogOut, LayoutDashboard, History, Sparkles, User, Info } from 'lucide-react';
import TechStackModal from './TechStackModal';

export default function Navbar() {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const [isTechModalOpen, setIsTechModalOpen] = React.useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <nav className="border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                <div className="flex items-center gap-10">
                    <div className="flex items-center gap-2 mr-4">
                        <div className="bg-cyan-500/20 p-1.5 rounded-lg">
                            <Sparkles className="h-5 w-5 text-cyan-400" />
                        </div>
                        <span className="text-xl font-black text-white tracking-tighter">AUTOAUTH<span className="text-cyan-400">AI</span></span>
                    </div>

                    <div className="hidden md:flex items-center gap-2">
                        <NavLink 
                            to="/upload" 
                            className={({ isActive }) => `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                                isActive ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                        >
                            <LayoutDashboard className="h-4 w-4" />
                            Analyze
                        </NavLink>
                        <NavLink 
                            to="/history" 
                            className={({ isActive }) => `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                                isActive ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                        >
                            <History className="h-4 w-4" />
                            History
                        </NavLink>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="hidden sm:flex items-center gap-3 pr-6 border-r border-slate-800">
                        <div className="text-right">
                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest leading-none">Logged in as</p>
                            <p className="text-xs font-bold text-slate-300 mt-1">{user?.email?.split('@')[0]}</p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                            <User className="h-5 w-5 text-slate-400" />
                        </div>
                    </div>

                    <Button 
                        variant="ghost" 
                        className="text-slate-400 hover:text-cyan-400" 
                        onClick={() => setIsTechModalOpen(true)}
                    >
                        <Info className="h-5 w-5" />
                        <span className="hidden lg:inline ml-2">System Info</span>
                    </Button>

                    <Button variant="ghost" className="text-slate-400 hover:text-rose-400" onClick={handleLogout}>
                        <LogOut className="h-5 w-5" />
                        <span className="hidden sm:inline ml-2">Sign Out</span>
                    </Button>
                </div>
            </div>
            <TechStackModal isOpen={isTechModalOpen} onClose={() => setIsTechModalOpen(false)} />
=======
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield, LayoutDashboard, Upload, History, Clock,
    LogOut, Menu, X, ChevronDown,
} from 'lucide-react';

const NAV_ITEMS = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['doctor', 'insurance', 'admin'] },
    { path: '/upload', label: 'New Analysis', icon: Upload, roles: ['doctor', 'admin'] },
    { path: '/history', label: 'History', icon: History, roles: ['doctor', 'insurance', 'admin'] },
    { path: '/audit', label: 'Audit Trail', icon: Clock, roles: ['admin', 'insurance'] },
];

export default function Navbar() {
    const { user, isAuthenticated, logout } = useAuth();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);

    if (!isAuthenticated) return null;

    const filtered = NAV_ITEMS.filter(item => item.roles.includes(user?.role));

    const roleTag = {
        doctor: { label: 'DOCTOR', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
        insurance: { label: 'INSURANCE', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
        admin: { label: 'ADMIN', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
    }[user?.role] || { label: user?.role, color: 'text-slate-400 bg-slate-800 border-slate-700' };

    return (
        <nav className="bg-slate-950/80 backdrop-blur-xl border-b border-slate-800 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6">
                <div className="h-16 flex items-center justify-between">
                    {/* Logo */}
                    <Link to="/dashboard" className="flex items-center gap-3 group">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/10 group-hover:shadow-cyan-500/20 transition-all">
                            <Shield className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-lg font-black text-white tracking-tight hidden sm:block">SureCare <span className="text-cyan-400">AI</span></span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-1">
                        {filtered.map(item => {
                            const active = location.pathname === item.path;
                            return (
                                <Link key={item.path} to={item.path}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all relative ${
                                        active ? 'text-cyan-400 bg-slate-800/80' : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                                    }`}>
                                    <item.icon className="h-4 w-4" />
                                    {item.label}
                                    {active && <motion.div layoutId="navIndicator" className="absolute bottom-0 left-2 right-2 h-0.5 bg-cyan-400 rounded-full" />}
                                </Link>
                            );
                        })}
                    </div>

                    {/* User */}
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-xs font-bold text-white border border-slate-700">
                                {user?.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-slate-200 leading-none">{user?.name}</p>
                                <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${roleTag.color}`}>
                                    {roleTag.label}
                                </span>
                            </div>
                        </div>
                        <button onClick={logout} title="Logout"
                            className="h-8 w-8 rounded-lg bg-slate-800/50 border border-slate-700 flex items-center justify-center text-slate-500 hover:text-rose-400 hover:border-rose-500/30 transition-all">
                            <LogOut className="h-4 w-4" />
                        </button>
                        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden h-8 w-8 flex items-center justify-center text-slate-400">
                            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="md:hidden overflow-hidden border-t border-slate-800">
                        <div className="px-6 py-4 space-y-1">
                            {filtered.map(item => (
                                <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                                        location.pathname === item.path ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-white'
                                    }`}>
                                    <item.icon className="h-4 w-4" /> {item.label}
                                </Link>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
>>>>>>> dashboard
        </nav>
    );
}
