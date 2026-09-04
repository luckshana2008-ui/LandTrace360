import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, AlertTriangle, MapPin, Shield, ArrowLeft } from 'lucide-react';
import API_BASE from '../api';

const HighRiskLands = () => {
    const [lands, setLands] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${API_BASE}/api/lands/high-risk`)
            .then(res => res.json())
            .then(data => {
                setLands(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching high risk lands:", err);
                setLoading(false);
            });
    }, []);

    const getRiskColor = (score) => {
        if (score >= 70) return 'var(--danger)';
        if (score >= 40) return 'var(--warning)';
        return 'var(--success)';
    };

    return (
        <div>
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-color)', fontWeight: '500', marginBottom: '1rem', transition: 'opacity 0.2s' }}>
                <ArrowLeft size={18} /> Back to Dashboard
            </Link>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <AlertTriangle size={28} style={{ color: 'var(--danger)' }} />
                High Risk Lands
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                Lands with an overall risk level of <strong style={{ color: 'var(--danger)' }}>HIGH</strong>. These properties require careful due diligence.
            </p>

            {loading ? <p>Loading high risk lands...</p> : (
                <div className="grid-cards">
                    {lands.map(land => (
                        <div key={land.id} className="glass-panel" style={{ position: 'relative', overflow: 'hidden' }}>
                            {/* Risk level badge */}
                            <div style={{
                                position: 'absolute', top: '1rem', right: '1rem',
                                background: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger)',
                                padding: '0.35rem 0.75rem', borderRadius: '9999px',
                                fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase',
                                display: 'flex', alignItems: 'center', gap: '0.35rem'
                            }}>
                                <AlertTriangle size={12} /> HIGH RISK
                            </div>

                            <h3 style={{ marginBottom: '0.5rem', marginTop: '0.25rem' }}>{land.id} - {land.land_type}</h3>

                            <p style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                <MapPin size={16} /> {land.location}, {land.village}
                            </p>

                            <p style={{ color: 'var(--text-secondary)', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                                Owner: <span style={{ color: 'var(--text-primary)' }}>{land.owner}</span> &nbsp;|&nbsp; Status: <span style={{
                                    color: land.status === 'Contested' ? 'var(--danger)' : land.status === 'Verified' ? 'var(--success)' : 'var(--warning)'
                                }}>{land.status}</span>
                            </p>

                            {/* Risk score bar */}
                            {land.risk_details && (
                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                                        <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                            <Shield size={14} /> Overall Risk Score
                                        </span>
                                        <span style={{ fontWeight: '700', color: getRiskColor(land.risk_details.overall_score) }}>
                                            {land.risk_details.overall_score} / 100
                                        </span>
                                    </div>
                                    <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '6px', height: '8px', overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${land.risk_details.overall_score}%`,
                                            height: '100%',
                                            background: `linear-gradient(90deg, var(--warning), var(--danger))`,
                                            borderRadius: '6px',
                                            transition: 'width 0.6s ease'
                                        }} />
                                    </div>

                                    {/* Breakdown */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem 1rem', marginTop: '0.6rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                        <span>Legal: <strong style={{ color: getRiskColor(land.risk_details.legal_risk) }}>{land.risk_details.legal_risk}</strong></span>
                                        <span>Boundary: <strong style={{ color: getRiskColor(land.risk_details.boundary_risk) }}>{land.risk_details.boundary_risk}</strong></span>
                                        <span>Ownership: <strong style={{ color: getRiskColor(land.risk_details.ownership_risk) }}>{land.risk_details.ownership_risk}</strong></span>
                                        <span>Document: <strong style={{ color: getRiskColor(land.risk_details.document_risk) }}>{land.risk_details.document_risk}</strong></span>
                                    </div>
                                </div>
                            )}

                            <Link to={`/land/${land.id}`} style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                color: 'var(--accent-color)', fontWeight: '600',
                                marginTop: '0.25rem', transition: 'gap 0.2s'
                            }}>
                                View Land Profile <ArrowRight size={16} />
                            </Link>
                        </div>
                    ))}
                    {lands.length === 0 && (
                        <div className="glass-panel" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>No high risk lands found.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default HighRiskLands;
