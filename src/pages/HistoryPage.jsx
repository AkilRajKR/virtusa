import React, { useEffect, useState } from 'react';
<<<<<<< HEAD
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, XCircle, ChevronRight, Search, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HistoryPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (user) {
            fetchRecords();
        }
    }, [user]);

    const fetchRecords = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('analysis_history')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching records:', error);
        } else {
            setRecords(data);
        }
        setLoading(false);
    };

    const filteredRecords = records.filter(record => 
        record.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.patient_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const viewRecord = (record) => {
        navigate('/result', { state: { result: record.result_data, filename: record.filename } });
    };

    return (
        <div className="min-h-screen bg-slate-950 p-8 sm:p-12">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-tighter mb-2">ANALYSIS <span className="text-cyan-400">HISTORY</span></h1>
                        <p className="text-slate-400 font-medium">Review and audit past clinical authorization records.</p>
                    </div>

                    <div className="relative group max-w-md w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Search records by filename or patient..." 
                            className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-cyan-500/50 transition-all placeholder:text-slate-600"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center p-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
                    </div>
                ) : filteredRecords.length === 0 ? (
                    <div className="text-center p-20 border-2 border-dashed border-slate-800 rounded-3xl">
                        <Clock className="h-12 w-12 text-slate-700 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-slate-400 font-medium">No records found</h3>
                        <p className="text-slate-600 mt-2">Start a new analysis to populate your history.</p>
                        <Button variant="outline" className="mt-6" onClick={() => navigate('/upload')}>
                            New Analysis
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {filteredRecords.map((record, idx) => (
                            <motion.div
                                key={record.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                            >
                                <GlassCard 
                                    className="p-6 transition-all hover:border-cyan-500/30 group cursor-pointer"
                                    onClick={() => viewRecord(record)}
                                >
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                                        <div className="flex items-center gap-5 w-full">
                                            <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 ${
                                                record.approval_status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                                            }`}>
                                                {record.approval_status === 'APPROVED' ? <CheckCircle className="h-7 w-7" /> : <XCircle className="h-7 w-7" />}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-3">
                                                    <h3 className="text-lg font-bold text-white truncate">{record.filename}</h3>
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                        record.approval_status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                                                    }`}>
                                                        {record.approval_status}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                                                    <p className="text-slate-400 text-sm flex items-center gap-1.5">
                                                        <FileText className="h-3.5 w-3.5" /> {record.patient_name || 'Generic Patient'}
                                                    </p>
                                                    <p className="text-slate-500 text-xs flex items-center gap-1.5">
                                                        <Clock className="h-3.5 w-3.5" /> {new Date(record.created_at).toLocaleDateString()} at {new Date(record.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-8 w-full sm:w-auto justify-between sm:justify-end">
                                            <div className="text-right">
                                                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold font-mono">Confidence</p>
                                                <p className="text-xl font-black text-white">{record.confidence_score}%</p>
                                            </div>
                                            <Button variant="ghost" className="p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ChevronRight className="h-6 w-6 text-slate-400" />
                                            </Button>
                                        </div>
                                    </div>
                                </GlassCard>
                            </motion.div>
                        ))}
=======
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
>>>>>>> dashboard
                    </div>
                )}
            </div>
        </div>
    );
}
