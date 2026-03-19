import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useStore from '../store/useStore';
import { motion } from 'framer-motion';
import { Clock, CheckCircle2, XCircle, AlertTriangle, Scale, FileText, Search } from 'lucide-react';

export default function HistoryPage() {
    const { user } = useAuth();
    const { history, historyLoading, historyError, fetchHistory } = useStore();
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');

    useEffect(() => { fetchHistory(true); }, []);

    const filtered = history.filter(item => {
        if (filter !== 'all' && item.status !== filter) return false;
        if (search) {
            const q = search.toLowerCase();
            return (item.patient_name||'').toLowerCase().includes(q) ||
                   (item.authorization_id||'').toLowerCase().includes(q) ||
                   (item.filename||'').toLowerCase().includes(q);
        }
        return true;
    });

    const statusIcon = (s) => {
        if (s === 'APPROVED') return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
        if (s === 'DENIED') return <XCircle className="h-4 w-4 text-rose-400" />;
        if (s === 'APPEALED') return <Scale className="h-4 w-4 text-purple-400" />;
        return <AlertTriangle className="h-4 w-4 text-amber-400" />;
    };

    const statusColor = (s) => {
        if (s === 'APPROVED') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
        if (s === 'DENIED') return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
        if (s === 'APPEALED') return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200">
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-white">Authorization History</h1>
                        <p className="text-slate-400 mt-1">{filtered.length} records found</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3 mb-6">
                    <div className="relative flex-1 max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patient, ID, or file..."
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500" />
                    </div>
                    {['all','APPROVED','DENIED','INCOMPLETE','APPEALED'].map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${filter === f ? 'bg-slate-800 text-cyan-400 border border-slate-700' : 'text-slate-500 hover:text-slate-300 border border-transparent'}`}>
                            {f === 'all' ? 'All' : f}
                        </button>
                    ))}
                </div>

                {historyLoading ? (
                    <div className="text-center py-20"><div className="h-8 w-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
                ) : historyError ? (
                    <div className="text-center py-20 text-rose-400">{historyError}</div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20">
                        <FileText className="h-12 w-12 text-slate-700 mx-auto mb-4" />
                        <p className="text-slate-500">No authorization records found.</p>
                    </div>
                ) : (
                    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden">
                        <table className="w-full text-sm">
                            <thead><tr className="border-b border-slate-800">
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Patient</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Auth ID</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Confidence</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Date</th>
                            </tr></thead>
                            <tbody>
                                {filtered.map((item, i) => (
                                    <motion.tr key={item.authorization_id}
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                                        className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-all cursor-pointer"
                                        onClick={() => window.location.href = `/result/${item.authorization_id}`}>
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-white">{item.patient_name}</p>
                                            <p className="text-xs text-slate-500">{item.filename}</p>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs text-cyan-400">{item.authorization_id}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusColor(item.status)}`}>
                                                {statusIcon(item.status)} {item.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full ${item.confidence_score > 70 ? 'bg-emerald-500' : item.confidence_score > 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                                        style={{ width: `${item.confidence_score}%` }} />
                                                </div>
                                                <span className="text-xs font-bold text-slate-300">{item.confidence_score}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-slate-500">{item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}</td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
