import React from 'react';

export default function ConfidenceScore({ score = 0, recommendation = '' }) {
    const clamped = Math.min(100, Math.max(0, score));
    const color = clamped >= 75 ? '#10b981' : clamped >= 50 ? '#f59e0b' : '#ef4444';
    const label = recommendation || (clamped >= 75 ? 'APPROVE' : clamped >= 50 ? 'REVIEW' : 'DENY');
    const radius = 44;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (clamped / 100) * circumference;

    return (
        <div style={styles.container}>
            <h4 style={styles.label}>AI Confidence</h4>
            <div style={styles.gaugeWrap}>
                <svg width="110" height="110" viewBox="0 0 110 110">
                    <circle cx="55" cy="55" r={radius} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10" />
                    <circle
                        cx="55" cy="55" r={radius}
                        fill="none"
                        stroke={color}
                        strokeWidth="10"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        transform="rotate(-90 55 55)"
                        style={{ transition: 'stroke-dashoffset 1s ease, stroke 0.5s ease' }}
                    />
                    <text x="55" y="50" textAnchor="middle" fill={color} fontSize="20" fontWeight="700">
                        {Math.round(clamped)}%
                    </text>
                    <text x="55" y="67" textAnchor="middle" fill="#94a3b8" fontSize="10">
                        confidence
                    </text>
                </svg>
            </div>
            <div style={{ ...styles.badge, background: color + '22', color, borderColor: color + '55' }}>
                {label}
            </div>
        </div>
    );
}

const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px',
        background: 'rgba(15,23,42,0.7)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(99,102,241,0.3)',
        borderRadius: '16px',
        padding: '24px',
    },
    label: {
        margin: 0,
        fontSize: '14px',
        fontWeight: 700,
        color: '#e2e8f0',
    },
    gaugeWrap: { position: 'relative' },
    badge: {
        fontSize: '13px',
        fontWeight: 800,
        padding: '4px 16px',
        borderRadius: '99px',
        border: '1px solid',
        letterSpacing: '0.05em',
    },
};
