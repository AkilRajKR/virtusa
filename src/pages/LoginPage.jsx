import React, { useState } from 'react';
<<<<<<< HEAD
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Sparkles, LogIn } from 'lucide-react';

export default function LoginPage() {
    const { loginWithGoogle } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError('');
        try {
            await loginWithGoogle();
        } catch (err) {
            setError('Failed to sign in with Google. Please try again.');
=======
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Shield, LogIn, UserPlus, AlertCircle } from 'lucide-react';

export default function LoginPage() {
    const navigate = useNavigate();
    const { login, register } = useAuth();
    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState('doctor');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            if (isRegister) {
                await register(email, name, password, role);
            } else {
                await login(email, password);
            }
            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const quickLogin = async (presetEmail, presetPass) => {
        setLoading(true);
        setError(null);
        try {
            await login(presetEmail, presetPass);
            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
>>>>>>> dashboard
            setLoading(false);
        }
    };

    return (
<<<<<<< HEAD
        <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-slate-950">
            {/* Background elements */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(6,182,212,0.1)_0%,_transparent_70%)]" />
            <div className="absolute inset-0 cyber-grid-animated opacity-20" />

            <div className="relative z-10 w-full max-w-md">
                <motion.div
                    className="text-center mb-8"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="bg-cyan-500/20 p-3 rounded-2xl border border-cyan-500/30">
                            <Sparkles className="h-8 w-8 text-cyan-400" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tighter mb-2">AUTOAUTH <span className="text-cyan-400">AI</span></h1>
                    <p className="text-slate-400 font-medium">Enterprise Prior Authorization Platform</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                >
                    <GlassCard variant="cyber" className="p-10 border-cyan-500/30 bg-slate-900/40 backdrop-blur-xl">
                        <div className="mb-8 text-center">
                            <h2 className="text-xl font-bold text-white mb-2">Welcome Back</h2>
                            <p className="text-slate-400 text-sm">Please sign in with your Google account to access clinical analysis tools.</p>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
=======
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-cyan-500 rounded-full blur-[200px] opacity-10" />
                <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500 rounded-full blur-[200px] opacity-10" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md relative z-10"
            >
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 mb-4 shadow-2xl shadow-cyan-500/20">
                        <Shield className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight">SureCare AI</h1>
                    <p className="text-slate-400 mt-1">Prior Authorization Intelligence</p>
                </div>

                {/* Card */}
                <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        {isRegister ? <UserPlus className="h-5 w-5 text-cyan-400" /> : <LogIn className="h-5 w-5 text-cyan-400" />}
                        {isRegister ? 'Create Account' : 'Sign In'}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {isRegister && (
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
                                <input
                                    type="text" value={name} onChange={(e) => setName(e.target.value)}
                                    required={isRegister}
                                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                                    placeholder="Dr. Sarah Chen"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email</label>
                            <input
                                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                                placeholder="you@surecare.ai"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Password</label>
                            <input
                                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                                placeholder="••••••••"
                            />
                        </div>

                        {isRegister && (
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Role</label>
                                <select
                                    value={role} onChange={(e) => setRole(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-all"
                                >
                                    <option value="doctor">Doctor (Healthcare Provider)</option>
                                    <option value="insurance">Insurance (Payer)</option>
                                    <option value="admin">Admin (System Auditor)</option>
                                </select>
                            </div>
                        )}

                        {error && (
                            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                                <AlertCircle className="h-4 w-4 flex-shrink-0" />
>>>>>>> dashboard
                                {error}
                            </div>
                        )}

<<<<<<< HEAD
                        <Button 
                            variant="neon" 
                            className="w-full flex items-center justify-center gap-3 py-6 text-lg"
                            onClick={handleGoogleLogin}
                            disabled={loading}
                        >
                            <LogIn className="w-5 h-5" />
                            {loading ? 'Connecting...' : 'Continue with Google'}
                        </Button>

                        <div className="mt-8 pt-8 border-t border-slate-800 text-center">
                            <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Secure Agentic Architecture</p>
                        </div>
                    </GlassCard>
                </motion.div>
            </div>
=======
                        <button
                            type="submit" disabled={loading}
                            className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold rounded-xl hover:from-cyan-400 hover:to-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20"
                        >
                            {loading ? 'Processing...' : isRegister ? 'Create Account' : 'Sign In'}
                        </button>
                    </form>

                    <div className="mt-4 text-center">
                        <button
                            onClick={() => { setIsRegister(!isRegister); setError(null); }}
                            className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                        >
                            {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register"}
                        </button>
                    </div>

                    {/* Quick Login */}
                    {!isRegister && (
                        <div className="mt-6 pt-6 border-t border-slate-800">
                            <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-3 text-center">Demo Quick Login</p>
                            <div className="grid grid-cols-3 gap-2">
                                <button onClick={() => quickLogin('doctor@surecare.ai', 'demo123')}
                                    className="px-3 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-all">
                                    🩺 Doctor
                                </button>
                                <button onClick={() => quickLogin('insurance@surecare.ai', 'demo123')}
                                    className="px-3 py-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 text-xs font-bold hover:bg-blue-500/20 transition-all">
                                    🏛️ Insurance
                                </button>
                                <button onClick={() => quickLogin('admin@surecare.ai', 'admin123')}
                                    className="px-3 py-2.5 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400 text-xs font-bold hover:bg-purple-500/20 transition-all">
                                    ⚙️ Admin
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
>>>>>>> dashboard
        </div>
    );
}
