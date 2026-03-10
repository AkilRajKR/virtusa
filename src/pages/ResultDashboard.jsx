import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { CheckCircle, XCircle, FileText, ArrowLeft, Activity, Search, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ResultDashboard() {
    const location = useLocation();
    const navigate = useNavigate();
    const result = location.state?.result;
    const filename = location.state?.filename || 'Document';

    if (!result) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center flex-col">
                <p className="text-slate-400 mb-4">No analysis data found.</p>
                <Button variant="outline" onClick={() => navigate('/upload')}>Go back to upload</Button>
            </div>
        );
    }

    const { approval_status, confidence_score, missing_information, details } = result;
    const isApproved = approval_status === 'APPROVED';

    return (
        <div className="min-h-screen bg-slate-950 p-6 md:p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.05)_0%,_transparent_50%)]" />

            <div className="max-w-6xl mx-auto relative z-10">
                <Button variant="ghost" className="mb-6 pl-0 text-slate-400 hover:text-white" onClick={() => navigate('/upload')}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Upload Another
                </Button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Verdict Card */}
                    <div className="lg:col-span-3">
                        <GlassCard className={`p-8 border-l-4 ${isApproved ? 'border-l-emerald-500 bg-emerald-950/10' : 'border-l-rose-500 bg-rose-950/10'}`}>
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-6">
                                    <div className={`h-20 w-20 rounded-full flex items-center justify-center shrink-0 ${isApproved ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                        {isApproved ? <CheckCircle className="h-10 w-10" /> : <XCircle className="h-10 w-10" />}
                                    </div>
                                    <div>
                                        <h2 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-1">Final Decision</h2>
                                        <h1 className={`text-5xl font-bold tracking-tight ${isApproved ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {approval_status}
                                        </h1>
                                        <p className="text-slate-300 mt-2 text-lg">For patient file: <span className="font-semibold text-white">{filename}</span></p>
                                    </div>
                                </div>
                                <div className="text-center md:text-right bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                                    <p className="text-slate-400 text-sm font-medium mb-1">AI Confidence Score</p>
                                    <div className="text-5xl font-black text-white">{confidence_score}%</div>
                                </div>
                            </div>
                        </GlassCard>
                    </div>

                    {/* Agent 1: Clinical Data */}
                    <div className="lg:col-span-1">
                        <GlassCard className="h-full p-6 border-cyan-500/20 flex flex-col">
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
                                <Activity className="h-6 w-6 text-cyan-400" />
                                <h3 className="text-xl font-bold text-white">Clinical Reader Agent</h3>
                            </div>
                            <div className="space-y-4 flex-1">
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-semibold">Diagnosis</p>
                                    <p className="text-slate-200 mt-1">{details?.clinical_data?.diagnosis || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-semibold">Treatment Plan</p>
                                    <p className="text-slate-200 mt-1">{details?.clinical_data?.treatment || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-semibold">Doctor Notes Summary</p>
                                    <p className="text-slate-300 mt-1 text-sm bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                                        {details?.clinical_data?.doctor_notes || 'No notes extracted.'}
                                    </p>
                                </div>
                            </div>
                        </GlassCard>
                    </div>

                    {/* Agent 2: Evidence Validation */}
                    <div className="lg:col-span-1">
                        <GlassCard className="h-full p-6 border-indigo-500/20 flex flex-col">
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
                                <Search className="h-6 w-6 text-indigo-400" />
                                <h3 className="text-xl font-bold text-white">Evidence Builder Agent</h3>
                            </div>
                            <div className="space-y-6 flex-1">
                                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                                    <span className="text-slate-300 font-medium">Diagnosis Supported</span>
                                    {details?.evidence_data?.diagnosis_supported ? (
                                        <span className="text-emerald-400 flex items-center font-semibold bg-emerald-400/10 px-3 py-1 rounded-full text-sm"><CheckCircle className="h-4 w-4 mr-1" /> Yes</span>
                                    ) : (
                                        <span className="text-rose-400 flex items-center font-semibold bg-rose-400/10 px-3 py-1 rounded-full text-sm"><XCircle className="h-4 w-4 mr-1" /> No</span>
                                    )}
                                </div>
                                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                                    <span className="text-slate-300 font-medium">Treatment Supported</span>
                                    {details?.evidence_data?.treatment_supported ? (
                                        <span className="text-emerald-400 flex items-center font-semibold bg-emerald-400/10 px-3 py-1 rounded-full text-sm"><CheckCircle className="h-4 w-4 mr-1" /> Yes</span>
                                    ) : (
                                        <span className="text-rose-400 flex items-center font-semibold bg-rose-400/10 px-3 py-1 rounded-full text-sm"><XCircle className="h-4 w-4 mr-1" /> No</span>
                                    )}
                                </div>

                                {!isApproved && details?.evidence_data?.missing_documents?.length > 0 && (
                                    <div className="mt-4">
                                        <p className="text-xs text-rose-400 uppercase font-semibold mb-2">Missing Evidence</p>
                                        <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
                                            {details.evidence_data.missing_documents.map((doc, i) => <li key={i}>{doc}</li>)}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </GlassCard>
                    </div>

                    {/* Agent 3: Policy Match */}
                    <div className="lg:col-span-1">
                        <GlassCard className="h-full p-6 border-purple-500/20 flex flex-col">
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
                                <ShieldCheck className="h-6 w-6 text-purple-400" />
                                <h3 className="text-xl font-bold text-white">Policy Intelligence</h3>
                            </div>
                            <div className="space-y-6 flex-1">
                                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                                    <span className="text-slate-300 font-medium">Policy Match</span>
                                    {details?.policy_data?.policy_match ? (
                                        <span className="text-emerald-400 flex items-center font-semibold bg-emerald-400/10 px-3 py-1 rounded-full text-sm"><CheckCircle className="h-4 w-4 mr-1" /> Valid</span>
                                    ) : (
                                        <span className="text-rose-400 flex items-center font-semibold bg-rose-400/10 px-3 py-1 rounded-full text-sm"><XCircle className="h-4 w-4 mr-1" /> Invalid</span>
                                    )}
                                </div>

                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-semibold mt-4">Coverage Status</p>
                                    <p className="text-white font-semibold mt-1 text-lg">{details?.policy_data?.coverage_status || 'Unknown'}</p>
                                </div>

                                {!isApproved && missing_information?.length > 0 && (
                                    <div className="mt-4 bg-rose-950/20 border border-rose-500/20 p-4 rounded-xl">
                                        <p className="text-xs text-rose-400 uppercase font-semibold mb-2">Policy Violations</p>
                                        <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
                                            {missing_information.map((info, i) => <li key={i} className="leading-snug">{info}</li>)}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </GlassCard>
                    </div>

                </div>
            </div>
        </div>
    );
}
