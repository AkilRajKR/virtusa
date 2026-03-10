import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Sparkles, Zap, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleLogin = () => {
        login('user');
        navigate('/upload');
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-slate-950">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(6,182,212,0.08)_0%,_transparent_70%)]" />
            <div className="absolute inset-0 cyber-grid-animated opacity-20" />

            <div className="relative z-10 w-full max-w-md">
                <motion.div
                    className="text-center mb-8"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="flex items-center justify-center gap-3 mb-3">
                        <Sparkles className="h-7 w-7 text-cyan-400" />
                        <h2 className="text-4xl font-bold text-white">AutoAuth AI</h2>
                        <Sparkles className="h-7 w-7 text-purple-400" />
                    </div>
                    <p className="text-slate-400 text-lg">
                        Clinical AI Agent System
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                >
                    <GlassCard variant="cyber" className="p-8 text-center border-cyan-500/50 bg-slate-900/80">
                        <div className="h-20 w-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg relative overflow-hidden shadow-cyan-500/30">
                            <Zap className="h-10 w-10 text-white relative z-10" />
                        </div>

                        <h3 className="text-2xl font-bold mb-2 text-white">System Access</h3>
                        <p className="text-sm text-slate-400 mb-8 leading-relaxed">
                            Sign in to upload patient files and run the prior authorization AI pipeline.
                        </p>

                        <Button variant="neon" className="w-full text-lg py-6" onClick={handleLogin}>
                            Enter System <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </GlassCard>
                </motion.div>
            </div>
        </div>
    );
}
