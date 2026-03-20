import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Shield, FileText, CheckCircle2, XCircle, Eye,
    RefreshCw, Folder, ChevronDown, ChevronUp,
    MessageSquare, TrendingUp, AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import surecareService from '../services/surecare.service';

export default function InsuranceDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedCase, setExpandedCase] = useState(null);
    const [remarksText, setRemarksText] = useState({});
    const [savingRemarks, setSavingRemarks] = useState(null);
    const [message, setMessage] = useState(null);

    const showMsg = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 5000);
    };

    const loadCases = useCallback(async () => {
        setLoading(true);
        try {
            const data = await surecareService.getInsuranceCases();
            setCases(data);
        } catch {
            showMsg('error', 'Failed to load finalized cases.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadCases(); }, [loadCases]);

    const handleSaveRemarks = async (authId) => {
        const remarks = remarksText[authId] || '';
        if (!remarks.trim()) return;
        setSavingRemarks(authId);
        try {
            await surecareService.addInsuranceRemarks(authId, remarks);
            showMsg('success', 'Remarks saved successfully.');
        } catch (err) {
            showMsg('error', err.response?.data?.detail || 'Failed to save remarks');
        } finally {
            setSavingRemarks(null);
        }
    };

    // Summary stats
    const total = cases.length;
    const approved = cases.filter(c => c.status === 'FINALIZED' || c.status === 'APPROVED').length;
    const denied = cases.filter(c => c.status === 'DENIED').length;
    const avgProb = cases.length > 0
        ? (cases.reduce((sum, c) => sum + (c.approval_probability || 0), 0) / cases.length * 100).toFixed(1)
        : 0;

    return (
        <div className="min-h-screen bg-slate-950 p-6">
            <div className="max-w-6xl mx-auto mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                <Shield className="h-5 w-5 text-purple-400" />
                            </div>
                            Insurance Review Portal
                        </h1>
                        <p className="text-slate-400 mt-1">
                            <span className="text-purple-400 font-medium">{user?.name}</span> — reviewing finalized cases only
                        </p>
                    </div>
                    <button onClick={loadCases}
                        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                        <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Stats Bar */}
            {!loading && cases.length > 0 && (
                <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {[
                        { label: 'Total Cases', value: total, color: 'text-white', bg: 'bg-slate-800/60' },
                        { label: 'Approved / Finalized', value: approved, color: 'text-emerald-300', bg: 'bg-emerald-500/10' },
                        { label: 'Denied', value: denied, color: 'text-red-300', bg: 'bg-red-500/10' },
                        { label: 'Avg AI Probability', value: `${avgProb}%`, color: 'text-purple-300', bg: 'bg-purple-500/10' },
                    ].map(stat => (
                        <div key={stat.label} className={`${stat.bg} border border-slate-800 rounded-xl p-4`}>
                            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                            <div className="text-slate-500 text-sm mt-1">{stat.label}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Toast */}
            <AnimatePresence>
                {message && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className={`max-w-6xl mx-auto mb-4 p-4 rounded-xl border flex items-center gap-3 ${
                            message.type === 'success'
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                : 'bg-red-500/10 border-red-500/30 text-red-300'
                        }`}>
                        {message.type === 'success' ? <CheckCircle2 className="h-5 w-5 flex-shrink-0" /> : <XCircle className="h-5 w-5 flex-shrink-0" />}
                        <span className="flex-1">{message.text}</span>
                        <button onClick={() => setMessage(null)} className="opacity-60 hover:opacity-100">✕</button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="max-w-6xl mx-auto space-y-4">
                {loading && (
                    <div className="text-center py-20">
                        <div className="h-12 w-12 rounded-full border-2 border-t-purple-500 border-slate-700 animate-spin mx-auto mb-4" />
                        <p className="text-slate-400">Loading finalized cases…</p>
                    </div>
                )}

                {!loading && cases.length === 0 && (
                    <div className="text-center py-20 bg-slate-900/40 border border-slate-800 rounded-2xl">
                        <AlertCircle className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-slate-400 mb-2">No finalized cases</h3>
                        <p className="text-slate-500">Cases appear here once they are fully processed and finalized by doctors.</p>
                    </div>
                )}

                {cases.map(c => {
                    const isApproved = c.status === 'FINALIZED' || c.status === 'APPROVED';
                    const isDenied = c.status === 'DENIED';
                    const isExpanded = expandedCase === c.authorization_id;
                    const prob = Math.round((c.approval_probability || 0) * 100);

                    return (
                        <motion.div key={c.authorization_id} layout
                            className="bg-slate-900/60 backdrop-blur border border-slate-800 rounded-2xl overflow-hidden">
                            {/* Header */}
                            <div className="p-5 flex items-center gap-4 cursor-pointer hover:bg-slate-800/30 transition-colors"
                                onClick={() => setExpandedCase(isExpanded ? null : c.authorization_id)}>
                                <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                    isApproved ? 'bg-emerald-500/20' : isDenied ? 'bg-red-500/20' : 'bg-slate-800'
                                }`}>
                                    {isApproved ? <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                                     : isDenied  ? <XCircle className="h-6 w-6 text-red-400" />
                                     : <FileText className="h-6 w-6 text-slate-400" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <span className="text-white font-bold font-mono text-sm">{c.authorization_id}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                                            isApproved ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                                            isDenied   ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                                            'bg-slate-700 text-slate-300 border-slate-600'
                                        }`}>{c.status}</span>
                                    </div>
                                    <div className="flex gap-4 mt-1 text-sm text-slate-400">
                                        <span>{c.patient_name}</span>
                                        <span>{c.filename}</span>
                                    </div>
                                </div>

                                {/* Probability bar */}
                                <div className="hidden sm:flex flex-col items-end gap-1 min-w-[100px]">
                                    <div className="text-lg font-bold text-white">{prob}%</div>
                                    <div className="w-24 bg-slate-800 rounded-full h-1.5">
                                        <div
                                            className={`h-1.5 rounded-full transition-all ${prob >= 60 ? 'bg-emerald-500' : prob >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                                            style={{ width: `${prob}%` }}
                                        />
                                    </div>
                                    <div className="text-xs text-slate-500">AI Probability</div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button onClick={e => { e.stopPropagation(); navigate(`/result/${c.authorization_id}`); }}
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                                        <Eye className="h-4 w-4" />
                                    </button>
                                    {isExpanded ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                                </div>
                            </div>

                            {/* Expanded */}
                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                                        <div className="border-t border-slate-800 p-5 space-y-4">
                                            {/* Key metrics */}
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                {[
                                                    { label: 'AI Probability', value: `${prob}%`, color: prob >= 60 ? 'text-emerald-300' : 'text-red-300' },
                                                    { label: 'Confidence Score', value: `${c.confidence_score}%`, color: 'text-blue-300' },
                                                    { label: 'Documents', value: c.document_count, color: 'text-slate-300' },
                                                ].map(m => (
                                                    <div key={m.label} className="bg-slate-800/60 rounded-xl p-3">
                                                        <div className={`text-xl font-bold ${m.color}`}>{m.value}</div>
                                                        <div className="text-slate-500 text-xs mt-0.5">{m.label}</div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Remarks */}
                                            <div>
                                                <h4 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
                                                    <MessageSquare className="h-3.5 w-3.5" /> Your Remarks (Optional)
                                                </h4>
                                                <textarea
                                                    rows={3}
                                                    placeholder="Add internal notes, observations, or remarks about this case…"
                                                    value={remarksText[c.authorization_id] || ''}
                                                    onChange={e => setRemarksText(prev => ({ ...prev, [c.authorization_id]: e.target.value }))}
                                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-purple-500/60 resize-none"
                                                />
                                                <button
                                                    onClick={() => handleSaveRemarks(c.authorization_id)}
                                                    disabled={!remarksText[c.authorization_id]?.trim() || savingRemarks === c.authorization_id}
                                                    className="mt-2 px-4 py-2 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-xl text-sm font-medium hover:bg-purple-500/30 transition-colors disabled:opacity-40">
                                                    {savingRemarks === c.authorization_id
                                                        ? 'Saving…'
                                                        : 'Save Remarks'}
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
