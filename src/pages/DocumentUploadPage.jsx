import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, File, AlertTriangle, Activity, Search, ShieldCheck, Brain, Send, CheckCircle2 } from 'lucide-react';
import useStore from '../store/useStore';

export default function DocumentUploadPage() {
    const navigate = useNavigate();
    const { runPipeline, isProcessing, pipelineError } = useStore();
    const [file, setFile] = useState(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [error, setError] = useState(null);

    const handleFileChange = (e) => {
        if (e.target.files?.[0]) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files?.[0];
        if (droppedFile?.name?.toLowerCase().endsWith('.pdf')) {
            setFile(droppedFile);
            setError(null);
        } else {
            setError('Only PDF files are supported');
        }
    };

    const runAnalysis = async () => {
        if (!file) return;
        setError(null);
        setCurrentStep(1);

        try {
            // Animate through agents while real pipeline runs
            const resultPromise = runPipeline(file);

            const delays = [2000, 2500, 2000, 1500, 1500];
            for (let i = 0; i < delays.length; i++) {
                await new Promise(r => setTimeout(r, delays[i]));
                setCurrentStep(i + 2);
            }

            const result = await resultPromise;
            setCurrentStep(6); // Complete
            await new Promise(r => setTimeout(r, 800));
            navigate('/result', { state: { result, filename: file.name } });
        } catch (err) {
            setError(err.message || 'Pipeline processing failed. Is the backend running?');
            setCurrentStep(0);
        }
    };

    const agents = [
        { id: 1, name: "Clinical Reader Agent", icon: Activity, desc: "Extracting medical entities, diagnoses, and treatment paths...", color: "text-cyan-400", bg: "bg-cyan-500/20" },
        { id: 2, name: "Evidence Builder Agent", icon: Search, desc: "Auditing source text for supporting clinical evidence...", color: "text-blue-400", bg: "bg-blue-500/20" },
        { id: 3, name: "Policy Intelligence Agent", icon: ShieldCheck, desc: "Evaluating payer rules via rule engine + vector search...", color: "text-purple-400", bg: "bg-purple-500/20" },
        { id: 4, name: "Risk Prediction Agent", icon: Brain, desc: "Computing approval probability with ML model...", color: "text-amber-400", bg: "bg-amber-500/20" },
        { id: 5, name: "Submission / Appeal Agent", icon: Send, desc: "Generating FHIR bundle or appeal justification...", color: "text-emerald-400", bg: "bg-emerald-500/20" },
    ];

    const activeColors = ['bg-slate-800', 'bg-cyan-500', 'bg-blue-500', 'bg-purple-500', 'bg-amber-500', 'bg-emerald-500'];

    return (
        <div className="min-h-screen bg-slate-950 p-8 flex flex-col items-center justify-center relative overflow-hidden">
            <div className={`absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full blur-[120px] transition-all duration-1000 -z-10 opacity-15 ${activeColors[Math.min(currentStep, 5)]}`} />

            <div className="w-full max-w-2xl relative z-10">
                <AnimatePresence mode="wait">
                    {currentStep === 0 ? (
                        <motion.div key="upload" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, y: -20 }}>
                            <div className="mb-8 text-center">
                                <h1 className="text-3xl font-bold text-white mb-2">Upload Patient Chart</h1>
                                <p className="text-slate-400 text-lg">Initialize SureCare Multi-Agent Analysis Pipeline</p>
                            </div>

                            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-10 text-center shadow-2xl"
                                 onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
                                <div className="border-2 border-dashed border-slate-700/50 rounded-xl p-12 transition-all hover:border-cyan-500/50 hover:bg-slate-800/30 group relative overflow-hidden">
                                    <input type="file" accept=".pdf" onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                    {!file ? (
                                        <div className="flex flex-col items-center pointer-events-none">
                                            <div className="h-20 w-20 rounded-full bg-cyan-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                                <UploadCloud className="h-10 w-10 text-cyan-400" />
                                            </div>
                                            <h3 className="text-xl font-semibold text-white mb-2">Drag & Drop or Click</h3>
                                            <p className="text-slate-400">Attach secure patient PDF for analysis</p>
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
                                    <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center text-red-400 font-medium text-left">
                                        <AlertTriangle className="h-5 w-5 mr-3 flex-shrink-0" />
                                        <p className="text-sm">{error}</p>
                                    </div>
                                )}

                                <button onClick={runAnalysis} disabled={!file}
                                    className="mt-8 w-full py-4 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold text-lg rounded-xl hover:from-cyan-400 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan-500/20">
                                    Execute Pipeline Workflow
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div key="processing" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
                            <div className="text-center mb-10">
                                <h2 className="text-3xl font-bold text-white tracking-tight mb-2 flex items-center justify-center">
                                    <div className="h-4 w-4 bg-emerald-500 rounded-full animate-pulse mr-3" />
                                    Orchestrator Active
                                </h2>
                                <p className="text-slate-400 text-lg">Routing data through 5-agent AI pipeline</p>
                            </div>

                            <div className="space-y-4">
                                {agents.map((agent) => {
                                    const isActive = currentStep === agent.id;
                                    const isComplete = currentStep > agent.id;
                                    const Icon = agent.icon;
                                    return (
                                        <div key={agent.id}
                                            className={`bg-slate-900/60 backdrop-blur-xl border rounded-2xl transition-all duration-700 p-6 flex items-center ${
                                                isActive ? 'border-cyan-500/60 bg-slate-800/80 shadow-[0_0_30px_rgba(6,182,212,0.15)] scale-[1.02]' :
                                                isComplete ? 'border-emerald-500/30 bg-slate-900/60 opacity-80' :
                                                'border-slate-800/50 bg-slate-900/30 opacity-40 grayscale'
                                            }`}>
                                            <div className="relative mr-6">
                                                <div className={`h-14 w-14 rounded-xl flex items-center justify-center transition-colors duration-500 ${
                                                    isComplete ? 'bg-emerald-500/20' : isActive ? agent.bg : 'bg-slate-800'
                                                }`}>
                                                    {isComplete ? <CheckCircle2 className="h-7 w-7 text-emerald-400" /> :
                                                     <Icon className={`h-7 w-7 ${isActive ? agent.color : 'text-slate-500'} ${isActive && 'animate-pulse'}`} />}
                                                </div>
                                                {isActive && <div className="absolute inset-0 h-14 w-14 rounded-xl border-2 border-transparent border-t-cyan-500 animate-spin" />}
                                            </div>
                                            <div className="flex-1 text-left">
                                                <h3 className={`text-lg font-bold ${isComplete ? 'text-emerald-300' : isActive ? 'text-white' : 'text-slate-500'}`}>
                                                    {agent.name}
                                                </h3>
                                                <p className={`text-sm mt-1 ${isComplete ? 'text-emerald-400/70' : isActive ? 'text-cyan-300' : 'text-slate-600'}`}>
                                                    {isComplete ? 'Execution complete.' : isActive ? agent.desc : 'Waiting for handoff...'}
                                                </p>
                                            </div>
                                            {isActive && <div className="text-cyan-400 text-sm font-mono animate-pulse">EXEC_</div>}
                                        </div>
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
