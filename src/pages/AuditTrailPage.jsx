import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import useStore from '../store/useStore';
import { motion } from 'framer-motion';
import { Clock, Search, Activity, Filter } from 'lucide-react';

export default function AuditTrailPage() {
    const { user } = useAuth();
    const { auditLogs, auditLoading, fetchAuditLogs } = useStore();
    const [filterAgent, setFilterAgent] = useState('all');
    const [filterAuth, setFilterAuth] = useState('');

    useEffect(() => { fetchAuditLogs(); }, []);

    const agents = ['all', ...new Set(auditLogs.map(l => l.agent_name).filter(Boolean))];

    const filtered = auditLogs.filter(log => {
        if (filterAgent !== 'all' && log.agent_name !== filterAgent) return false;
        if (filterAuth && !log.authorization_id?.toLowerCase().includes(filterAuth.toLowerCase())) return false;
        return true;
    });

    const agentColor = (name) => {
        if (name?.includes('Clinical')) return 'text-cyan-400 bg-cyan-500/10';
        if (name?.includes('Evidence')) return 'text-blue-400 bg-blue-500/10';
        if (name?.includes('Policy')) return 'text-purple-400 bg-purple-500/10';
        if (name?.includes('Risk')) return 'text-amber-400 bg-amber-500/10';
        if (name?.includes('Submission')) return 'text-emerald-400 bg-emerald-500/10';
        if (name?.includes('Appeal')) return 'text-purple-400 bg-purple-500/10';
        return 'text-slate-400 bg-slate-500/10';
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200">
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-white flex items-center gap-3">
                        <Clock className="h-8 w-8 text-cyan-400" /> Audit Trail
                    </h1>
                    <p className="text-slate-400 mt-1">Complete agent activity logs for compliance and debugging</p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3 mb-6">
                    <div className="relative flex-1 max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <input value={filterAuth} onChange={e => setFilterAuth(e.target.value)} placeholder="Filter by Auth ID..."
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500" />
                    </div>
                    <Filter className="h-4 w-4 text-slate-500" />
                    {agents.map(a => (
                        <button key={a} onClick={() => setFilterAgent(a)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${filterAgent === a ? 'bg-slate-800 text-cyan-400 border border-slate-700' : 'text-slate-500 hover:text-slate-300 border border-transparent'}`}>
                            {a === 'all' ? 'All Agents' : a}
                        </button>
                    ))}
                </div>

                {auditLoading ? (
                    <div className="text-center py-20"><div className="h-8 w-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20">
                        <Activity className="h-12 w-12 text-slate-700 mx-auto mb-4" />
                        <p className="text-slate-500">No audit logs found. Process a document to generate logs.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filtered.map((log, i) => (
                            <motion.div key={log.id || i}
                                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
                                className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-xl p-4 flex items-center gap-4 hover:border-slate-700 transition-all">
                                <div className="w-1 h-10 rounded-full bg-gradient-to-b from-cyan-500 to-purple-500 shrink-0" />
                                <div className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 ${agentColor(log.agent_name)}`}>
                                    {log.agent_name}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-200 truncate">{log.output_summary || log.action}</p>
                                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">{log.authorization_id}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <span className={`text-xs font-bold px-2 py-1 rounded ${log.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : log.status === 'failed' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                        {log.status}
                                    </span>
                                    <p className="text-[10px] text-slate-600 mt-1">{log.duration_ms}ms</p>
                                </div>
                                <div className="text-[10px] text-slate-600 font-mono shrink-0 w-32 text-right">
                                    {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ''}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
