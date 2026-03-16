import React, { useState } from 'react';
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
            setLoading(false);
        }
    };

    return (
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
                                {error}
                            </div>
                        )}

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
        </div>
    );
}
