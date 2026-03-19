import React, { useState, useRef, useCallback } from 'react';
import aiService from '../../services/ai.service';

const ALLOWED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/csv'];
const ALLOWED_EXT = ['.pdf', '.docx', '.txt', '.csv'];

export default function DocumentUpload({ onUploadComplete }) {
    const [dragOver, setDragOver] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const inputRef = useRef();

    const handleFile = useCallback(async (file) => {
        if (!file) return;
        const ext = '.' + file.name.split('.').pop().toLowerCase();
        if (!ALLOWED_EXT.includes(ext)) {
            setError(`Unsupported file type. Allowed: ${ALLOWED_EXT.join(', ')}`);
            return;
        }
        setError('');
        setResult(null);
        setUploading(true);
        setProgress(0);
        try {
            const data = await aiService.uploadDocument(file, setProgress);
            setResult(data);
            if (onUploadComplete) onUploadComplete(data);
        } catch (err) {
            setError(err.response?.data?.detail || 'Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    }, [onUploadComplete]);

    const onDrop = useCallback((e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        handleFile(file);
    }, [handleFile]);

    return (
        <div style={styles.container}>
            <h3 style={styles.title}><span>📤</span> Upload Document</h3>
            <p style={styles.subtitle}>Upload PDF, DOCX, TXT, or CSV files to enable semantic search and analysis.</p>

            <div
                style={{ ...styles.dropzone, ...(dragOver ? styles.dropzoneActive : {}), ...(uploading ? styles.dropzoneDisabled : {}) }}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => !uploading && inputRef.current?.click()}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept={ALLOWED_EXT.join(',')}
                    style={{ display: 'none' }}
                    onChange={(e) => handleFile(e.target.files[0])}
                />
                <div style={styles.dropzoneIcon}>{uploading ? '⏳' : dragOver ? '📂' : '📁'}</div>
                <p style={styles.dropzoneText}>
                    {uploading ? 'Processing document...' : 'Drop file here or click to browse'}
                </p>
                <p style={styles.dropzoneHint}>Supported: PDF, DOCX, TXT, CSV · Max 10MB</p>
            </div>

            {uploading && (
                <div style={styles.progressWrap}>
                    <div style={styles.progressBar}>
                        <div style={{ ...styles.progressFill, width: `${progress}%` }} />
                    </div>
                    <span style={styles.progressText}>{progress}% uploaded</span>
                </div>
            )}

            {error && (
                <div style={styles.errorBox}>
                    <span>⚠️</span> {error}
                </div>
            )}

            {result && (
                <div style={styles.successBox}>
                    <div style={styles.successHeader}>
                        <span style={styles.successIcon}>✅</span>
                        <strong>{result.filename}</strong>
                    </div>
                    <div style={styles.successMeta}>
                        <MetaItem label="Chunks stored" value={result.chunks_stored} />
                        <MetaItem label="File size" value={`${result.file_size_kb} KB`} />
                        <MetaItem label="Document ID" value={`#${result.document_id}`} />
                    </div>
                    {result.text_preview && (
                        <div style={styles.preview}>
                            <p style={styles.previewLabel}>Preview:</p>
                            <p style={styles.previewText}>{result.text_preview.slice(0, 200)}...</p>
                        </div>
                    )}
                    <p style={styles.successMsg}>{result.message}</p>
                </div>
            )}
        </div>
    );
}

function MetaItem({ label, value }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
            <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#10b981' }}>{value}</span>
        </div>
    );
}

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
    subtitle: { margin: 0, fontSize: '13px', color: '#64748b' },
    dropzone: {
        border: '2px dashed rgba(99,102,241,0.4)',
        borderRadius: '12px',
        padding: '32px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        background: 'rgba(99,102,241,0.03)',
    },
    dropzoneActive: {
        borderColor: '#6366f1',
        background: 'rgba(99,102,241,0.1)',
        transform: 'scale(1.01)',
    },
    dropzoneDisabled: { cursor: 'not-allowed', opacity: 0.6 },
    dropzoneIcon: { fontSize: '36px' },
    dropzoneText: { margin: 0, fontSize: '14px', fontWeight: 600, color: '#94a3b8' },
    dropzoneHint: { margin: 0, fontSize: '12px', color: '#475569' },
    progressWrap: { display: 'flex', flexDirection: 'column', gap: '6px' },
    progressBar: { height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '99px', overflow: 'hidden' },
    progressFill: {
        height: '100%',
        background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
        borderRadius: '99px',
        transition: 'width 0.3s ease',
    },
    progressText: { fontSize: '12px', color: '#94a3b8', textAlign: 'right' },
    errorBox: {
        background: 'rgba(239,68,68,0.1)',
        border: '1px solid rgba(239,68,68,0.3)',
        borderRadius: '10px',
        padding: '12px 16px',
        fontSize: '13px',
        color: '#fca5a5',
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
    },
    successBox: {
        background: 'rgba(16,185,129,0.08)',
        border: '1px solid rgba(16,185,129,0.3)',
        borderRadius: '12px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
    },
    successHeader: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#6ee7b7' },
    successIcon: { fontSize: '20px' },
    successMeta: { display: 'flex', gap: '20px', flexWrap: 'wrap' },
    preview: { background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '10px 12px' },
    previewLabel: { margin: '0 0 4px', fontSize: '11px', color: '#64748b', textTransform: 'uppercase' },
    previewText: { margin: 0, fontSize: '12px', color: '#94a3b8', lineHeight: 1.6 },
    successMsg: { margin: 0, fontSize: '13px', color: '#6ee7b7' },
};
