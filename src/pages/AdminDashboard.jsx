import React, { useEffect, useState } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { Topbar } from '../components/layout/Topbar';
import { GlassCard } from '../components/ui/GlassCard';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { TrendingUp, Clock, DollarSign, CheckCircle, Activity, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import surecareService from '../services/surecare.service';

// ── Static mock data (no backend) ─────────────────────────────────────────
const STATS = {
    total_requests: 1337,
    approval_rate: 95,
    avg_processing_time: 1.2,
    cost_savings: 45000,
    active_users: 24,
    successful_auths: 1247,
    time_saved_hours: 342,
    processing_by_payer: [
        { payer: 'BlueCross', avgTime: 1.1 },
        { payer: 'Aetna', avgTime: 1.4 },
        { payer: 'United', avgTime: 1.3 },
        { payer: 'Cigna', avgTime: 0.9 },
        { payer: 'Humana', avgTime: 1.6 },
    ],
};

const TRENDS = [
    { date: 'Mon', requests: 40, approved: 38 },
    { date: 'Tue', requests: 55, approved: 52 },
    { date: 'Wed', requests: 47, approved: 44 },
    { date: 'Thu', requests: 62, approved: 59 },
    { date: 'Fri', requests: 71, approved: 67 },
    { date: 'Sat', requests: 34, approved: 32 },
    { date: 'Sun', requests: 28, approved: 27 },
];

const DISTRIBUTION = [
    { name: 'Approved', value: 84 },
    { name: 'Denied', value: 9 },
    { name: 'Pending', value: 5 },
    { name: 'Appeals', value: 2 },
];

const COLORS = ['#06b6d4', '#8b5cf6', '#f59e0b', '#ec4899'];

// Custom Tooltip
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 p-4 rounded-lg shadow-xl">
                <p className="text-slate-400 mb-2">{label}</p>
                {payload.map((entry, i) => (
                    <p key={i} style={{ color: entry.color }} className="font-semibold">
                        {entry.name}: {entry.value}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

export default function AdminDashboard() {
    const [users, setUsers] = useState([]);
    
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const data = await surecareService.getAdminUsers();
                setUsers(data);
            } catch (e) {
                console.error("Failed to fetch users", e);
            }
        };
        fetchUsers();
    }, []);

    const statCards = [
        { label: 'Total Requests', value: STATS.total_requests.toLocaleString(), change: '+12%', icon: Activity, color: 'cyan' },
        { label: 'Approval Rate', value: `${STATS.approval_rate}%`, change: '+3%', icon: CheckCircle, color: 'emerald' },
        { label: 'Avg Processing', value: `${STATS.avg_processing_time} min`, change: '-8%', icon: Clock, color: 'purple' },
        { label: 'Cost Savings', value: `$${STATS.cost_savings.toLocaleString()}`, change: '+18%', icon: DollarSign, color: 'amber' },
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-white flex relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    className="absolute w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"
                    animate={{ x: [0, 100, 0], y: [0, -100, 0] }}
                    transition={{ duration: 20, repeat: Infinity }}
                    style={{ top: '10%', right: '10%' }}
                />
            </div>

            <Sidebar />
            <div className="flex-1 ml-64">
                <Topbar />

                <main className="p-8 relative z-10 max-w-7xl mx-auto">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                        {/* Header */}
                        <div>
                            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 mb-2">
                                Analytics Dashboard
                            </h1>
                            <p className="text-slate-400 text-lg">Real-time system performance and insights</p>
                        </div>

                        {/* Stat Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {statCards.map((stat, i) => (
                                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                                    <GlassCard className="relative overflow-hidden group hover:scale-105 transition-transform">
                                        <div className={`absolute inset-0 bg-gradient-to-br from-${stat.color}-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
                                        <div className="relative z-10 p-2">
                                            <div className="flex items-center justify-between mb-4">
                                                <stat.icon className={`h-10 w-10 text-${stat.color}-400`} />
                                                <span className="text-sm text-emerald-400 font-semibold">{stat.change}</span>
                                            </div>
                                            <p className="text-sm text-slate-500 mb-1">{stat.label}</p>
                                            <p className={`text-3xl font-bold text-${stat.color}-400`}>{stat.value}</p>
                                        </div>
                                    </GlassCard>
                                </motion.div>
                            ))}
                        </div>

                        {/* Charts Row */}
                        <div className="grid lg:grid-cols-2 gap-6">
                            {/* Line Chart */}
                            <GlassCard>
                                <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-cyan-400" />
                                    Authorization Requests (Last 7 Days)
                                </h3>
                                <ResponsiveContainer width="100%" height={280}>
                                    <LineChart data={TRENDS}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                        <XAxis dataKey="date" stroke="#94a3b8" />
                                        <YAxis stroke="#94a3b8" />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend />
                                        <Line type="monotone" dataKey="requests" stroke="#06b6d4" strokeWidth={3} dot={{ fill: '#06b6d4', r: 5 }} />
                                        <Line type="monotone" dataKey="approved" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 5 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </GlassCard>

                            {/* Pie Chart */}
                            <GlassCard>
                                <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-purple-400" />
                                    Approval Distribution
                                </h3>
                                <ResponsiveContainer width="100%" height={280}>
                                    <PieChart>
                                        <Pie
                                            data={DISTRIBUTION}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={100}
                                            dataKey="value"
                                        >
                                            {DISTRIBUTION.map((_, index) => (
                                                <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </GlassCard>
                        </div>

                        {/* Bar Chart – Processing by payer */}
                        <GlassCard>
                            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                <Clock className="h-5 w-5 text-amber-400" />
                                Average Processing Time by Payer (minutes)
                            </h3>
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={STATS.processing_by_payer}>
                                    <defs>
                                        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#06b6d4" />
                                            <stop offset="100%" stopColor="#8b5cf6" />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis dataKey="payer" stroke="#94a3b8" />
                                    <YAxis stroke="#94a3b8" />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="avgTime" fill="url(#barGrad)" radius={[8, 8, 0, 0]} name="Avg Time (min)" />
                                </BarChart>
                            </ResponsiveContainer>
                        </GlassCard>

                        {/* Bottom KPI cards */}
                        <div className="grid md:grid-cols-3 gap-6">
                            {[
                                { label: 'Active Users', value: STATS.active_users, suffix: '', icon: Users, color: 'cyan' },
                                { label: 'Successful Auths', value: STATS.successful_auths, suffix: '', icon: CheckCircle, color: 'emerald' },
                                { label: 'Time Saved', value: STATS.time_saved_hours, suffix: 'h', icon: Clock, color: 'purple' },
                            ].map(({ label, value, suffix, icon: Icon, color }) => (
                                <GlassCard key={label} className="p-6 text-center">
                                    <Icon className={`h-12 w-12 text-${color}-400 mx-auto mb-3`} />
                                    <p className={`text-3xl font-bold text-${color}-400 mb-1`}>{value.toLocaleString()}{suffix}</p>
                                    <p className="text-sm text-slate-500">{label}</p>
                                </GlassCard>
                            ))}
                        </div>

                        {/* Recent Users List */}
                        <GlassCard>
                            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                <Users className="h-5 w-5 text-indigo-400" />
                                System Users Directory
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-slate-800 text-slate-500 text-sm uppercase tracking-wider">
                                            <th className="pb-3 px-4 font-semibold">Name</th>
                                            <th className="pb-3 px-4 font-semibold">Email</th>
                                            <th className="pb-3 px-4 font-semibold">Role</th>
                                            <th className="pb-3 px-4 font-semibold">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {users.length === 0 ? (
                                            <tr><td colSpan="4" className="py-8 text-center text-slate-500">Loading users...</td></tr>
                                        ) : (
                                            users.map(u => (
                                                <tr key={u.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                                                    <td className="py-4 px-4 font-medium text-slate-200">{u.name}</td>
                                                    <td className="py-4 px-4 text-slate-400">{u.email}</td>
                                                    <td className="py-4 px-4">
                                                        <span className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold uppercase tracking-wider text-slate-300">
                                                            {u.role}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        {u.is_active 
                                                            ? <span className="text-emerald-400 flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-emerald-500"></div> Active</span>
                                                            : <span className="text-slate-500 flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-slate-600"></div> Inactive</span>}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </GlassCard>
                    </motion.div>
                </main>
            </div>
        </div>
    );
}
