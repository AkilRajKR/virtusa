<<<<<<< HEAD
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
=======
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useStore from '../store/useStore';
import surecareService from '../services/surecare.service';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle, XCircle, FileText, ArrowLeft, Activity, Search, ShieldCheck,
    User, Calendar, MapPin, Stethoscope, AlertCircle, TrendingUp, BookOpen,
    Download, Brain, Send, Scale, BarChart3, Clock,
} from 'lucide-react';
>>>>>>> dashboard

export default function ResultDashboard() {
    const location = useLocation();
    const navigate = useNavigate();
<<<<<<< HEAD
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
=======
    const { authId } = useParams();
    const { user } = useAuth();
    const { currentResult } = useStore();

    const [result, setResult] = useState(location.state?.result || currentResult);
    const [filename, setFilename] = useState(location.state?.filename || 'Document');
    const [activeTab, setActiveTab] = useState('clinical');
    const [appealLoading, setAppealLoading] = useState(false);
    const [decisionLoading, setDecisionLoading] = useState(false);

    // Fetch by auth_id if navigated via URL
    useEffect(() => {
        if (!result && authId) {
            surecareService.getHistoryDetail(authId).then(data => {
                setResult(data);
            }).catch(() => navigate('/history'));
        }
    }, [authId]);

    if (!result) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
                <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 text-center max-w-md">
                    <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No Analysis Data</h3>
                    <p className="text-slate-400 mb-6 text-sm">Upload a document to generate analysis results.</p>
                    <button onClick={() => navigate('/upload')} className="w-full py-3 bg-slate-800 border border-slate-700 text-white rounded-xl hover:bg-slate-700 transition-all font-bold">
                        Go to Upload
                    </button>
                </div>
>>>>>>> dashboard
            </div>
        );
    }

<<<<<<< HEAD
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
=======
    const { status, approval_probability, confidence_score, explanation, details = {}, pipeline_state = {}, audit_trail = [], missing_fields = [] } = result;
    const authorizationId = result.authorization_id || '';
    const isApproved = status === 'APPROVED';
    const isDenied = status === 'DENIED';
    const isIncomplete = status === 'INCOMPLETE';
    const clinical = details.clinical_data || {};
    const evidence = details.evidence_data || {};
    const policy = details.policy_data || {};
    const risk = details.risk_prediction || {};
    const submission = details.submission || {};
    const appeal = details.appeal || {};

    const tabs = [
        { id: 'clinical', label: 'Clinical', icon: Stethoscope },
        { id: 'evidence', label: 'Evidence', icon: Search },
        { id: 'policy', label: 'Policy', icon: ShieldCheck },
        { id: 'risk', label: 'Risk AI', icon: Brain },
        { id: 'submission', label: isApproved ? 'FHIR' : 'Appeal', icon: isApproved ? Send : Scale },
    ];

    const handleAppeal = async () => {
        setAppealLoading(true);
        try {
            const res = await surecareService.appeal(authorizationId);
            setResult(prev => ({ ...prev, status: 'APPEALED', details: { ...prev.details, appeal: res } }));
            setActiveTab('submission');
        } catch (err) { console.error(err); }
        finally { setAppealLoading(false); }
    };

    const handleInsuranceDecision = async (decision) => {
        setDecisionLoading(true);
        try {
            await surecareService.insuranceDecide(authorizationId, decision, `Manual ${decision.toLowerCase()} by ${user?.name}`);
            setResult(prev => ({ ...prev, status: decision }));
            useStore.getState().invalidateCache();
        } catch (err) { console.error(err); }
        finally { setDecisionLoading(false); }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className={`absolute -top-24 -right-24 w-96 h-96 rounded-full blur-[120px] opacity-20 ${isApproved ? 'bg-emerald-500' : isDenied ? 'bg-rose-500' : 'bg-amber-500'}`} />
            </div>

            <div className="max-w-7xl mx-auto px-6 py-10 relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <button className="flex items-center text-slate-400 hover:text-white transition-colors" onClick={() => navigate('/upload')}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> New Analysis
                    </button>
                    <div className="flex gap-2">
                        {user?.role === 'insurance' && status !== 'APPROVED' && status !== 'DENIED' && (
                            <>
                                <button onClick={() => handleInsuranceDecision('APPROVED')} disabled={decisionLoading}
                                    className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm font-bold rounded-xl hover:bg-emerald-500/30 transition-all">
                                    ✓ Approve
                                </button>
                                <button onClick={() => handleInsuranceDecision('DENIED')} disabled={decisionLoading}
                                    className="px-4 py-2 bg-rose-500/20 border border-rose-500/30 text-rose-400 text-sm font-bold rounded-xl hover:bg-rose-500/30 transition-all">
                                    ✕ Deny
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Top Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                    {/* Patient Card */}
                    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
                        <h3 className="text-2xl font-black text-white truncate mb-1">{clinical.patient_name || 'Patient'}</h3>
                        <p className="text-cyan-400 font-mono text-sm mb-4">{clinical.patient_id || 'N/A'}</p>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <Calendar className="h-4 w-4 text-slate-500" />
                                <div><p className="text-[10px] text-slate-500 uppercase font-bold">DOB</p><p className="text-sm text-slate-200">{clinical.dob || 'Unknown'}</p></div>
                            </div>
                            <div className="flex items-center gap-3">
                                <MapPin className="h-4 w-4 text-slate-500" />
                                <div><p className="text-[10px] text-slate-500 uppercase font-bold">Facility</p><p className="text-sm text-slate-200 truncate">{clinical.facility_name || 'N/A'}</p></div>
                            </div>
                        </div>
                    </div>

                    {/* Verdict Card */}
                    <div className="lg:col-span-2 bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 flex items-center gap-8">
                        <div className={`h-20 w-20 rounded-3xl flex items-center justify-center shrink-0 ${
                            isApproved ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                            isDenied ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                            'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                            {isApproved ? <CheckCircle className="h-10 w-10" /> : isDenied ? <XCircle className="h-10 w-10" /> : <AlertCircle className="h-10 w-10" />}
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">AI Decision</p>
                            <h1 className={`text-5xl font-black italic tracking-tighter ${
                                isApproved ? 'text-emerald-400' : isDenied ? 'text-rose-400' : 'text-amber-400'
                            }`}>{status}</h1>
                            <p className="mt-2 text-sm text-slate-400 max-w-md">{explanation}</p>
                            {isDenied && user?.role === 'doctor' && (
                                <button onClick={handleAppeal} disabled={appealLoading}
                                    className="mt-3 px-4 py-2 bg-purple-500/20 border border-purple-500/30 text-purple-400 text-sm font-bold rounded-xl hover:bg-purple-500/30 transition-all">
                                    {appealLoading ? 'Generating...' : '⚡ Generate Appeal'}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Confidence Card */}
                    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
                        <div>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-2">Approval Probability</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-5xl font-black text-white">{Math.round((approval_probability || 0) * 100)}</span>
                                <span className="text-2xl font-bold text-slate-600">%</span>
                            </div>
                        </div>
                        <div className="mt-4">
                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                <motion.div initial={{ width: 0 }} animate={{ width: `${(approval_probability||0)*100}%` }} transition={{ duration: 1 }}
                                    className={`h-full rounded-full ${
                                        (approval_probability||0) > 0.7 ? 'bg-emerald-500' : (approval_probability||0) > 0.4 ? 'bg-amber-500' : 'bg-rose-500'
                                    }`} />
                            </div>
                            <p className="text-[10px] text-slate-500 mt-2 font-bold">{risk.risk_category || 'N/A'} • Model v{risk.model_version || '1.0'}</p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mb-6 p-1 bg-slate-900/50 border border-slate-800 rounded-xl w-fit overflow-x-auto">
                    {tabs.map((tab) => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                                activeTab === tab.id ? 'bg-slate-800 text-cyan-400 border border-slate-700' : 'text-slate-500 hover:text-slate-300'
                            }`}>
                            <tab.icon className="h-4 w-4" />{tab.label}
>>>>>>> dashboard
                        </button>
                    ))}
                </div>

<<<<<<< HEAD
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
=======
                {/* Tab Content */}
                <AnimatePresence mode="wait">
                    <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        {activeTab === 'clinical' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card title="Diagnosis & Treatment" icon={<Activity className="h-5 w-5 text-cyan-400" />}>
                                    <Field label="Primary Diagnosis" value={clinical.diagnosis} />
                                    <Field label="Requested Treatment" value={clinical.treatment} />
                                    <Field label="Provider" value={clinical.requesting_provider} />
                                    <div className="flex flex-wrap gap-2 mt-4">
                                        {(clinical.icd_codes||[]).map(c=><Tag key={c} label={`ICD: ${c}`} />)}
                                        {(clinical.cpt_codes||[]).map(c=><Tag key={c} label={`CPT: ${c}`} />)}
                                    </div>
                                </Card>
                                <Card title="Clinical Rationale" icon={<BookOpen className="h-5 w-5 text-indigo-400" />}>
                                    <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700 min-h-[160px]">
                                        <p className="text-slate-300 leading-relaxed italic text-sm">
                                            "{clinical.clinical_rationale || clinical.doctor_notes || 'No rationale extracted.'}"
                                        </p>
                                    </div>
                                    {(clinical.risk_factors||[]).length > 0 && (
                                        <div className="mt-4">
                                            <p className="text-xs text-slate-500 font-bold uppercase mb-2">Risk Factors</p>
                                            <div className="flex flex-wrap gap-2">
                                                {clinical.risk_factors.map((r,i)=><Tag key={i} label={r} variant="rose" />)}
                                            </div>
                                        </div>
                                    )}
                                </Card>
>>>>>>> dashboard
                            </div>
                        )}

                        {activeTab === 'evidence' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
<<<<<<< HEAD
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
=======
                                <Card title="Evidence Validation" icon={<TrendingUp className="h-5 w-5 text-emerald-400" />}>
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-sm text-slate-400">Evidence Score</span>
                                        <span className="text-2xl font-black text-emerald-400">{evidence.evidence_score||0}/100</span>
                                    </div>
                                    <StatusBadge label="Diagnosis Supported" supported={evidence.diagnosis_supported} />
                                    <StatusBadge label="Treatment Supported" supported={evidence.treatment_supported} />
                                    {evidence.documentation_quality && <Field label="Documentation Quality" value={evidence.documentation_quality} />}
                                    {(evidence.missing_documents||[]).length > 0 && (
                                        <div className="mt-4 p-4 bg-rose-500/5 border border-rose-500/10 rounded-xl">
                                            <p className="text-xs text-rose-400 font-bold uppercase mb-2">Evidence Gaps</p>
                                            {evidence.missing_documents.map((d,i)=><p key={i} className="text-sm text-slate-300 flex items-start gap-2 mb-1"><span className="text-rose-400 mt-1">•</span>{d}</p>)}
                                        </div>
                                    )}
                                </Card>
                                <Card title="Citations" icon={<FileText className="h-5 w-5 text-indigo-400" />}>
                                    <div className="space-y-3">
                                        {(evidence.citations||[]).length > 0 ? evidence.citations.map((q,i)=>(
                                            <div key={i} className="p-4 bg-slate-800/40 rounded-xl border border-slate-700 relative">
                                                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/50 rounded-l-xl" />
                                                <p className="text-xs text-slate-400 italic leading-relaxed ml-2">"{q}"</p>
                                            </div>
                                        )) : <p className="text-sm text-slate-500 text-center py-8 italic">No citations available.</p>}
                                    </div>
                                </Card>
>>>>>>> dashboard
                            </div>
                        )}

                        {activeTab === 'policy' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
<<<<<<< HEAD
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
=======
                                <Card title="Policy Rule Engine" icon={<Activity className="h-5 w-5 text-purple-400" />}>
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-sm text-slate-400">Compliance</span>
                                        <span className={`text-sm font-black ${policy.policy_match?'text-emerald-400':'text-rose-400'}`}>
                                            {policy.policy_match ? 'COMPLIANT' : 'NON-COMPLIANT'}
                                        </span>
                                    </div>
                                    <div className={`p-5 rounded-xl border mb-4 ${policy.policy_match ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-rose-500/5 border-rose-500/10'}`}>
                                        <p className="text-xs text-slate-500 font-bold uppercase mb-2">Medical Necessity Rationale</p>
                                        <p className="text-sm text-slate-300 leading-relaxed">{policy.medical_necessity_rationale || 'N/A'}</p>
                                    </div>
                                    <Field label="Coverage Status" value={policy.coverage_status} />
                                    <Field label="Priority Level" value={policy.priority_level} />
                                </Card>
                                <Card title="Violations & Policies" icon={<AlertCircle className="h-5 w-5 text-rose-400" />}>
                                    {(policy.violations||[]).length > 0 ? policy.violations.map((v,i)=>(
                                        <div key={i} className="flex gap-3 p-4 rounded-xl bg-rose-500/5 border border-rose-500/10 mb-2">
                                            <span className="text-xs font-black text-rose-400 bg-rose-500/20 h-6 w-6 rounded flex items-center justify-center shrink-0">{i+1}</span>
                                            <p className="text-sm text-slate-300">{v}</p>
                                        </div>
                                    )) : (
                                        <div className="flex flex-col items-center py-8 opacity-40">
                                            <CheckCircle className="h-10 w-10 text-emerald-400 mb-2" />
                                            <p className="text-sm font-bold">No Violations</p>
                                        </div>
                                    )}
                                    {(policy.matched_policies||[]).length > 0 && (
                                        <div className="mt-4">
                                            <p className="text-xs text-slate-500 font-bold uppercase mb-2">Matched Policies</p>
                                            {policy.matched_policies.map((p,i)=><Tag key={i} label={p} variant="purple" />)}
                                        </div>
                                    )}
                                </Card>
                            </div>
                        )}

                        {activeTab === 'risk' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card title="Risk Prediction Model" icon={<Brain className="h-5 w-5 text-amber-400" />}>
                                    <div className="text-center mb-6">
                                        <p className="text-6xl font-black text-white">{Math.round((risk.approval_probability||0)*100)}%</p>
                                        <p className="text-sm text-slate-400 mt-1">Approval Probability</p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            CI: [{Math.round((risk.confidence_interval?.[0]||0)*100)}% – {Math.round((risk.confidence_interval?.[1]||0)*100)}%]
                                        </p>
                                    </div>
                                    <div className={`inline-flex px-4 py-2 rounded-full text-sm font-bold ${
                                        risk.risk_category === 'Low Risk' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                        risk.risk_category === 'Medium Risk' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                        'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                    }`}>{risk.risk_category || 'Unknown'}</div>
                                </Card>
                                <Card title="Feature Importance (XAI)" icon={<BarChart3 className="h-5 w-5 text-cyan-400" />}>
                                    <p className="text-xs text-slate-500 mb-4">How much each feature influenced the prediction:</p>
                                    {Object.entries(risk.feature_importance || {}).sort(([,a],[,b])=>b-a).map(([key, value]) => (
                                        <div key={key} className="mb-3">
                                            <div className="flex justify-between mb-1">
                                                <span className="text-xs text-slate-400 capitalize">{key.replace(/_/g, ' ')}</span>
                                                <span className="text-xs font-bold text-cyan-400">{Math.round(value*100)}%</span>
                                            </div>
                                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                                <motion.div initial={{ width: 0 }} animate={{ width: `${value*100}%` }} transition={{ duration: 0.8 }}
                                                    className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full" />
                                            </div>
                                        </div>
                                    ))}
                                </Card>
                            </div>
                        )}

                        {activeTab === 'submission' && (
                            <div className="grid grid-cols-1 gap-6">
                                {isApproved && submission?.fhir_bundle ? (
                                    <Card title="FHIR R4 Prior Authorization Bundle" icon={<Send className="h-5 w-5 text-emerald-400" />}>
                                        <div className="flex items-center gap-4 mb-4">
                                            <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full font-bold">{submission.fhir_bundle_type}</span>
                                            <span className="text-xs text-slate-500">{submission.resource_count} resources</span>
                                        </div>
                                        <pre className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-xs text-slate-300 overflow-auto max-h-[500px] custom-scrollbar font-mono leading-relaxed">
                                            {JSON.stringify(submission.fhir_bundle, null, 2)}
                                        </pre>
                                    </Card>
                                ) : (appeal?.appeal_letter || result.status === 'APPEALED') ? (
                                    <Card title="Appeal Letter" icon={<Scale className="h-5 w-5 text-purple-400" />}>
                                        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-4">
                                            <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">{appeal.appeal_letter}</pre>
                                        </div>
                                        {(appeal.counter_arguments||[]).length > 0 && (
                                            <div className="mb-4">
                                                <p className="text-xs text-purple-400 font-bold uppercase mb-2">Counter Arguments</p>
                                                {appeal.counter_arguments.map((a,i)=><p key={i} className="text-sm text-slate-300 mb-2 flex gap-2"><span className="text-purple-400 font-bold shrink-0">{i+1}.</span>{a}</p>)}
                                            </div>
                                        )}
                                        {(appeal.supporting_references||[]).length > 0 && (
                                            <div>
                                                <p className="text-xs text-cyan-400 font-bold uppercase mb-2">Supporting References</p>
                                                {appeal.supporting_references.map((r,i)=><Tag key={i} label={r} variant="cyan" />)}
                                            </div>
                                        )}
                                    </Card>
                                ) : (
                                    <Card title="No Submission Data" icon={<AlertCircle className="h-5 w-5 text-amber-400" />}>
                                        <p className="text-slate-400 text-center py-8">{isIncomplete ? 'Case is incomplete. Please provide missing documentation.' : 'Generate an appeal to see submission data.'}</p>
                                    </Card>
                                )}
>>>>>>> dashboard
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
<<<<<<< HEAD
=======

                {/* Audit Trail */}
                {audit_trail.length > 0 && (
                    <div className="mt-8">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Clock className="h-5 w-5 text-slate-500" /> Pipeline Audit Trail</h3>
                        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden">
                            <table className="w-full text-sm">
                                <thead><tr className="border-b border-slate-800">
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Agent</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Action</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Duration</th>
                                </tr></thead>
                                <tbody>
                                    {audit_trail.map((a,i) => (
                                        <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/20">
                                            <td className="px-4 py-3 font-bold text-slate-200">{a.agent}</td>
                                            <td className="px-4 py-3 text-slate-400 font-mono text-xs">{a.action}</td>
                                            <td className="px-4 py-3">
                                                <span className={`text-xs font-bold px-2 py-1 rounded ${a.status==='completed'?'bg-emerald-500/10 text-emerald-400':'bg-amber-500/10 text-amber-400'}`}>
                                                    {a.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-500 font-mono text-xs">{a.duration_ms||0}ms</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
>>>>>>> dashboard
            </div>
        </div>
    );
}
<<<<<<< HEAD
=======

// ── Reusable sub-components ────────────────────────────────
function Card({ title, icon, children }) {
    return (
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">{icon}<h3 className="text-lg font-bold text-white">{title}</h3></div>
            {children}
        </div>
    );
}

function Field({ label, value }) {
    return (
        <div className="mb-3">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">{label}</p>
            <p className="text-sm font-bold text-slate-200">{value || 'N/A'}</p>
        </div>
    );
}

function StatusBadge({ label, supported }) {
    return (
        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/30 border border-slate-700 mb-2">
            <span className="text-sm text-slate-300 font-medium">{label}</span>
            {supported ? (
                <span className="text-emerald-400 flex items-center text-xs font-bold bg-emerald-400/10 px-3 py-1 rounded-full"><CheckCircle className="h-3.5 w-3.5 mr-1" />VERIFIED</span>
            ) : (
                <span className="text-rose-400 flex items-center text-xs font-bold bg-rose-400/10 px-3 py-1 rounded-full"><XCircle className="h-3.5 w-3.5 mr-1" />GAP</span>
            )}
        </div>
    );
}

function Tag({ label, variant = 'slate' }) {
    const colors = {
        slate: 'bg-slate-800 text-slate-400 border-slate-700',
        rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    };
    return <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold border mr-1 mb-1 ${colors[variant]}`}>{label}</span>;
}
>>>>>>> dashboard
