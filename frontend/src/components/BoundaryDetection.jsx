import { useState, useEffect } from 'react';
import { Target, AlertTriangle, ArrowRight, Activity, Map, ArrowRightLeft } from 'lucide-react';
import API_BASE from '../api';

const BoundaryDetection = ({ landId }) => {
    const [detectionData, setDetectionData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!landId) return;
        setLoading(true);
        fetch(`${API_BASE}/api/lands/${landId}/boundary-detection`)
            .then(res => res.json())
            .then(data => {
                setDetectionData(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching boundary detection data:", err);
                setLoading(false);
            });
    }, [landId]);

    if (loading) {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Boundary Analysis...</div>;
    }

    if (!detectionData) {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>No boundary data available for this land.</div>;
    }

    const { previous_status, current_status, deviation_percentage, last_survey_date, change_status, risk_impact } = detectionData;

    const getRiskColor = (impact) => {
        if (impact === 'High' || impact === 'Critical') return 'var(--danger)';
        if (impact === 'Medium') return 'var(--warning)';
        return 'var(--success)';
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', borderLeft: '4px solid var(--accent-color)', padding: '1rem', borderRadius: '8px' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Map size={20} color="var(--accent-color)" /> Synthetic Boundary Detection
                </h3>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    <strong>Disclaimer:</strong> This is a synthetic demo feature generating expected boundary deviation parameters based on hypothetical spatial data. It is NOT a real cadastral or legal conclusion.
                </p>
            </div>

            <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                {/* Visual Comparison Card */}
                <div className="glass-panel" style={{ gridColumn: 'span 2' }}>
                    <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>Spatial Evolution</h3>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.2)', padding: '2rem', borderRadius: '8px' }}>
                        <div style={{ textAlign: 'center', flex: 1 }}>
                            <div style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 'bold' }}>Previous Scan</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>{previous_status}</div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 1rem' }}>
                            <ArrowRightLeft size={32} color="var(--accent-color)" opacity="0.6" />
                            <span style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: 'var(--text-secondary)' }}>Deviation: <strong style={{ color: getRiskColor(risk_impact) }}>{deviation_percentage}%</strong></span>
                        </div>

                        <div style={{ textAlign: 'center', flex: 1 }}>
                            <div style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 'bold' }}>Current Scan</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: '600', color: deviation_percentage > 2 ? 'var(--warning)' : 'var(--text-primary)' }}>{current_status}</div>
                        </div>
                    </div>
                </div>

                {/* Info Card */}
                <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Detection Metrics</h3>

                    <div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Change Status</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Activity size={18} color={getRiskColor(risk_impact)} />
                            {change_status}
                        </div>
                    </div>

                    <div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Risk Impact</div>
                        <div style={{
                            display: 'inline-block',
                            background: `rgba(${risk_impact === 'High' || risk_impact === 'Critical' ? '239, 68, 68' : risk_impact === 'Medium' ? '245, 158, 11' : '16, 185, 129'}, 0.2)`,
                            color: getRiskColor(risk_impact),
                            padding: '0.25rem 0.75rem',
                            borderRadius: '9999px',
                            fontWeight: 'bold',
                            marginTop: '0.25rem'
                        }}>
                            {risk_impact}
                        </div>
                    </div>

                    <div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Last Survey Date</div>
                        <div>{last_survey_date}</div>
                    </div>
                </div>
            </div>

            {risk_impact === 'High' || risk_impact === 'Critical' ? (
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', padding: '1rem', borderRadius: '8px', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                    <AlertTriangle size={24} color="var(--danger)" style={{ flexShrink: 0, marginTop: '0.25rem' }} />
                    <div>
                        <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--danger)' }}>Significant Deviation Action Required</h4>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            Our synthetic detection engine highlights a large boundary gap ({deviation_percentage}%). Legal and physical verification is strongly advised before initiating transactions on this parcel.
                        </p>
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default BoundaryDetection;
