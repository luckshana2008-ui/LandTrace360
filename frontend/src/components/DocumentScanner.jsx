import { useState, useEffect } from 'react';
import API_BASE from '../api';

const DocumentScanner = ({ landId }) => {
    const [file, setFile] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch(`${API_BASE}/api/lands/${landId}/document-scan`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            setResult(data);
        } catch (error) {
            console.error('Upload Error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-panel" style={{ marginTop: '2rem' }}>
            <h2>📄 AI Document Scanner / Consistency Check (DEMO)</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Upload a demo document to perform mock OCR classification and cross verification.</p>

            <form onSubmit={handleUpload} style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                <input
                    type="file"
                    onChange={e => setFile(e.target.files[0])}
                    style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', border: '1px solid var(--border-color)', color: '#fff' }}
                />
                <button type="submit" disabled={!file || loading} className="btn-primary" style={{ padding: '0.5rem 1.5rem' }}>
                    {loading ? 'Scanning...' : 'Scan / Check'}
                </button>
            </form>

            {result && (
                <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0 }}>Document Consistency: {result.consistency_score}/100</h3>
                        <span className={`status-badge ${result.consistency_status === 'CONSISTENT' ? 'status-success' : 'status-danger'}`}>
                            Status: {result.consistency_status}
                        </span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{result.message}</p>

                    {result.explanation && <p style={{ color: 'var(--warning)', fontSize: '0.9rem', margin: '1rem 0' }}>{result.explanation}</p>}

                    <div style={{ marginTop: '1rem' }}>
                        {result.fields?.map((f, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                                <span style={{ width: '30%', color: 'var(--text-secondary)' }}>{f.name}</span>
                                <span style={{ width: '30%' }}>{f.doc_value}</span>
                                <span style={{ width: '10%', textAlign: 'center' }}>&#8594;</span>
                                <span style={{ width: '30%' }}>{f.record_value}</span>
                                <span style={{ width: 'auto', fontWeight: 'bold', color: f.result === 'MATCH' ? 'var(--success)' : f.result === 'MISMATCH' ? 'var(--danger)' : 'var(--warning)' }}>
                                    {f.result === 'MATCH' ? '✅ Match' : f.result === 'MISMATCH' ? '❌ Mismatch' : '⚠️ Partial'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DocumentScanner;
