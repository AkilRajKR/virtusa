import React from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from './ui/GlassCard';
import { Cpu, Database, Shield, Zap, Globe, Github } from 'lucide-react';
import { Button } from './ui/Button';

export default function TechStackModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const techs = [
    { name: 'Gemini 2.5 Flash', category: 'Intelligence Engine', desc: 'SOTA LLM for high-speed clinical reasoning and 1M+ token context.', icon: Zap, color: 'text-yellow-400' },
    { name: 'Supabase / PostgREST', category: 'Data & Auth', desc: 'Secure PostgreSQL persistence with RLS policies and Google OAuth.', icon: Database, color: 'text-emerald-400' },
    { name: 'Agentic Orchestration', category: 'Architecture', desc: '3-node pipeline (Reader -> Evidence -> Policy) for zero-trust clinical auditing.', icon: Cpu, color: 'text-cyan-400' },
    { name: 'Framer Motion', category: 'Interactions', desc: 'Physics-based animations for real-time state visualization.', icon: Globe, color: 'text-purple-400' }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-3xl relative"
      >
        <GlassCard className="p-10 border-cyan-500/30 overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
              <Cpu className="h-40 w-40" />
          </div>
          
          <div className="mb-10">
            <h2 className="text-3xl font-black text-white italic tracking-tighter mb-2">AUTOAUTH <span className="text-cyan-400">STACK OVERVIEW</span></h2>
            <p className="text-slate-400">Enterprise AI Prior Authorization Architecture for Clinical Compliance.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {techs.map((t, i) => (
              <div key={i} className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl flex gap-4">
                <div className={`h-12 w-12 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700 ${t.color}`}>
                  <t.icon className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm mb-1">{t.name}</h4>
                  <p className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-1.5">{t.category}</p>
                  <p className="text-xs text-slate-400 leading-relaxed">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-800 pt-8 flex items-center justify-between">
            <div className="flex gap-4">
               <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Database URL</span>
                  <span className="text-xs font-mono text-cyan-400/70">hxtqfitnwqxjhqozqfil.supabase.co</span>
               </div>
            </div>
            <Button variant="neon" onClick={onClose} className="px-10">
              Close Overview
            </Button>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
