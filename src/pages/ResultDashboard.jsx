import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { 
    CheckCircle, XCircle, FileText, ArrowLeft, Activity, 
    Search, ShieldCheck, User, Calendar, MapPin, 
    Stethoscope, AlertCircle, TrendingUp, BookOpen,
    Download, Share2, Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ResultDashboard() {
    const location = useLocation();
    const navigate = useNavigate();
    const result = location.state?.result;
    const filename = location.state?.filename || 'Document';
    const [activeTab, setActiveTab] = useState('clinical');

    if (!result) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center flex-col p-6">
                <GlassCard className="p-8 text-center max-w-md">
                    <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No Analysis Data Found</h3>
                    <p className="text-slate-400 mb-6 text-sm">We couldn't find the results for this analysis session. Please try uploading your document again.</p>
                    <Button variant="outline" className="w-full" onClick={() => navigate('/upload')}>
                        Return to Upload
                    </Button>
                </GlassCard>
            </div>
        );
    }

    const { approval_status, confidence_score, missing_information, details } = result;
    const isApproved = approval_status === 'APPROVED';
    const clinical = details?.clinical_data || {};
    const evidence = details?.evidence_data || {};
    const policy = details?.policy_data || {};

    const tabs = [
        { id: 'clinical', label: 'Clinical Profile', icon: Stethoscope },
        { id: 'evidence', label: 'Evidence Audit', icon: Search },
        { id: 'policy', label: 'Policy Assessment', icon: ShieldCheck }
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200">
            {/* Background Glows */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className={`absolute -top-24 -right-24 w-96 h-96 rounded-full blur-[120px] opacity-20 ${isApproved ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                <div className="absolute top-1/2 -left-24 w-96 h-96 bg-cyan-500 rounded-full blur-[120px] opacity-10" />
            </div>

            <div className="max-w-7xl mx-auto px-6 py-10 relative z-10">
                {/* Header Actions */}
                <div className="flex items-center justify-between mb-8">
                    <Button variant="ghost" className="pl-0 text-slate-400 hover:text-white transition-colors" onClick={() => navigate('/upload')}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Analyze New Patient
                    </Button>
                    <div className="flex gap-3">
                        <Button variant="outline" className="h-10 w-10 p-0 rounded-xl" title="Print Report">
                            <Printer className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" className="h-10 w-10 p-0 rounded-xl" title="Share Analysis">
                            <Share2 className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" className="gap-2 rounded-xl">
                            <Download className="h-4 w-4" /> Full Report (PDF)
                        </Button>
                    </div>
                </div>

                {/* Main Identity & Verdict Section */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-10">
                    {/* Patient identity Card */}
                    <GlassCard className="lg:col-span-1 p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                            <User className="h-16 w-16" />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-2xl font-black text-white truncate mb-1">{clinical.patient_name || 'Generic Patient'}</h3>
                            <p className="text-cyan-400 font-mono text-sm mb-6 flex items-center gap-1.5">
                                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">ID:</span> {clinical.patient_id || 'N/A'}
                            </p>
                            
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center border border-slate-800">
                                        <Calendar className="h-4 w-4 text-slate-400" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest leading-none mb-1">Birth Date</p>
                                        <p className="text-sm font-bold text-slate-200">{clinical.dob || 'Unknown'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center border border-slate-800">
                                        <MapPin className="h-4 w-4 text-slate-400" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest leading-none mb-1">Facility</p>
                                        <p className="text-sm font-bold text-slate-200 truncate">{clinical.facility_name || 'Local Hospital'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </GlassCard>

                    {/* Central Verdict Card */}
                    <GlassCard className="lg:col-span-2 p-8 flex items-center gap-8 relative overflow-hidden">
                        <div className={`absolute inset-0 opacity-[0.03] pointer-events-none transition-colors ${isApproved ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        
                        <div className={`h-24 w-24 rounded-3xl flex items-center justify-center shrink-0 shadow-2xl ${
                            isApproved ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 
                            'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}>
                            {isApproved ? <CheckCircle className="h-12 w-12" /> : <XCircle className="h-12 w-12" />}
                        </div>

                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h2 className="text-slate-400 text-xs font-black uppercase tracking-[0.2em]">Automated Verdict</h2>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${
                                    isApproved ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 
                                    'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                                }`}>Verified Agent Decision</span>
                            </div>
                            <h1 className={`text-6xl font-black italic tracking-tighter ${isApproved ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {approval_status}
                            </h1>
                            <p className="mt-3 text-slate-300 max-w-sm">
                                {isApproved 
                                    ? "Standard care protocol satisfied. All clinical evidence and policy requirements have been verified by the orchestrator." 
                                    : "Authorization cannot be granted at this time due to critical policy exceptions or insufficient clinical documentation."
                                }
                            </p>
                        </div>
                    </GlassCard>

                    {/* Confidence Score Card */}
                    <GlassCard className="lg:col-span-1 p-6 flex flex-col justify-between border-slate-800">
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Confidence Score</h3>
                                <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-6xl font-black text-white">{confidence_score}</span>
                                <span className="text-2xl font-bold text-slate-600">%</span>
                            </div>
                        </div>
                        
                        <div className="mt-6">
                            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${confidence_score}%` }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    className={`h-full rounded-full ${
                                        confidence_score > 80 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 
                                        confidence_score > 50 ? 'bg-yellow-500' : 'bg-rose-500'
                                    }`} 
                                />
                            </div>
                            <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-tighter">System Reliability Metric (Gemini 2.5 Flash)</p>
                        </div>
                    </GlassCard>
                </div>

                {/* Dashboard Tabs & Content */}
                <div className="flex gap-2 mb-6 p-1.5 bg-slate-900/50 border border-slate-800 rounded-2xl w-fit">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                                activeTab === tab.id 
                                ? 'bg-slate-800 text-cyan-400 shadow-xl border border-slate-700' 
                                : 'text-slate-500 hover:text-slate-300'
                            }`}
                        >
                            <tab.icon className="h-4 w-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === 'clinical' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <GlassCard className="p-8">
                                    <div className="flex items-center gap-3 mb-6">
                                        <Activity className="h-5 w-5 text-cyan-400" />
                                        <h3 className="text-lg font-bold text-white uppercase tracking-tight">Clinical Diagnosis & Logic</h3>
                                    </div>
                                    <div className="space-y-6">
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase font-black tracking-widest mb-2">Primary Diagnosis</p>
                                            <p className="text-xl font-bold text-slate-100">{clinical.diagnosis || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase font-black tracking-widest mb-2">Requested Treatment</p>
                                            <p className="text-xl font-bold text-slate-100">{clinical.treatment || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase font-black tracking-widest mb-2">Treatment Provider</p>
                                            <p className="text-slate-300 font-bold">{clinical.requesting_provider || 'Not Specified'}</p>
                                        </div>
                                    </div>
                                </GlassCard>

                                <GlassCard className="p-8">
                                    <div className="flex items-center gap-3 mb-6">
                                        <BookOpen className="h-5 w-5 text-indigo-400" />
                                        <h3 className="text-lg font-bold text-white uppercase tracking-tight">Clinical Rationale</h3>
                                    </div>
                                    <div className="bg-slate-900/40 rounded-2xl p-6 border border-slate-800 min-h-[200px]">
                                        <p className="text-slate-300 leading-relaxed italic">
                                            "{clinical.clinical_rationale || clinical.doctor_notes || 'No rationale extracted from documentation.'}"
                                        </p>
                                    </div>
                                    <div className="mt-6 flex flex-wrap gap-2">
                                        {(clinical.icd_codes || []).map(code => (
                                            <span key={code} className="px-3 py-1 bg-slate-800 text-slate-400 rounded-lg text-xs font-mono font-bold border border-slate-700">ICD: {code}</span>
                                        ))}
                                        {(clinical.cpt_codes || []).map(code => (
                                            <span key={code} className="px-3 py-1 bg-slate-800 text-slate-400 rounded-lg text-xs font-mono font-bold border border-slate-700">CPT: {code}</span>
                                        ))}
                                    </div>
                                </GlassCard>
                            </div>
                        )}

                        {activeTab === 'evidence' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <GlassCard className="p-8">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-3">
                                            <TrendingUp className="h-5 w-5 text-emerald-400" />
                                            <h3 className="text-lg font-bold text-white uppercase tracking-tight">Strength of Proof</h3>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-slate-500 uppercase font-black">Score Index</p>
                                            <p className="text-2xl font-black text-emerald-400">{evidence.evidence_score || 0}/100</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-5 rounded-2xl bg-slate-900/50 border border-slate-800">
                                            <span className="text-slate-300 font-bold">Documentary Support (Diagnosis)</span>
                                            {evidence.diagnosis_supported ? (
                                                <span className="text-emerald-400 flex items-center font-black bg-emerald-400/10 px-4 py-1.5 rounded-full text-xs border border-emerald-400/20"><CheckCircle className="h-4 w-4 mr-1.5" /> VERIFIED</span>
                                            ) : (
                                                <span className="text-rose-400 flex items-center font-black bg-rose-400/10 px-4 py-1.5 rounded-full text-xs border border-rose-400/20"><XCircle className="h-4 w-4 mr-1.5" /> GAP EXIST</span>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between p-5 rounded-2xl bg-slate-900/50 border border-slate-800">
                                            <span className="text-slate-300 font-bold">Documentary Support (Treatment)</span>
                                            {evidence.treatment_supported ? (
                                                <span className="text-emerald-400 flex items-center font-black bg-emerald-400/10 px-4 py-1.5 rounded-full text-xs border border-emerald-400/20"><CheckCircle className="h-4 w-4 mr-1.5" /> VERIFIED</span>
                                            ) : (
                                                <span className="text-rose-400 flex items-center font-black bg-rose-400/10 px-4 py-1.5 rounded-full text-xs border border-rose-400/20"><XCircle className="h-4 w-4 mr-1.5" /> GAP EXIST</span>
                                            )}
                                        </div>
                                    </div>

                                    {evidence.missing_documents?.length > 0 && (
                                        <div className="mt-8 p-6 bg-rose-950/20 border border-rose-500/20 rounded-2xl">
                                            <div className="flex items-center gap-2 mb-4">
                                                <AlertCircle className="h-4 w-4 text-rose-400" />
                                                <h4 className="text-xs font-black text-rose-400 uppercase tracking-widest">Identified Evidence Gaps</h4>
                                            </div>
                                            <ul className="space-y-3">
                                                {evidence.missing_documents.map((doc, i) => (
                                                    <li key={i} className="flex items-start gap-2.5 text-sm font-medium text-slate-300">
                                                        <div className="h-1.5 w-1.5 rounded-full bg-rose-500 mt-1.5" />
                                                        {doc}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </GlassCard>

                                <GlassCard className="p-8">
                                    <div className="flex items-center gap-3 mb-6">
                                        <FileText className="h-5 w-5 text-indigo-400" />
                                        <h3 className="text-lg font-bold text-white uppercase tracking-tight">Evidence Citations</h3>
                                    </div>
                                    <div className="space-y-4">
                                        {evidence.citations?.length > 0 ? (
                                            evidence.citations.map((quote, i) => (
                                                <div key={i} className="p-4 bg-slate-900/40 rounded-xl border border-slate-800 relative group transition-all hover:bg-slate-800/40">
                                                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/50 rounded-l-xl" />
                                                    <p className="text-xs text-slate-400 italic font-medium leading-relaxed">"{quote}"</p>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-10 text-center opacity-30">
                                                <p className="text-sm italic">No specific text block citations available for this match.</p>
                                            </div>
                                        )}
                                    </div>
                                </GlassCard>
                            </div>
                        )}

                        {activeTab === 'policy' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <GlassCard className="p-8">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-3">
                                            <Activity className="h-5 w-5 text-purple-400" />
                                            <h3 className="text-lg font-bold text-white uppercase tracking-tight">Policy Rule Engine</h3>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-slate-500 uppercase font-black">Audit Logic</p>
                                            <p className={`text-sm font-black italic tracking-tighter ${policy.policy_match ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {policy.policy_match ? 'COMPLIANT' : 'NON-COMPLIANT'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mb-8">
                                        <div className={`p-6 rounded-2xl border ${
                                            policy.policy_match ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'
                                        }`}>
                                            <p className="text-xs text-slate-500 uppercase font-black tracking-widest mb-3">Policy Rationale</p>
                                            <p className="text-slate-200 text-sm leading-relaxed leading-relaxed font-medium capitalize">
                                                {policy.medical_necessity_rationale || "System could not generate a formal medical necessity rationale block."}
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-xs text-slate-500 uppercase font-black tracking-widest mb-3">Risk Assessment</p>
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1 h-4 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                                                <div className={`h-full w-1/${policy.priority_level === 'High' ? '1' : policy.priority_level === 'Medium' ? '2' : '3'} ${
                                                    policy.priority_level === 'High' ? 'bg-rose-500' : policy.priority_level === 'Medium' ? 'bg-amber-500' : 'bg-cyan-500'
                                                }`} />
                                            </div>
                                            <span className="font-bold text-sm text-slate-300">{policy.priority_level || 'Low'} Priority</span>
                                        </div>
                                    </div>
                                </GlassCard>

                                <GlassCard className="p-8">
                                    <div className="flex items-center gap-3 mb-6">
                                        <AlertCircle className="h-5 w-5 text-rose-400" />
                                        <h3 className="text-lg font-bold text-white uppercase tracking-tight">Coverage Exceptions</h3>
                                    </div>
                                    <div className="space-y-4">
                                        {policy.violations?.length > 0 ? (
                                            policy.violations.map((v, i) => (
                                                <div key={i} className="flex gap-4 p-5 rounded-2xl bg-rose-500/5 border border-rose-500/10">
                                                    <div className="h-6 w-6 rounded-lg bg-rose-500/20 flex items-center justify-center shrink-0 border border-rose-500/30">
                                                        <span className="text-xs font-black text-rose-400">{i + 1}</span>
                                                    </div>
                                                    <p className="text-sm font-bold text-slate-300 italic">"{v}"</p>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-10 opacity-40">
                                                <CheckCircle className="h-10 w-10 text-emerald-400 mb-2" />
                                                <p className="text-sm font-bold">No Violations Found</p>
                                            </div>
                                        )}
                                    </div>
                                </GlassCard>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
