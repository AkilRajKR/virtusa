import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { UploadCloud, File, AlertTriangle, Activity, Search, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DocumentUploadPage() {
    const navigate = useNavigate();
    const [file, setFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [error, setError] = useState(null);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    const runAnalysis = async () => {
        if (!file) return;
        setIsProcessing(true);
        setError(null);
        setCurrentStep(1);

        const formData = new FormData();
        formData.append('file', file);

        try {
            // Start the actual backend fetch while we play the animation
            const responsePromise = fetch('http://localhost:8000/api/analyze', {
                method: 'POST',
                body: formData,
            });

            // Step 1: Clinical Reader Agent Simulation
            await new Promise(r => setTimeout(r, 1500));
            setCurrentStep(2);

            // Step 2: Evidence Builder Agent Simulation
            await new Promise(r => setTimeout(r, 2000));
            setCurrentStep(3);

            // Step 3: Policy Intelligence Simulation
            await new Promise(r => setTimeout(r, 1800));

            // Await the actual API result
            const response = await responsePromise;

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || 'Failed to analyze document');
            }

            const data = await response.json();
            setCurrentStep(4); // "Complete" status briefly

            await new Promise(r => setTimeout(r, 800));

            // Navigate to results
            navigate('/result', { state: { result: data, filename: file.name } });

        } catch (err) {
            console.error('Upload Error:', err);
            setError(err.message || 'An error occurred while uploading. Ensure the backend is running.');
            setIsProcessing(false);
            setCurrentStep(0);
        }
    };

    const agents = [
        { id: 1, name: "Clinical Reader Agent", icon: Activity, desc: "Extracting entities, diagnoses, and treatment paths...", color: "text-cyan-400", bg: "bg-cyan-500/20" },
        { id: 2, name: "Evidence Builder Agent", icon: Search, desc: "Auditing raw text for explicit supporting evidence...", color: "text-indigo-400", bg: "bg-indigo-500/20" },
        { id: 3, name: "Policy Intelligence Agent", icon: ShieldCheck, desc: "Evaluating medical necessity against insurance rules...", color: "text-purple-400", bg: "bg-purple-500/20" }
    ];

    return (
        <div className="min-h-screen bg-slate-950 p-8 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 cyber-grid-animated opacity-10 pointer-events-none" />

            {/* Background glowing spheres based on active agent */}
            <div className={`absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full blur-[120px] transition-all duration-1000 -z-10 opacity-20 ${currentStep === 1 ? 'bg-cyan-500' : currentStep === 2 ? 'bg-indigo-500' : currentStep === 3 ? 'bg-purple-500' : 'bg-slate-800'
                }`} />

            <div className="w-full max-w-2xl relative z-10">
                <AnimatePresence mode="wait">
                    {!isProcessing ? (
                        <motion.div
                            key="upload-view"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4 }}
                        >
                            <div className="mb-8 text-center">
                                <h1 className="text-3xl font-bold text-white mb-2">Upload Patient Chart</h1>
                                <p className="text-slate-400 text-lg">Initialize AutoAuth Multi-Agent Analysis</p>
                            </div>

                            <GlassCard className="p-10 border-cyan-500/30 text-center shadow-2xl shadow-cyan-900/20">
                                <div className="border-2 border-dashed border-slate-700/50 rounded-xl p-12 transition-all duration-300 hover:border-cyan-500/50 hover:bg-slate-800/30 group relative overflow-hidden">
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />

                                    {!file ? (
                                        <div className="flex flex-col items-center pointer-events-none">
                                            <div className="h-20 w-20 rounded-full bg-cyan-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform group-hover:bg-cyan-500/20">
                                                <UploadCloud className="h-10 w-10 text-cyan-400" />
                                            </div>
                                            <h3 className="text-xl font-semibold text-white mb-2">Drag & Drop or Click</h3>
                                            <p className="text-slate-400">Attach secure patient PDF</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center pointer-events-none">
                                            <div className="h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4 border border-emerald-500/30">
                                                <File className="h-10 w-10 text-emerald-400" />
                                            </div>
                                            <h3 className="text-xl font-bold text-white mb-1">{file.name}</h3>
                                            <p className="text-slate-400 mb-4">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                            <p className="text-cyan-400 text-sm font-medium">Click to select a different file</p>
                                        </div>
                                    )}
                                </div>

                                {error && (
                                    <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center text-red-500 font-medium text-left">
                                        <AlertTriangle className="h-6 w-6 mr-3 flex-shrink-0" />
                                        <p className="text-sm">{error}</p>
                                    </div>
                                )}

                                <div className="mt-8 flex justify-center">
                                    <Button
                                        variant="neon"
                                        className="w-full text-lg py-6"
                                        onClick={runAnalysis}
                                        disabled={!file}
                                    >
                                        Execute Pipeline Workflow
                                    </Button>
                                </div>
                            </GlassCard>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="processing-view"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="w-full max-w-2xl mx-auto"
                        >
                            <div className="text-center mb-10">
                                <h2 className="text-3xl font-bold text-white tracking-tight mb-2 flex items-center justify-center justify-items-center">
                                    <div className="h-4 w-4 bg-emerald-500 rounded-full animate-pulse mr-3"></div>
                                    Orchestrator Active
                                </h2>
                                <p className="text-slate-400 text-lg">Routing real-time data to designated AI models</p>
                            </div>

                            <div className="space-y-4">
                                {agents.map((agent) => {
                                    const isActive = currentStep === agent.id;
                                    const isComplete = currentStep > agent.id;
                                    const Icon = agent.icon;

                                    return (
                                        <GlassCard
                                            key={agent.id}
                                            className={`transition-all duration-700 p-6 flex flex-row items-center border ${isActive ? 'border-cyan-500/60 bg-slate-800/80 shadow-[0_0_30px_rgba(6,182,212,0.15)] scale-105' :
                                                    isComplete ? 'border-emerald-500/30 bg-slate-900/60 opacity-80' :
                                                        'border-slate-800/50 bg-slate-900/30 opacity-40 grayscale'
                                                }`}
                                        >
                                            <div className="relative mr-6">
                                                <div className={`h-14 w-14 rounded-xl flex items-center justify-center transition-colors duration-500 ${isComplete ? 'bg-emerald-500/20' : isActive ? agent.bg : 'bg-slate-800'
                                                    }`}>
                                                    {isComplete ? (
                                                        <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                                                    ) : (
                                                        <Icon className={`h-7 w-7 ${isActive ? agent.color : 'text-slate-500'} ${isActive && 'animate-pulse'}`} />
                                                    )}
                                                </div>
                                                {isActive && (
                                                    <div className="absolute inset-0 h-14 w-14 rounded-xl border-2 border-transparent border-t-cyan-500 animate-spin" />
                                                )}
                                            </div>

                                            <div className="flex-1 text-left">
                                                <h3 className={`text-lg font-bold transition-colors ${isComplete ? 'text-emerald-300' : isActive ? 'text-white' : 'text-slate-500'
                                                    }`}>{agent.name}</h3>
                                                <p className={`text-sm mt-1 mb-0 transition-colors ${isComplete ? 'text-emerald-400/70' : isActive ? 'text-cyan-300' : 'text-slate-600'
                                                    }`}>
                                                    {isComplete ? 'Analysis execution finished.' : isActive ? agent.desc : 'Waiting for handoff...'}
                                                </p>
                                            </div>

                                            {isActive && (
                                                <div className="text-cyan-400 text-sm font-mono animate-pulse">
                                                    EXECUTING_
                                                </div>
                                            )}
                                        </GlassCard>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
