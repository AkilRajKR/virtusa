import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useStore from '../store/useStore';
import { motion } from 'framer-motion';
import {
    BarChart3, Upload, FileCheck, AlertTriangle, Scale,
    TrendingUp, Clock, Activity, CheckCircle2, XCircle, Brain
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function DashboardPage() {
    const { user } = useAuth();
    const { dashboardMetrics, dashboardLoading, fetchDashboard } = useStore();

    useEffect(() => { fetchDashboard(); }, []);

    const m = dashboardMetrics || {};
    const cards = [
        { label: 'Total Authorizations', value: m.total_authorizations || 0, icon: FileCheck, color: 'cyan', bg: 'from-cyan-500/20 to-cyan-600/5' },
        { label: 'Approved', value: m.approved || 0, icon: CheckCircle2, color: 'emerald', bg: 'from-emerald-500/20 to-emerald-600/5' },
        { label: 'Denied', value: m.denied || 0, icon: XCircle, color: 'rose', bg: 'from-rose-500/20 to-rose-600/5' },
        { label: 'Appealed', value: m.appealed || 0, icon: Scale, color: 'purple', bg: 'from-purple-500/20 to-purple-600/5' },
    ];

    const trendData = (m.trend_data || []).filter(d => d.value > 0);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200">
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-white">Dashboard</h1>
                        <p className="text-slate-400 mt-1">
                            Welcome back, <span className="text-cyan-400">{user?.name}</span>
                            <span className="ml-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-slate-800 text-slate-400 rounded-full border border-slate-700">
                                {user?.role}
                            </span>
                        </p>
                    </div>
                    {(user?.role === 'doctor' || user?.role === 'admin') && (
                        <Link to="/upload"
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold rounded-xl hover:from-cyan-400 hover:to-purple-500 transition-all shadow-lg shadow-cyan-500/20">
                            <Upload className="h-4 w-4" /> New Analysis
                        </Link>
                    )}
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {cards.map((card, i) => (
                        <motion.div
                            key={card.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: i * 0.1 }}
                            className={`bg-gradient-to-br ${card.bg} backdrop-blur-xl border border-slate-800 rounded-2xl p-6 relative overflow-hidden group`}
                        >
                            <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <card.icon className="h-12 w-12" />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{card.label}</p>
                            <p className={`text-4xl font-black text-${card.color}-400`}>{card.value}</p>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Approval Rate + Chart */}
                    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <BarChart3 className="h-5 w-5 text-cyan-400" />
                            <h3 className="text-lg font-bold text-white">Approval Rate</h3>
                        </div>
                        <div className="flex items-center justify-center mb-4">
                            <div className="relative">
                                <svg className="w-32 h-32 -rotate-90">
                                    <circle cx="64" cy="64" r="56" fill="none" stroke="#1e293b" strokeWidth="8" />
                                    <circle cx="64" cy="64" r="56" fill="none" stroke="url(#grad)" strokeWidth="8"
                                        strokeDasharray={`${(m.approval_rate || 0) / 100 * 352} 352`}
                                        strokeLinecap="round" />
                                    <defs>
                                        <linearGradient id="grad"><stop offset="0%" stopColor="#06b6d4" /><stop offset="100%" stopColor="#8b5cf6" /></linearGradient>
                                    </defs>
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-3xl font-black text-white">{m.approval_rate || 0}%</span>
                                </div>
                            </div>
                        </div>
                        {trendData.length > 0 && (
                            <ResponsiveContainer width="100%" height={120}>
                                <PieChart>
                                    <Pie data={trendData} dataKey="value" cx="50%" cy="50%" innerRadius={30} outerRadius={50}>
                                        {trendData.map((entry, idx) => (
                                            <Cell key={idx} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                                        itemStyle={{ color: '#e2e8f0' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                        <div className="flex flex-wrap gap-2 mt-2 justify-center">
                            {trendData.map(d => (
                                <span key={d.name} className="flex items-center gap-1.5 text-xs text-slate-400">
                                    <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                                    {d.name}: {d.value}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Performance Metrics */}
                    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <Brain className="h-5 w-5 text-purple-400" />
                            <h3 className="text-lg font-bold text-white">AI Performance</h3>
                        </div>
                        <div className="space-y-5">
                            <div>
                                <div className="flex justify-between mb-1.5">
                                    <span className="text-xs font-bold text-slate-500 uppercase">Avg. Confidence</span>
                                    <span className="text-sm font-bold text-cyan-400">{m.avg_confidence || 0}%</span>
                                </div>
                                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${m.avg_confidence || 0}%` }}
                                        transition={{ duration: 1 }}
                                        className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full" />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between mb-1.5">
                                    <span className="text-xs font-bold text-slate-500 uppercase">Prediction Accuracy</span>
                                    <span className="text-sm font-bold text-emerald-400">{m.prediction_accuracy || 0}%</span>
                                </div>
                                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${m.prediction_accuracy || 0}%` }}
                                        transition={{ duration: 1, delay: 0.2 }}
                                        className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full" />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between mb-1.5">
                                    <span className="text-xs font-bold text-slate-500 uppercase">Total Learning Records</span>
                                    <span className="text-sm font-bold text-slate-300">{m.total_learning_records || 0}</span>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-slate-800">
                                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                                    <TrendingUp className="h-3 w-3" />
                                    Model improves with each decision recorded
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <Clock className="h-5 w-5 text-emerald-400" />
                            <h3 className="text-lg font-bold text-white">Recent Activity</h3>
                        </div>
                        <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1 custom-scrollbar">
                            {(m.recent_activity || []).length === 0 ? (
                                <p className="text-sm text-slate-500 text-center py-8">No activity yet. Upload a document to get started.</p>
                            ) : (
                                (m.recent_activity || []).map((item, i) => (
                                    <Link key={i} to={`/result/${item.authorization_id}`}
                                        className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 border border-slate-800 hover:border-slate-700 transition-all group">
                                        <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                                            item.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' :
                                            item.status === 'DENIED' ? 'bg-rose-500/20 text-rose-400' :
                                            item.status === 'APPEALED' ? 'bg-purple-500/20 text-purple-400' :
                                            'bg-amber-500/20 text-amber-400'
                                        }`}>
                                            {item.status === 'APPROVED' ? <CheckCircle2 className="h-4 w-4" /> :
                                             item.status === 'DENIED' ? <XCircle className="h-4 w-4" /> :
                                             <AlertTriangle className="h-4 w-4" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-slate-200 truncate group-hover:text-white">{item.patient_name}</p>
                                            <p className="text-[10px] text-slate-500 font-mono">{item.authorization_id}</p>
                                        </div>
                                        <span className={`text-xs font-black px-2 py-1 rounded-lg ${
                                            item.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' :
                                            item.status === 'DENIED' ? 'bg-rose-500/10 text-rose-400' :
                                            'bg-amber-500/10 text-amber-400'
                                        }`}>{item.confidence_score}%</span>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
