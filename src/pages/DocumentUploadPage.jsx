import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, File, AlertTriangle, Activity, Search, ShieldCheck, Brain, Send, CheckCircle2, FileText, Image, FileType, Eye, RefreshCw } from 'lucide-react';
import useStore from '../store/useStore';
import surecareService from '../services/surecare.service';

export default function DocumentUploadPage() {
    const navigate = useNavigate();
    const { runPipeline, isProcessing, pipelineError } = useStore();
    const [file, setFile] = useState(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [error, setError] = useState(null);
    const [uploadResult, setUploadResult] = useState(null);
    const [showOcrPreview, setShowOcrPreview] = useState(false);
    const [showStructuredPreview, setShowStructuredPreview] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.docx'];

    const getFileIcon = (filename) => {
        if (!filename) return File;
        const ext = filename.toLowerCase().split('.').pop();
        if (ext === 'pdf') return FileText;
        if (['png', 'jpg', 'jpeg'].includes(ext)) return Image;
        if (ext === 'docx') return FileType;
        return File;
    };

    const isAllowedFile = (filename) => {
        if (!filename) return false;
        const ext = '.' + filename.toLowerCase().split('.').pop();
        return ALLOWED_EXTENSIONS.includes(ext);
    };

    const handleFileChange = (e) => {
        if (e.target.files?.[0]) {
            const selectedFile = e.target.files[0];
            if (!isAllowedFile(selectedFile.name)) {
                setError(`Unsupported file type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`);
                return;
            }
            setFile(selectedFile);
            setError(null);
            setUploadResult(null);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files?.[0];
        if (droppedFile && isAllowedFile(droppedFile.name)) {
            setFile(droppedFile);
            setError(null);
            setUploadResult(null);
        } else {
            setError(`Unsupported file type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`);
        }
    };

    const handleUploadOnly = async () => {
        if (!file) return;
        setError(null);
        setUploadProgress(0);

        try {
            const result = await surecareService.uploadDocument(file, null, (progress) => {
                setUploadProgress(progress);
            });
            setUploadResult(result);
            setUploadProgress(100);
        } catch (err) {
            setError(err.response?.data?.detail || err.message || 'Upload failed');
            setUploadProgress(0);
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
    const FileIcon = file ? getFileIcon(file.name) : File;

    return (
        <div className="min-h-screen bg-slate-950 p-8 flex flex-col items-center justify-center relative overflow-hidden">
            <div className={`absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full blur-[120px] transition-all duration-1000 -z-10 opacity-15 ${activeColors[Math.min(currentStep, 5)]}`} />

            <div className="w-full max-w-2xl relative z-10">
                <AnimatePresence mode="wait">
                    {currentStep === 0 ? (
                        <motion.div key="upload" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, y: -20 }}>
                            <div className="mb-8 text-center">
                                <h1 className="text-3xl font-bold text-white mb-2">Upload Patient Documents</h1>
                                <p className="text-slate-400 text-lg">Supports PDF, Images (PNG/JPEG), and DOCX files</p>
                            </div>

                            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-10 text-center shadow-2xl"
                                 onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
                                <div className="border-2 border-dashed border-slate-700/50 rounded-xl p-12 transition-all hover:border-cyan-500/50 hover:bg-slate-800/30 group relative overflow-hidden">
                                    <input type="file" accept=".pdf,.png,.jpg,.jpeg,.docx" onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                    {!file ? (
                                        <div className="flex flex-col items-center pointer-events-none">
                                            <div className="h-20 w-20 rounded-full bg-cyan-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                                <UploadCloud className="h-10 w-10 text-cyan-400" />
                                            </div>
                                            <h3 className="text-xl font-semibold text-white mb-2">Drag & Drop or Click</h3>
                                            <p className="text-slate-400">Attach medical documents for analysis</p>
                                            <div className="mt-4 flex gap-2 justify-center">
                                                {['PDF', 'PNG', 'JPEG', 'DOCX'].map((fmt) => (
                                                    <span key={fmt} className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-400 font-mono">{fmt}</span>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center pointer-events-none">
                                            <div className="h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4 border border-emerald-500/30">
                                                <FileIcon className="h-10 w-10 text-emerald-400" />
                                            </div>
                                            <h3 className="text-xl font-bold text-white mb-1">{file.name}</h3>
                                            <p className="text-slate-400 mb-4">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                            <p className="text-cyan-400 text-sm font-medium">Click to select a different file</p>
                                        </div>
                                    )}
                                </div>

                                {/* Upload Progress */}
                                {uploadProgress > 0 && uploadProgress < 100 && (
                                    <div className="mt-4">
                                        <div className="w-full bg-slate-800 rounded-full h-2">
                                            <div className="bg-gradient-to-r from-cyan-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                                                 style={{ width: `${uploadProgress}%` }} />
                                        </div>
                                        <p className="text-slate-400 text-sm mt-1">{uploadProgress}% uploaded</p>
                                    </div>
                                )}

                                {/* OCR Preview after upload */}
                                {uploadResult && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                        className="mt-6 text-left space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-emerald-400 font-bold flex items-center">
                                                <CheckCircle2 className="h-5 w-5 mr-2" />
                                                Upload + OCR Complete
                                            </h4>
                                            <span className="text-xs text-slate-500 font-mono">{uploadResult.ocr_text_length} chars extracted</span>
                                        </div>

                                        {/* OCR Text Preview */}
                                        <button onClick={() => setShowOcrPreview(!showOcrPreview)}
                                            className="w-full flex items-center justify-between p-3 bg-slate-800/50 border border-slate-700/50 rounded-lg hover:bg-slate-800 transition-colors">
                                            <span className="text-sm text-slate-300 flex items-center">
                                                <Eye className="h-4 w-4 mr-2 text-cyan-400" />
                                                OCR Text Preview
                                            </span>
                                            <span className="text-xs text-slate-500">{showOcrPreview ? '▲ Hide' : '▼ Show'}</span>
                                        </button>
                                        {showOcrPreview && (
                                            <div className="p-4 bg-slate-800/30 border border-slate-700/30 rounded-lg max-h-48 overflow-y-auto">
                                                <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono">{uploadResult.ocr_text_preview}</pre>
                                            </div>
                                        )}

                                        {/* Structured Data Preview */}
                                        {uploadResult.structured_data && Object.keys(uploadResult.structured_data).length > 0 && (
                                            <>
                                                <button onClick={() => setShowStructuredPreview(!showStructuredPreview)}
                                                    className="w-full flex items-center justify-between p-3 bg-slate-800/50 border border-slate-700/50 rounded-lg hover:bg-slate-800 transition-colors">
                                                    <span className="text-sm text-slate-300 flex items-center">
                                                        <FileText className="h-4 w-4 mr-2 text-purple-400" />
                                                        Structured Data Preview
                                                    </span>
                                                    <span className="text-xs text-slate-500">{showStructuredPreview ? '▲ Hide' : '▼ Show'}</span>
                                                </button>
                                                {showStructuredPreview && (
                                                    <div className="p-4 bg-slate-800/30 border border-slate-700/30 rounded-lg max-h-48 overflow-y-auto">
                                                        <pre className="text-xs text-emerald-300 whitespace-pre-wrap font-mono">
                                                            {JSON.stringify(uploadResult.structured_data, null, 2)}
                                                        </pre>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </motion.div>
                                )}

                                {error && (
                                    <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center text-red-400 font-medium text-left">
                                        <AlertTriangle className="h-5 w-5 mr-3 flex-shrink-0" />
                                        <p className="text-sm">{error}</p>
                                    </div>
                                )}

                                <div className="mt-8 flex gap-3">
                                    <button onClick={handleUploadOnly} disabled={!file}
                                        className="flex-1 py-4 bg-slate-800 border border-slate-700 text-white font-semibold text-base rounded-xl hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
                                        <UploadCloud className="h-5 w-5" />
                                        Upload + OCR Only
                                    </button>
                                    <button onClick={runAnalysis} disabled={!file}
                                        className="flex-1 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold text-base rounded-xl hover:from-cyan-400 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2">
                                        <Brain className="h-5 w-5" />
                                        Full Pipeline Analysis
                                    </button>
                                </div>
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
