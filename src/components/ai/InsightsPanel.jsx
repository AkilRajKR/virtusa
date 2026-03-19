import React from 'react';

export default function InsightsPanel({ decision = {}, research = {}, reasoning = {} }) {
    const { rationale, key_factors = [], next_steps = [], risk_assessment, summary } = decision;
    const { sources = [], total_found } = research;
    const { key_findings = [], evidence_strength, gaps_identified = [] } = reasoning;

    return (
        <div style={styles.container}>
            <h3 style={styles.title}><span>💡</span> AI Insights</h3>

            {summary && (
                <div style={styles.summaryBox}>
                    <p style={styles.summaryText}>{summary}</p>
                </div>
            )}

            {rationale && (
                <section style={styles.section}>
                    <h4 style={styles.sectionTitle}>📝 Decision Rationale</h4>
                    <p style={styles.bodyText}>{rationale}</p>
                </section>
            )}

            {key_findings.length > 0 && (
                <section style={styles.section}>
                    <h4 style={styles.sectionTitle}>🔬 Key Findings</h4>
                    <ul style={styles.list}>
                        {key_findings.map((f, i) => (
                            <li key={i} style={styles.listItem}>
                                <span style={styles.bullet}>▸</span> {f}
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {key_factors.length > 0 && (
                <section style={styles.section}>
                    <h4 style={styles.sectionTitle}>⚖️ Decision Factors</h4>
                    {key_factors.slice(0, 5).map((f, i) => (
                        <div key={i} style={styles.factorRow}>
                            <span style={{ ...styles.factorSupport, color: f.supports ? '#10b981' : '#ef4444' }}>
                                {f.supports ? '✓' : '✗'}
                            </span>
                            <span style={styles.factorText}>{f.factor}</span>
                            <span style={{ ...styles.weightBadge, background: f.weight === 'high' ? '#ef444422' : '#f59e0b22', color: f.weight === 'high' ? '#f87171' : '#fbbf24' }}>
                                {f.weight}
                            </span>
                        </div>
                    ))}
                </section>
            )}

            <div style={styles.metaRow}>
                {evidence_strength && (
                    <MetaChip label="Evidence" value={evidence_strength} color="#6366f1" />
                )}
                {risk_assessment && (
                    <MetaChip label="Risk" value={risk_assessment} color="#f59e0b" />
                )}
                {total_found !== undefined && (
                    <MetaChip label="Sources Found" value={total_found} color="#06b6d4" />
                )}
            </div>

            {sources.length > 0 && (
                <section style={styles.section}>
                    <h4 style={styles.sectionTitle}>📄 Source Documents</h4>
                    {sources.map((s, i) => (
                        <div key={i} style={styles.sourceTag}>
                            <span style={styles.sourceIcon}>📎</span> {s}
                        </div>
                    ))}
                </section>
            )}

            {next_steps.length > 0 && (
                <section style={styles.section}>
                    <h4 style={styles.sectionTitle}>→ Next Steps</h4>
                    {next_steps.slice(0, 4).map((s, i) => (
                        <div key={i} style={styles.nextStep}>
                            <span style={styles.stepNum}>{i + 1}</span>
                            <span>{s}</span>
                        </div>
                    ))}
                </section>
            )}

            {gaps_identified.length > 0 && (
                <section style={styles.section}>
                    <h4 style={{ ...styles.sectionTitle, color: '#f87171' }}>⚠️ Gaps Identified</h4>
                    {gaps_identified.map((g, i) => (
                        <p key={i} style={{ ...styles.bodyText, color: '#fca5a5' }}>• {g}</p>
                    ))}
                </section>
            )}
        </div>
    );
}

function MetaChip({ label, value, color }) {
    return (
        <div style={{ ...chipStyles.chip, borderColor: color + '44', background: color + '11' }}>
            <span style={{ ...chipStyles.label, color: color + 'cc' }}>{label}</span>
            <span style={{ ...chipStyles.value, color }}>{value}</span>
        </div>
    );
}

const chipStyles = {
    chip: { border: '1px solid', borderRadius: '10px', padding: '6px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' },
    label: { fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' },
    value: { fontSize: '13px', fontWeight: 800, textTransform: 'capitalize' },
};

const styles = {
    container: {
        background: 'rgba(15,23,42,0.7)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(99,102,241,0.3)',
        borderRadius: '16px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
    },
    title: { margin: 0, fontSize: '16px', fontWeight: 700, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' },
    summaryBox: { background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '10px', padding: '12px 16px' },
    summaryText: { margin: 0, fontSize: '14px', color: '#c7d2fe', lineHeight: 1.6 },
    section: { display: 'flex', flexDirection: 'column', gap: '8px' },
    sectionTitle: { margin: 0, fontSize: '13px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' },
    bodyText: { margin: 0, fontSize: '14px', color: '#cbd5e1', lineHeight: 1.6 },
    list: { margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px' },
    listItem: { display: 'flex', gap: '8px', fontSize: '14px', color: '#cbd5e1' },
    bullet: { color: '#6366f1', flexShrink: 0 },
    factorRow: { display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' },
    factorSupport: { fontWeight: 800, fontSize: '16px', width: '20px', textAlign: 'center' },
    factorText: { flex: 1, fontSize: '13px', color: '#cbd5e1' },
    weightBadge: { fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '99px', textTransform: 'uppercase' },
    metaRow: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
    sourceTag: { display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: '8px', padding: '4px 10px', fontSize: '13px', color: '#67e8f9' },
    sourceIcon: { fontSize: '14px' },
    nextStep: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#94a3b8' },
    stepNum: { width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#818cf8', flexShrink: 0 },
};
