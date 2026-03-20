import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Stethoscope, FileText, CheckCircle2, XCircle, Clock,
    ChevronDown, ChevronUp, RefreshCw, Eye, ShieldCheck,
    ShieldX, AlertCircle, Folder, RotateCcw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import surecareService from '../services/surecare.service';

const STATUS_COLORS = {
    APPROVED:   'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    FINALIZED:  'bg-emerald-400/20 text-emerald-200 border-emerald-400/30',
    DENIED:     'bg-red-500/20 text-red-300 border-red-500/30',
    FINAL_DENIED: 'bg-red-900/40 text-red-200 border-red-500/50',
    INCOMPLETE: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    APPEALED:   'bg-purple-500/20 text-purple-300 border-purple-500/30',
    PROCESSING: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
};

const DOC_BORDER = {
    PENDING:  'border-amber-500/30 bg-amber-500/5',
    VERIFIED: 'border-emerald-500/30 bg-emerald-500/5',
    REJECTED: 'border-red-500/30 bg-red-500/5',
};

export default function DoctorCasesPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedCase, setExpandedCase] = useState(null);
    const [documents, setDocuments] = useState({});
    const [notifications, setNotifications] = useState({});
    const [rejectionReason, setRejectionReason] = useState('');
    const [rejectingDoc, setRejectingDoc] = useState(null);
    const [verifying, setVerifying] = useState(null); // doc id being actioned
    const [reprocessing, setReprocessing] = useState(null);
    const [message, setMessage] = useState(null);

    const showMsg = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 6000);
    };

    const loadCases = useCallback(async () => {
        setLoading(true);
        try {
            const data = await surecareService.getDoctorCases();
            setCases(data);
        } catch {
            showMsg('error', 'Failed to load assigned cases.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadCases(); }, [loadCases]);

    const loadDocuments = async (authId) => {
        try {
            const data = await surecareService.getDocuments(authId);
            setDocuments(prev => ({ ...prev, [authId]: data.documents }));
            const notifs = await surecareService.getNotifications(authId);
            setNotifications(prev => ({ ...prev, [authId]: notifs }));
        } catch { /* ignore */ }
    };

    const toggleCase = async (authId) => {
        if (expandedCase === authId) {
            setExpandedCase(null);
        } else {
            setExpandedCase(authId);
            await loadDocuments(authId);
        }
    };

    const handleVerify = async (doc, authId) => {
        setVerifying(doc.id);
        try {
            const res = await surecareService.verifyDocument(doc.id, 'VERIFIED');
            if (res.auto_reprocess_triggered) {
                showMsg('success', `✅ All documents verified! Auto-reprocess triggered — case is now FINALIZED.`);
                await loadCases();
            } else {
                showMsg('success', `Document "${doc.filename}" verified.`);
            }
            await loadDocuments(authId);
        } catch (err) {
            showMsg('error', err.response?.data?.detail || 'Verification failed');
        } finally {
            setVerifying(null);
        }
    };

    const handleReject = async (doc, authId) => {
        if (!rejectionReason.trim()) return;
        setVerifying(doc.id);
        try {
            await surecareService.verifyDocument(doc.id, 'REJECTED', rejectionReason);
            showMsg('success', `Document "${doc.filename}" rejected.`);
            setRejectingDoc(null);
            setRejectionReason('');
            await loadDocuments(authId);
        } catch (err) {
            showMsg('error', err.response?.data?.detail || 'Rejection failed');
        } finally {
            setVerifying(null);
        }
    };

    const handleReprocess = async (authId) => {
        setReprocessing(authId);
        try {
            const result = await surecareService.reprocess(authId);
            showMsg('success', `Pipeline complete → ${result.status}. Confidence: ${result.confidence_score}%`);
            await loadCases();
            navigate('/result', { state: { result } });
        } catch (err) {
            showMsg('error', err.response?.data?.detail || 'Reprocess failed');
        } finally {
            setReprocessing(null);
        }
    };

    const allVerified = (authId) => {
        const docs = documents[authId] || [];
        return docs.length > 0 && docs.every(d => d.verified_status === 'VERIFIED');
    };

    return (
        <div className="min-h-screen bg-slate-950 p-6">
            <div className="max-w-6xl mx-auto mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                <Stethoscope className="h-5 w-5 text-blue-400" />
                            </div>
                            Assigned Cases
                        </h1>
                        <p className="text-slate-400 mt-1">Review documents and verify patient uploads for <span className="text-blue-400 font-medium">{user?.name}</span></p>
                    </div>
                    <button onClick={loadCases}
                        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                        <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Toast message */}
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
                        <button onClick={() => setMessage(null)} className="opacity-60 hover:opacity-100 ml-auto">✕</button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="max-w-6xl mx-auto space-y-4">
                {loading && (
                    <div className="text-center py-20">
                        <div className="h-12 w-12 rounded-full border-2 border-t-blue-500 border-slate-700 animate-spin mx-auto mb-4" />
                        <p className="text-slate-400">Loading cases…</p>
                    </div>
                )}

                {!loading && cases.length === 0 && (
                    <div className="text-center py-20 bg-slate-900/40 border border-slate-800 rounded-2xl">
                        <Folder className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-slate-400 mb-2">No assigned cases</h3>
                        <p className="text-slate-500">Upload and analyze a document to create a case.</p>
                    </div>
                )}

                {cases.map(c => {
                    const statusClass = STATUS_COLORS[c.status] || 'bg-slate-700 text-slate-300 border-slate-600';
                    const isExpanded = expandedCase === c.authorization_id;
                    const docs = documents[c.authorization_id] || [];
                    const pendingDocs = docs.filter(d => d.verified_status === 'PENDING');
                    const canManualReprocess = allVerified(c.authorization_id) && c.status !== 'FINALIZED';

                    return (
                        <motion.div key={c.authorization_id} layout
                            className="bg-slate-900/60 backdrop-blur border border-slate-800 rounded-2xl overflow-hidden">
                            {/* Case header */}
                            <div className="p-5 flex items-center gap-4 cursor-pointer hover:bg-slate-800/30 transition-colors"
                                onClick={() => toggleCase(c.authorization_id)}>
                                <div className="h-12 w-12 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0">
                                    <FileText className="h-6 w-6 text-blue-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <span className="text-white font-bold font-mono text-sm">{c.authorization_id}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusClass}`}>{c.status}</span>
                                        <span className="text-xs px-2 py-0.5 rounded-full border border-slate-700 bg-slate-800/50 text-slate-400">
                                            v{c.version || 1}
                                        </span>
                                        {c.appeal_count > 0 && (
                                            <span className="text-xs px-2 py-0.5 rounded-full border border-purple-500/30 bg-purple-500/20 text-purple-300">
                                                Appeals: {c.appeal_count}
                                            </span>
                                        )}
                                        {pendingDocs.length > 0 && (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
                                                {pendingDocs.length} to review
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex gap-4 mt-1 text-sm text-slate-400">
                                        <span>{c.patient_name}</span>
                                        <span>{c.document_count} doc{c.document_count !== 1 ? 's' : ''}</span>
                                        <span className="text-slate-500">Stage: {c.workflow_stage}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {c.approval_probability > 0 && (
                                        <div className="text-right hidden sm:block">
                                            <div className="text-lg font-bold text-white">{Math.round(c.approval_probability * 100)}%</div>
                                            <div className="text-xs text-slate-500">AI Probability</div>
                                        </div>
                                    )}
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
                                            
                                            {/* System Notifications / Needs Doctor Input */}
                                            {(notifications[c.authorization_id] || []).map(n => (
                                                <div key={n.id} className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
                                                    <AlertCircle className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
                                                    <div className="flex-1">
                                                        <p className="text-amber-300 font-medium font-mono text-sm">{n.subject}</p>
                                                        <p className="text-slate-300 text-sm mt-1 whitespace-pre-wrap">{n.message}</p>
                                                        <p className="text-slate-500 text-xs mt-2 uppercase">{new Date(n.sent_at).toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            ))}

                                            {docs.length === 0 && (
                                                <p className="text-slate-500 text-sm text-center py-4">No documents uploaded yet.</p>
                                            )}

                                            {docs.length > 0 && (
                                                <div>
                                                    <h4 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Documents</h4>
                                                    <div className="space-y-3">
                                                        {docs.map(doc => (
                                                            <div key={doc.id}
                                                                className={`border rounded-xl p-4 ${DOC_BORDER[doc.verified_status] || 'border-slate-700 bg-slate-800/50'}`}>
                                                                <div className="flex items-center gap-3">
                                                                    <FileText className="h-4 w-4 text-slate-400 flex-shrink-0" />
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-white text-sm font-medium truncate">{doc.filename}</p>
                                                                        <p className="text-slate-500 text-xs">
                                                                            Uploaded by <span className="capitalize">{doc.uploader_role}</span>
                                                                            {doc.rejection_reason && (
                                                                                <span className="text-red-400 ml-2">— Reason: {doc.rejection_reason}</span>
                                                                            )}
                                                                        </p>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        {/* Status badge */}
                                                                        <span className={`text-xs px-2 py-1 rounded-lg font-medium ${
                                                                            doc.verified_status === 'VERIFIED' ? 'bg-emerald-500/20 text-emerald-300' :
                                                                            doc.verified_status === 'REJECTED' ? 'bg-red-500/20 text-red-300' :
                                                                            'bg-amber-500/20 text-amber-300'
                                                                        }`}>{doc.verified_status}</span>

                                                                        {/* Action buttons — only for PENDING */}
                                                                        {doc.verified_status === 'PENDING' && (
                                                                            <>
                                                                                <button
                                                                                    disabled={verifying === doc.id}
                                                                                    onClick={() => handleVerify(doc, c.authorization_id)}
                                                                                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/30 transition-colors text-xs font-medium disabled:opacity-40">
                                                                                    {verifying === doc.id ? <RefreshCw className="h-3 w-3 animate-spin" /> : <ShieldCheck className="h-3 w-3" />}
                                                                                    Verify
                                                                                </button>
                                                                                <button
                                                                                    disabled={verifying === doc.id}
                                                                                    onClick={() => setRejectingDoc(doc.id)}
                                                                                    className="flex items-center gap-1 px-3 py-1.5 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors text-xs font-medium disabled:opacity-40">
                                                                                    <ShieldX className="h-3 w-3" />
                                                                                    Reject
                                                                                </button>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Rejection reason input */}
                                                                <AnimatePresence>
                                                                    {rejectingDoc === doc.id && (
                                                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                                                            exit={{ height: 0, opacity: 0 }} className="mt-3 space-y-2">
                                                                            <input
                                                                                type="text"
                                                                                placeholder="Reason for rejection (required)"
                                                                                value={rejectionReason}
                                                                                onChange={e => setRejectionReason(e.target.value)}
                                                                                className="w-full px-3 py-2 bg-slate-900 border border-red-500/30 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-red-400"
                                                                            />
                                                                            <div className="flex gap-2">
                                                                                <button disabled={!rejectionReason.trim() || verifying === doc.id}
                                                                                    onClick={() => handleReject(doc, c.authorization_id)}
                                                                                    className="px-3 py-1.5 bg-red-500/30 text-red-300 rounded-lg text-xs font-medium hover:bg-red-500/40 disabled:opacity-40">
                                                                                    Confirm Reject
                                                                                </button>
                                                                                <button onClick={() => { setRejectingDoc(null); setRejectionReason(''); }}
                                                                                    className="px-3 py-1.5 bg-slate-800 text-slate-400 rounded-lg text-xs hover:bg-slate-700">
                                                                                    Cancel
                                                                                </button>
                                                                            </div>
                                                                        </motion.div>
                                                                    )}
                                                                </AnimatePresence>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Manual reprocess */}
                                            {canManualReprocess && (
                                                <div className="border-t border-slate-800 pt-4">
                                                    <button
                                                        disabled={!!reprocessing}
                                                        onClick={() => handleReprocess(c.authorization_id)}
                                                        className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-xl hover:bg-purple-500/30 transition-colors text-sm font-medium disabled:opacity-40">
                                                        {reprocessing === c.authorization_id
                                                            ? <><RefreshCw className="h-4 w-4 animate-spin" /> Running Pipeline…</>
                                                            : <><RotateCcw className="h-4 w-4" /> Manually Reprocess</>}
                                                    </button>
                                                    <p className="text-slate-500 text-xs mt-1">All documents verified — you can manually run the pipeline.</p>
                                                </div>
                                            )}
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
