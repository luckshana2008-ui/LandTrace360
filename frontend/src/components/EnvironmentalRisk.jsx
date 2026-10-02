import { useState, useEffect } from 'react';
import API_BASE from '../api';

const EnvironmentalRisk = ({ landId }) => {
    const [data, setData] = useState(null);

    useEffect(() => {
        fetch(`${API_BASE}/api/lands/${landId}/environmental-risk`)
            .then(res => res.json())
            .then(setData)
            .catch(console.error);
    }, [landId]);

    if (!data) return null;

    return (
        <div className="glass-panel" style={{ marginTop: '2rem' }}>
            <h2>🌍 Environmental Risk</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1rem 0' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Risk Level:</span>
                <span className={`status-badge ${data.risk_level === 'LOW' ? 'status-success' : data.risk_level === 'MEDIUM' ? 'status-warning' : 'status-danger'}`} style={{ fontSize: '1.2rem', padding: '0.5rem 1rem' }}>
                    {data.risk_level} (Score: {data.score})
                </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
                {data.factors.map((f, i) => (
                    <div key={i} style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{f.factor}</p>
                        <p style={{ margin: '0.5rem 0 0 0', fontWeight: 'bold', color: f.impact === 'High' ? 'var(--danger)' : f.impact === 'Medium' ? 'var(--warning)' : 'var(--success)' }}>
                            {f.impact}
                        </p>
                    </div>
                ))}
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '1rem' }}>* {data.disclaimer}</p>
        </div>
    );
};

export default EnvironmentalRisk;
