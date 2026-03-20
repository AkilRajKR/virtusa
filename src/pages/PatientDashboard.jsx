import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    User, FileText, Upload, Clock, CheckCircle2,
    XCircle, AlertCircle, ChevronDown, ChevronUp,
    RefreshCw, Folder,
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

const DOC_STATUS_COLORS = {
    PENDING:  'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    VERIFIED: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    REJECTED: 'bg-red-500/20 text-red-300 border border-red-500/30',
};

export default function PatientDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedCase, setExpandedCase] = useState(null);
    const [documents, setDocuments] = useState({}); // auth_id → docs
    const [notifications, setNotifications] = useState({});
    const [uploadingFor, setUploadingFor] = useState(null); // auth_id being uploaded to
    const [uploadFile, setUploadFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [message, setMessage] = useState(null);

    const loadCases = useCallback(async () => {
        setLoading(true);
        try {
            const data = await surecareService.getPatientCases();
            setCases(data);
        } catch {
            setMessage({ type: 'error', text: 'Failed to load your cases.' });
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
            if (!documents[authId]) await loadDocuments(authId);
        }
    };

    const handleUploadDoc = async (authId) => {
        if (!uploadFile) return;
        setUploading(true);
        setUploadProgress(0);
        try {
            await surecareService.patientUpload(uploadFile, authId, setUploadProgress);
            setMessage({ type: 'success', text: 'Document uploaded! Awaiting doctor verification.' });
            setUploadFile(null);
            setUploadingFor(null);
            await loadDocuments(authId);
            await loadCases();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.detail || 'Upload failed' });
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const handleAppeal = async (authId) => {
        try {
            await surecareService.initiateAppeal(authId);
            setMessage({ type: 'success', text: 'Appeal initiated! A new case version has been created.' });
            await loadCases();
            setExpandedCase(null);
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to initiate appeal' });
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 p-6">
            {/* Header */}
            <div className="max-w-5xl mx-auto mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                                <User className="h-5 w-5 text-cyan-400" />
                            </div>
                            Patient Portal
                        </h1>
                        <p className="text-slate-400 mt-1">Welcome, <span className="text-cyan-400 font-medium">{user?.name}</span> — track your authorization cases</p>
                    </div>
                    <button onClick={loadCases}
                        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                        <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Message */}
            <AnimatePresence>
                {message && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className={`max-w-5xl mx-auto mb-4 p-4 rounded-xl border flex items-center gap-3 ${
                            message.type === 'success'
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                : 'bg-red-500/10 border-red-500/30 text-red-300'
                        }`}>
                        {message.type === 'success' ? <CheckCircle2 className="h-5 w-5 flex-shrink-0" /> : <XCircle className="h-5 w-5 flex-shrink-0" />}
                        <span>{message.text}</span>
                        <button onClick={() => setMessage(null)} className="ml-auto opacity-60 hover:opacity-100">✕</button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="max-w-5xl mx-auto space-y-4">
                {loading && (
                    <div className="text-center py-20">
                        <div className="h-12 w-12 rounded-full border-2 border-t-cyan-500 border-slate-700 animate-spin mx-auto mb-4" />
                        <p className="text-slate-400">Loading your cases…</p>
                    </div>
                )}

                {!loading && cases.length === 0 && (
                    <div className="text-center py-20 bg-slate-900/40 border border-slate-800 rounded-2xl">
                        <Folder className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-slate-400 mb-2">No cases found</h3>
                        <p className="text-slate-500">Your doctor will open a case and assign it to you.</p>
                    </div>
                )}

                {cases.map(c => {
                    const statusClass = STATUS_COLORS[c.status] || 'bg-slate-700 text-slate-300 border-slate-600';
                    const isExpanded = expandedCase === c.authorization_id;
                    const docs = documents[c.authorization_id] || [];
                    const canUpload = c.status === 'INCOMPLETE';

                    return (
                        <motion.div key={c.authorization_id}
                            layout
                            className="bg-slate-900/60 backdrop-blur border border-slate-800 rounded-2xl overflow-hidden">
                            {/* Case header */}
                            <div className="p-5 flex items-center gap-4 cursor-pointer hover:bg-slate-800/40 transition-colors"
                                onClick={() => toggleCase(c.authorization_id)}>
                                <div className="h-12 w-12 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0">
                                    <FileText className="h-6 w-6 text-cyan-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <span className="text-white font-bold font-mono text-sm">{c.authorization_id}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusClass}`}>
                                            {c.status}
                                        </span>
                                        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                                            Stage: {c.workflow_stage}
                                        </span>
                                        <span className="text-xs px-2 py-0.5 rounded-full border border-slate-700 bg-slate-800/50 text-slate-400">
                                            v{c.version || 1}
                                        </span>
                                        {c.appeal_count > 0 && (
                                            <span className="text-xs px-2 py-0.5 rounded-full border border-purple-500/30 bg-purple-500/20 text-purple-300">
                                                Appeals: {c.appeal_count}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex gap-4 mt-1">
                                        <span className="text-slate-400 text-sm">{c.filename || 'No file'}</span>
                                        <span className="text-slate-500 text-sm">
                                            {c.document_count} doc{c.document_count !== 1 ? 's' : ''}
                                            {c.pending_docs > 0 && <span className="text-amber-400 ml-1">({c.pending_docs} pending review)</span>}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {c.approval_probability > 0 && (
                                        <div className="text-right hidden sm:block">
                                            <div className="text-lg font-bold text-white">{Math.round(c.approval_probability * 100)}%</div>
                                            <div className="text-xs text-slate-500">Probability</div>
                                        </div>
                                    )}
                                    {isExpanded ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                                </div>
                            </div>

                            {/* Expanded content */}
                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}>
                                        <div className="border-t border-slate-800 p-5 space-y-4">
                                            {/* Workflow progress */}
                                            <div>
                                                <h4 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Workflow Progress</h4>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    {['UPLOAD','ANALYSIS','INCOMPLETE','VERIFICATION','FINALIZED'].map((stage, i, arr) => {
                                                        const stages = ['UPLOAD','ANALYSIS','INCOMPLETE','VERIFICATION','FINALIZED'];
                                                        const current = stages.indexOf(c.workflow_stage);
                                                        const thisIdx = i;
                                                        const done = thisIdx < current;
                                                        const active = thisIdx === current;
                                                        return (
                                                            <React.Fragment key={stage}>
                                                                <div className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                                                                    active ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50' :
                                                                    done ? 'bg-emerald-500/20 text-emerald-400' :
                                                                    'bg-slate-800 text-slate-500'
                                                                }`}>{stage}</div>
                                                                {i < arr.length - 1 && <div className={`h-px w-4 ${done ? 'bg-emerald-500' : 'bg-slate-700'}`} />}
                                                            </React.Fragment>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* INCOMPLETE notice & Notifications */}
                                            {c.status === 'INCOMPLETE' && (notifications[c.authorization_id]?.length === 0 || !notifications[c.authorization_id]) && (
                                                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
                                                    <AlertCircle className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
                                                    <div>
                                                        <p className="text-amber-300 font-medium">Additional Documents Required</p>
                                                        <p className="text-amber-400/70 text-sm mt-1">Your case needs supplementary documents. Please upload them below.</p>
                                                    </div>
                                                </div>
                                            )}
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

                                            {/* DENIED logic for Appeal */}
                                            {c.status === 'DENIED' && (
                                                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                                                    <XCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                                                    <div className="flex-1">
                                                        <p className="text-red-300 font-medium">Case Denied</p>
                                                        <p className="text-red-400/70 text-sm mt-1 mb-3">Your authorization was denied. You can initiate an appeal to start a new review cycle (max 3 appeals).</p>
                                                        <button onClick={() => handleAppeal(c.authorization_id)} className="px-4 py-2 bg-red-500/20 text-red-300 border border-red-500/30 rounded-xl hover:bg-red-500/30 text-sm transition-colors font-medium">Initiate Appeal</button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Documents */}
                                            {docs.length > 0 && (
                                                <div>
                                                    <h4 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Documents</h4>
                                                    <div className="space-y-2">
                                                        {docs.map(doc => (
                                                            <div key={doc.id} className="flex items-center gap-3 bg-slate-800/50 rounded-xl p-3">
                                                                <FileText className="h-4 w-4 text-slate-400 flex-shrink-0" />
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-white text-sm font-medium truncate">{doc.filename}</p>
                                                                    <p className="text-slate-500 text-xs">Uploaded by {doc.uploader_role}</p>
                                                                </div>
                                                                <div className={`text-xs px-2 py-1 rounded-lg font-medium ${DOC_STATUS_COLORS[doc.verified_status]}`}>
                                                                    {doc.verified_status}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Upload for INCOMPLETE */}
                                            {canUpload && (
                                                <div className="border-t border-slate-800 pt-4">
                                                    <h4 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Upload Missing Documents</h4>
                                                    {uploadingFor !== c.authorization_id ? (
                                                        <button onClick={() => setUploadingFor(c.authorization_id)}
                                                            className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-xl hover:bg-cyan-500/30 transition-colors text-sm font-medium">
                                                            <Upload className="h-4 w-4" />
                                                            Upload Document
                                                        </button>
                                                    ) : (
                                                        <div className="space-y-3">
                                                            <input type="file" accept=".pdf"
                                                                onChange={e => setUploadFile(e.target.files?.[0] || null)}
                                                                className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-700 file:text-white hover:file:bg-slate-600 cursor-pointer" />
                                                            {uploadFile && (
                                                                <p className="text-slate-400 text-sm">Selected: <span className="text-white">{uploadFile.name}</span></p>
                                                            )}
                                                            {uploading && (
                                                                <div className="w-full bg-slate-800 rounded-full h-2">
                                                                    <div className="bg-cyan-500 h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                                                                </div>
                                                            )}
                                                            <div className="flex gap-2">
                                                                <button onClick={() => handleUploadDoc(c.authorization_id)}
                                                                    disabled={!uploadFile || uploading}
                                                                    className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-xl hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm font-medium">
                                                                    {uploading ? <><RefreshCw className="h-4 w-4 animate-spin" /> Uploading…</> : <><Upload className="h-4 w-4" /> Submit</>}
                                                                </button>
                                                                <button onClick={() => { setUploadingFor(null); setUploadFile(null); }}
                                                                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors text-sm">
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
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
