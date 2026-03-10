import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Check, FileText, Shield, Send, AlertCircle, Loader2,
    Brain, Database, FileOutput, Scan, Search, Zap, CheckCircle2,
    FileCheck
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';

export function AgentWorkflow({ onComplete }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [completedSteps, setCompletedSteps] = useState([]);

    const steps = [
        {
            id: 'intake',
            title: 'Intake Agent',
            desc: 'Receiving patient data from EHR...',
            icon: FileText,
            color: 'text-blue-400',
            gradient: 'from-blue-500 to-blue-600',
            duration: 2000
        },
        {
            id: 'reader',
            title: 'Clinical Reader Agent',
            desc: 'Extracting diagnosis & evidence...',
            icon: Brain,
            color: 'text-purple-400',
            gradient: 'from-purple-500 to-purple-600',
            duration: 3000
        },
        {
            id: 'evidence',
            title: 'Evidence Builder Agent',
            desc: 'Collecting supporting evidence...',
            icon: FileCheck,
            color: 'text-pink-400',
            gradient: 'from-pink-500 to-pink-600',
            duration: 2500
        },
        {
            id: 'policy',
            title: 'Policy Intelligence Agent',
            desc: 'Matching insurance criteria...',
            icon: Shield,
            color: 'text-cyan-400',
            gradient: 'from-cyan-500 to-cyan-600',
            duration: 3000
        },
        {
            id: 'decision',
            title: 'Decision Agent',
            desc: 'Calculating approval probability...',
            icon: CheckCircle2,
            color: 'text-emerald-400',
            gradient: 'from-emerald-500 to-emerald-600',
            duration: 2500
        },
        {
            id: 'submission',
            title: 'Submission Agent',
            desc: 'Generating auth packet...',
            icon: FileOutput,
            color: 'text-orange-400',
            gradient: 'from-orange-500 to-orange-600',
            duration: 2500
        }
    ];

    useEffect(() => {
        if (currentStep < steps.length) {
            const timer = setTimeout(() => {
                setCompletedSteps(prev => [...prev, currentStep]);
                setCurrentStep(prev => prev + 1);
            }, steps[currentStep].duration);
            return () => clearTimeout(timer);
        } else {
            setTimeout(onComplete, 1000);
        }
    }, [currentStep, onComplete]);

    return (
        <div className="w-full max-w-4xl mx-auto py-10 relative">
            {/* Particle effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(20)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-cyan-500 rounded-full"
                        initial={{
                            x: Math.random() * 100 + '%',
                            y: '100%',
                            opacity: 0
                        }}
                        animate={{
                            y: '-10%',
                            opacity: [0, 1, 0],
                        }}
                        transition={{
                            duration: 3 + Math.random() * 2,
                            repeat: Infinity,
                            delay: Math.random() * 2,
                            ease: 'linear'
                        }}
                    />
                ))}
            </div>

            <div className="relative">
                {/* Connecting Line */}
                <div className="absolute left-[39px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-slate-800 via-cyan-500/20 to-slate-800" />

                <div className="space-y-12">
                    {steps.map((step, index) => {
                        const isActive = index === currentStep;
                        const isCompleted = completedSteps.includes(index);
                        const isPending = index > currentStep;

                        return (
                            <motion.div
                                key={step.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={`relative pl-24 transition-all duration-500 ${isActive ? 'scale-105' : isCompleted ? 'opacity-80' : 'opacity-40'
                                    }`}
                            >
                                {/* Agent Node */}
                                <motion.div
                                    className={`absolute left-0 top-1/2 -translate-y-1/2 w-20 h-20 rounded-2xl flex items-center justify-center border-2 z-10 backdrop-blur-xl
                                        ${isActive
                                            ? `bg-gradient-to-br ${step.gradient} border-${step.color.split('-')[1]}-400 shadow-[0_0_30px_currentColor]`
                                            : isCompleted
                                                ? 'bg-emerald-900/30 border-emerald-500'
                                                : 'bg-slate-900/50 border-slate-700'
                                        }`}
                                    animate={isActive ? {
                                        boxShadow: [
                                            '0 0 20px currentColor',
                                            '0 0 40px currentColor',
                                            '0 0 20px currentColor'
                                        ]
                                    } : {}}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    {isCompleted ? (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: 'spring', stiffness: 200 }}
                                        >
                                            <Check className="h-8 w-8 text-emerald-400" />
                                        </motion.div>
                                    ) : isActive ? (
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                        >
                                            <step.icon className={`h-8 w-8 ${step.color}`} />
                                        </motion.div>
                                    ) : (
                                        <step.icon className="h-8 w-8 text-slate-600" />
                                    )}

                                    {/* Pulse rings for active agent */}
                                    {isActive && (
                                        <>
                                            <motion.span
                                                className="absolute inset-0 rounded-2xl border-2 border-current"
                                                animate={{
                                                    scale: [1, 1.5],
                                                    opacity: [0.5, 0]
                                                }}
                                                transition={{ duration: 1.5, repeat: Infinity }}
                                            />
                                            <motion.span
                                                className="absolute inset-0 rounded-2xl border-2 border-current"
                                                animate={{
                                                    scale: [1, 1.5],
                                                    opacity: [0.5, 0]
                                                }}
                                                transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                                            />
                                        </>
                                    )}
                                </motion.div>

                                {/* Data stream effect */}
                                {isActive && index < steps.length - 1 && (
                                    <motion.div
                                        className={`absolute left-[39px] top-1/2 w-0.5 h-24 bg-gradient-to-b ${step.gradient} opacity-60`}
                                        initial={{ scaleY: 0 }}
                                        animate={{ scaleY: 1 }}
                                        transition={{ duration: 0.8 }}
                                    >
                                        {[...Array(3)].map((_, i) => (
                                            <motion.div
                                                key={i}
                                                className="absolute left-0 w-0.5 h-2 bg-white rounded-full"
                                                animate={{ y: [0, 96] }}
                                                transition={{
                                                    duration: 1,
                                                    repeat: Infinity,
                                                    delay: i * 0.3
                                                }}
                                            />
                                        ))}
                                    </motion.div>
                                )}

                                {/* Content Card */}
                                <GlassCard
                                    variant={isActive ? 'neon' : 'default'}
                                    className={`p-5 transition-all duration-500 ${isActive ? `border-${step.color.split('-')[1]}-500/50 bg-slate-800/80` : ''
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className={`text-lg font-bold ${isActive ? 'text-white' : 'text-slate-400'}`}>
                                            {step.title}
                                        </h3>
                                        {isActive && <Loader2 className={`h-4 w-4 ${step.color} animate-spin`} />}
                                        {isCompleted && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                            >
                                                <Check className="h-4 w-4 text-emerald-400" />
                                            </motion.div>
                                        )}
                                    </div>
                                    <p className="text-slate-400 text-sm">
                                        {isActive ? step.desc : isCompleted ? 'Completed ✓' : 'Waiting...'}
                                    </p>

                                    {/* Terminal output */}
                                    {isActive && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="mt-3 text-xs font-mono text-cyan-300 bg-black/50 p-3 rounded border border-cyan-500/20"
                                        >
                                            <TypewriterText step={step} />
                                        </motion.div>
                                    )}
                                </GlassCard>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

const TypewriterText = ({ step }) => {
    const textMap = {
        'intake': ['> Connecting to EHR system...', '> Patient record received', '> Parsing clinical data...'],
        'reader': ['> Reading patient note...', '> Diagnosis detected: Severe Knee Pain', '> Procedure: MRI Scan (CPT 73721)', '> Medical necessity: CONFIRMED'],
        'evidence': ['> Collecting lab results...', '> Physical therapy logs: 8 weeks', '> X-Ray: Inconclusive', '> Evidence package: READY'],
        'policy': ['> Fetching BlueCross Policy #492...', '> Matching criteria...', '> Policy requirements: MET'],
        'decision': ['> Calculating approval probability...', '> Confidence score: 91%', '> Recommendation: APPROVE'],
        'submission': ['> Generating authorization packet...', '> Form filled automatically', '> Submission: READY']
    };

    const [lines, setLines] = useState([]);
    const texts = textMap[step.id] || [];

    useEffect(() => {
        let delay = 0;
        texts.forEach((line, i) => {
            setTimeout(() => {
                setLines(prev => [...prev, line]);
            }, delay);
            delay += 600;
        });
    }, []);

    return (
        <div className="space-y-1">
            {lines.map((l, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2"
                >
                    <Zap className="h-3 w-3 text-cyan-400" />
                    {l}
                </motion.div>
            ))}
        </div>
    );
};
