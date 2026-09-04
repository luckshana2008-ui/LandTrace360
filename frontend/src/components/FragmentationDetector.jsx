import { useState, useEffect } from 'react';
import { Expand, ShieldAlert, ArrowDown } from 'lucide-react';
import API_BASE from '../api';

const FragmentationDetector = ({ landId }) => {
    const [fragData, setFragData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!landId) return;
        setLoading(true);
        fetch(`${API_BASE}/api/lands/${landId}/fragmentation-analysis`)
            .then(res => res.json())
            .then(data => {
                setFragData(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching fragmentation data:", err);
                setLoading(false);
            });
    }, [landId]);

    if (loading) {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>Analyzing Land Fragmentation...</div>;
    }

    if (!fragData) {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>No fragmentation data available.</div>;
    }

    const { original_area, current_area, subdivisions, status, percentage_lost, risk_impact, description } = fragData;

    const getRiskColor = (impact) => {
        if (impact === 'High' || impact === 'Critical') return 'var(--danger)';
        if (impact === 'Medium') return 'var(--warning)';
        return 'var(--success)';
    };

    return (
        <div className="glass-panel" style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                <Expand size={24} color="#a855f7" />
                <h2 style={{ margin: 0 }}>Land Fragmentation Detector</h2>
            </div>

            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <strong>Disclaimer:</strong> This is a synthetic demonstration feature illustrating historical subdivision tracking. It is NOT legal or cadastral advice.
            </p>

            <div className="grid-cards" style={{ gridTemplateColumns: 'reap(auto-fit, minmax(300px, 1fr))' }}>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '8px', flex: 1 }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>Fragmentation Overview</h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Original Parent Area</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{original_area.toLocaleString()} sq ft</div>
                        </div>
                        <div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Current Plot Area</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{current_area.toLocaleString()} sq ft</div>
                        </div>
                        <div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Total Subdivisions</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{subdivisions} splits</div>
                        </div>
                        <div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Lost to Subdivision</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: percentage_lost > 50 ? 'var(--danger)' : percentage_lost > 20 ? 'var(--warning)' : 'var(--text-primary)' }}>
                                {percentage_lost}%
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '8px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ marginBottom: '1rem' }}>Status & Risk</h3>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <span style={{
                            background: `rgba(${risk_impact === 'High' ? '239, 68, 68' : risk_impact === 'Medium' ? '245, 158, 11' : '16, 185, 129'}, 0.2)`,
                            border: `1px solid ${getRiskColor(risk_impact)}`,
                            color: getRiskColor(risk_impact),
                            padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: 'bold'
                        }}>
                            {status}
                        </span>

                        <span style={{ color: getRiskColor(risk_impact), display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 'bold' }}>
                            {risk_impact === 'High' && <ShieldAlert size={18} />} Risk: {risk_impact}
                        </span>
                    </div>

                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5', flex: 1 }}>
                        {description}
                    </p>
                </div>
            </div>

            {/* Visualizer */}
            <div>
                <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Subdivision Visualizer</h3>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '2rem', borderRadius: '8px' }}>

                    <div style={{
                        width: '200px', height: '100px', background: 'rgba(168, 85, 247, 0.2)',
                        border: '2px solid #a855f7', borderRadius: '4px',
                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                        color: 'white', fontWeight: 'bold'
                    }}>
                        Original Parent Land
                    </div>

                    {subdivisions > 0 && (
                        <>
                            <ArrowDown size={32} color="var(--text-secondary)" style={{ margin: '1rem 0' }} />
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                                {[...Array(subdivisions)].map((_, i) => (
                                    <div key={i} style={{
                                        width: `${180 / subdivisions}px`, height: '80px',
                                        minWidth: '60px',
                                        background: 'rgba(59, 130, 246, 0.1)',
                                        border: '1px dashed var(--accent-color)', borderRadius: '4px',
                                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                                        color: 'var(--accent-color)', fontSize: '0.8rem', textAlign: 'center', padding: '0.25rem'
                                    }}>
                                        Subdivision {i + 1}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

        </div>
    );
};

export default FragmentationDetector;
