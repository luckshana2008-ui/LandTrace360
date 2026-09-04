import { useState, useEffect } from 'react';
import { FileCheck, ShieldAlert, FileWarning, Search, AlertCircle, CheckCircle2 } from 'lucide-react';
import API_BASE from '../api';

const DocumentVerification = ({ landId }) => {
    const [verificationData, setVerificationData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!landId) return;
        setLoading(true);
        fetch(`${API_BASE}/api/lands/${landId}/document-verification`)
            .then(res => res.json())
            .then(data => {
                setVerificationData(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching document verification data:", err);
                setLoading(false);
            });
    }, [landId]);

    if (loading) {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>Running AI Document Cross-Verification...</div>;
    }

    if (!verificationData) {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>No verification data available.</div>;
    }

    const { overall_result, score, fields, explanation } = verificationData;

    const getResultColor = (result) => {
        if (result === 'MATCH' || result === 'VERIFIED MATCH') return 'var(--success)';
        if (result === 'MISMATCH' || result === 'CONFLICT DETECTED') return 'var(--danger)';
        if (result === 'NOT AVAILABLE' || result === 'PARTIAL MATCH') return 'var(--warning)';
        return 'var(--text-secondary)';
    };

    const getResultIcon = (result) => {
        if (result === 'VERIFIED MATCH') return <CheckCircle2 size={24} color="var(--success)" />;
        if (result === 'CONFLICT DETECTED') return <ShieldAlert size={24} color="var(--danger)" />;
        return <FileWarning size={24} color="var(--warning)" />;
    };

    return (
        <div className="glass-panel" style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Search size={22} color="var(--accent-color)" /> Document-Record Cross Verification
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Verification Score</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: getResultColor(overall_result) }}>{score}/100</div>
                    </div>
                </div>
            </div>

            <div style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                background: `rgba(${overall_result === 'CONFLICT DETECTED' ? '239, 68, 68' : overall_result === 'VERIFIED MATCH' ? '16, 185, 129' : '245, 158, 11'}, 0.1)`,
                border: `1px solid ${getResultColor(overall_result)}`,
                padding: '1rem', borderRadius: '8px'
            }}>
                {getResultIcon(overall_result)}
                <div>
                    <h3 style={{ margin: '0 0 0.25rem 0', color: getResultColor(overall_result) }}>{overall_result}</h3>
                    <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{explanation}</p>
                </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginTop: '0.5rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>Field</th>
                            <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>Document Information</th>
                            <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>Official Land Record</th>
                            <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>Result</th>
                        </tr>
                    </thead>
                    <tbody>
                        {fields.map((f, i) => (
                            <tr key={i} style={{
                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                background: f.result === 'MISMATCH' ? 'rgba(239, 68, 68, 0.05)' : 'transparent'
                            }}>
                                <td style={{ padding: '1rem', fontWeight: '500' }}>{f.name}</td>
                                <td style={{ padding: '1rem', color: f.result === 'MISMATCH' ? 'var(--danger)' : 'inherit' }}>{f.doc_value}</td>
                                <td style={{ padding: '1rem' }}>{f.record_value}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        background: `rgba(${f.result === 'MISMATCH' ? '239, 68, 68' : f.result === 'MATCH' ? '16, 185, 129' : '245, 158, 11'}, 0.2)`,
                                        color: getResultColor(f.result),
                                        padding: '0.25rem 0.6rem',
                                        borderRadius: '4px',
                                        fontSize: '0.8rem',
                                        fontWeight: 'bold'
                                    }}>
                                        {f.result}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                <AlertCircle size={16} /> Note: This is an AI-assisted synthetic cross-verification. It is not an alternative to manual due diligence.
            </p>
        </div>
    );
};

export default DocumentVerification;
