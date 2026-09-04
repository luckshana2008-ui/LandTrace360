import { useState } from 'react';
import { Activity, AlertTriangle, ArrowRight, ShieldAlert } from 'lucide-react';
import API_BASE from '../api';

const SCENARIOS = [
    { id: 'none', label: 'No Changes' },
    { id: 'mortgage_active', label: 'Mortgage becomes Active' },
    { id: 'legal_pending', label: 'Legal Case becomes Pending' },
    { id: 'ownership_dispute', label: 'Ownership Dispute occurs' },
    { id: 'boundary_change', label: 'Boundary Change Detected' },
    { id: 'document_fail', label: 'Document Verification Fails' }
];

const WhatIfSimulator = ({ landId }) => {
    const [scenario, setScenario] = useState('none');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSimulate = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/lands/${landId}/what-if`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scenario })
            });
            const data = await res.json();
            setResult(data);
        } catch (err) {
            console.error('Simulation failed:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-panel" style={{ marginTop: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                <Activity size={24} color="var(--accent-color)" />
                <h2 style={{ margin: 0 }}>What-If Risk Simulator</h2>
            </div>

            <div style={{ padding: '0.75rem 1rem', background: 'rgba(245, 158, 11, 0.1)', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '0.5rem', alignItems: 'flex-start', marginBottom: '1.5rem', borderRadius: '8px' }}>
                <AlertTriangle size={16} color="var(--warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Simulation uses synthetic demo data and is not legal advice.
                </p>
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ flex: 1, minWidth: '250px' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Select Scenario:</label>
                        <select
                            value={scenario}
                            onChange={(e) => setScenario(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: '8px',
                                background: 'rgba(0,0,0,0.3)',
                                color: 'white',
                                border: '1px solid var(--border-color)',
                                fontSize: '1rem'
                            }}
                        >
                            {SCENARIOS.map(s => (
                                <option key={s.id} value={s.id}>{s.label}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={handleSimulate}
                        className="btn-primary"
                        disabled={loading}
                        style={{ marginTop: '1.75rem', padding: '0.75rem 2rem' }}
                    >
                        {loading ? 'Simulating...' : 'Simulate'}
                    </button>
                </div>

                {result && (
                    <div style={{ marginTop: '1rem', padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', textAlign: 'center' }}>
                            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px' }}>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Current Score</div>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{result.current_score}</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                                <ArrowRight size={32} />
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', border: `1px solid ${result.risk_level === 'HIGH' ? 'var(--danger)' : result.risk_level === 'MEDIUM' ? 'var(--warning)' : 'var(--success)'}` }}>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Simulated Score</div>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{result.simulated_score}</div>
                            </div>
                        </div>

                        <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                                <span className={`status-badge status-${result.risk_level === 'HIGH' ? 'danger' : result.risk_level === 'MEDIUM' ? 'warning' : 'success'}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', padding: '0.5rem 1rem' }}>
                                    <ShieldAlert size={16} /> Risk Level: {result.risk_level}
                                </span>
                                <span className={`status-badge status-${result.change === 'Increased' ? 'danger' : result.change === 'Decreased' ? 'success' : 'info'}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', padding: '0.5rem 1rem' }}>
                                    Change: {result.change}
                                </span>
                            </div>
                            <p style={{ margin: 0, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                                <strong>Reason:</strong> {result.reason}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WhatIfSimulator;
