import React from 'react';

const AGENT_META = {
    MemoryAgent: { icon: '🧠', color: '#8b5cf6', label: 'Memory Agent' },
    'MemoryAgent (store)': { icon: '💾', color: '#6d28d9', label: 'Memory Store' },
    PlannerAgent: { icon: '📋', color: '#3b82f6', label: 'Planner Agent' },
    ResearchAgent: { icon: '🔍', color: '#06b6d4', label: 'Research Agent' },
    ReasoningAgent: { icon: '⚙️', color: '#f59e0b', label: 'Reasoning Agent' },
    DecisionAgent: { icon: '⚖️', color: '#10b981', label: 'Decision Agent' },
};

const STATUS_COLORS = {
    completed: '#10b981',
    running: '#f59e0b',
    failed: '#ef4444',
    pending: '#6b7280',
};

export default function AgentReasoningViewer({ steps = [], isLoading = false }) {
    return (
        <div style={styles.container}>
            <h3 style={styles.title}>
                <span style={styles.titleIcon}>⚡</span> Agent Execution Trace
            </h3>

            {isLoading && (
                <div style={styles.loadingRow}>
                    <span style={styles.spinner} />
                    <span style={styles.loadingText}>Agents are working...</span>
                </div>
            )}

            <div style={styles.timeline}>
                {steps.map((step, idx) => {
                    const meta = AGENT_META[step.agent_name] || { icon: '🤖', color: '#6b7280', label: step.agent_name };
                    const statusColor = STATUS_COLORS[step.status] || '#6b7280';

                    return (
                        <div key={idx} style={styles.step}>
                            {/* Connector line */}
                            {idx < steps.length - 1 && <div style={styles.connector} />}

                            <div style={{ ...styles.iconBadge, background: meta.color + '22', border: `2px solid ${meta.color}` }}>
                                <span style={styles.iconText}>{meta.icon}</span>
                            </div>

                            <div style={styles.stepBody}>
                                <div style={styles.stepHeader}>
                                    <span style={{ ...styles.agentName, color: meta.color }}>{meta.label}</span>
                                    <span style={{ ...styles.statusBadge, background: statusColor + '22', color: statusColor }}>
                                        {step.status}
                                    </span>
                                    {step.duration_ms > 0 && (
                                        <span style={styles.duration}>{step.duration_ms}ms</span>
                                    )}
                                </div>

                                {step.error && (
                                    <p style={styles.errorText}>⚠️ {step.error}</p>
                                )}

                                {step.output && Object.keys(step.output).length > 0 && (
                                    <div style={styles.outputBox}>
                                        {Object.entries(step.output).map(([k, v]) => (
                                            <span key={k} style={styles.outputTag}>
                                                {k}: <strong>{String(v)}</strong>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {steps.length === 0 && !isLoading && (
                    <p style={styles.emptyText}>Run a query to see agent execution steps.</p>
                )}
            </div>
        </div>
    );
}

const styles = {
    container: {
        background: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        borderRadius: '16px',
        padding: '24px',
    },
    title: {
        margin: '0 0 20px',
        fontSize: '16px',
        fontWeight: 700,
        color: '#e2e8f0',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    titleIcon: { fontSize: '20px' },
    loadingRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '16px',
        color: '#94a3b8',
        fontSize: '14px',
    },
    spinner: {
        display: 'inline-block',
        width: '16px',
        height: '16px',
        border: '2px solid rgba(99, 102, 241, 0.3)',
        borderTop: '2px solid #6366f1',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
    },
    loadingText: { color: '#94a3b8' },
    timeline: { position: 'relative' },
    step: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '14px',
        marginBottom: '20px',
        position: 'relative',
    },
    connector: {
        position: 'absolute',
        left: '18px',
        top: '40px',
        width: '2px',
        height: 'calc(100% + 10px)',
        background: 'linear-gradient(to bottom, rgba(99,102,241,0.5), rgba(99,102,241,0.1))',
    },
    iconBadge: {
        width: '38px',
        height: '38px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        zIndex: 1,
    },
    iconText: { fontSize: '18px' },
    stepBody: { flex: 1, minWidth: 0 },
    stepHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        flexWrap: 'wrap',
        marginBottom: '4px',
    },
    agentName: {
        fontWeight: 700,
        fontSize: '14px',
    },
    statusBadge: {
        fontSize: '11px',
        fontWeight: 600,
        padding: '2px 8px',
        borderRadius: '99px',
        textTransform: 'uppercase',
    },
    duration: {
        fontSize: '11px',
        color: '#64748b',
        marginLeft: 'auto',
    },
    errorText: {
        margin: '4px 0 0',
        fontSize: '12px',
        color: '#f87171',
    },
    outputBox: {
        marginTop: '6px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '6px',
    },
    outputTag: {
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '6px',
        padding: '2px 8px',
        fontSize: '12px',
        color: '#94a3b8',
    },
    emptyText: {
        color: '#64748b',
        fontSize: '14px',
        textAlign: 'center',
        padding: '20px 0',
    },
};
