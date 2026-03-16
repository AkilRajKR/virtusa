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
        </nav>
    );
}
