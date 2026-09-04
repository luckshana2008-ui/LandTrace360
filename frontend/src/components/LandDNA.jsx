import { Activity, ShieldAlert } from 'lucide-react';

const ProgressBar = ({ label, value }) => {
    let color = 'var(--success)';
    if (value < 50) color = 'var(--warning)';
    if (value < 30) color = 'var(--danger)';

    return (
        <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                <span>{label}</span>
                <span>{value}%</span>
            </div>
            <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${value}%`, background: color, transition: 'width 1s ease' }}></div>
            </div>
        </div>
    );
};

const LandDNA = ({ dna, risk }) => {
    return (
        <div className="grid-cards" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="glass-panel">
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    <Activity color="var(--accent-color)" /> Land DNA (Stability)
                </h2>
                <ProgressBar label="Overall Health" value={dna.overall_health} />
                <div style={{ marginTop: '2rem' }}>
                    <ProgressBar label="Ownership Stability" value={dna.ownership_stability} />
                    <ProgressBar label="Document Health" value={dna.document_health} />
                    <ProgressBar label="Legal Safety" value={dna.legal_safety} />
                    <ProgressBar label="Mortgage Status" value={dna.mortgage_status} />
                    <ProgressBar label="Boundary Stability" value={dna.boundary_stability} />
                </div>
            </div>

            <div className="glass-panel" style={{ border: risk.level === 'HIGH' ? '1px solid var(--danger)' : '1px solid var(--glass-border)' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: risk.level === 'HIGH' ? 'var(--danger)' : 'inherit' }}>
                    <ShieldAlert /> AI Risk Analysis
                </h2>
                <div style={{
                    background: risk.level === 'HIGH' ? 'rgba(239, 68, 68, 0.1)' : risk.level === 'MEDIUM' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                    padding: '1.5rem',
                    borderRadius: '8px',
                    textAlign: 'center',
                    marginBottom: '2rem'
                }}>
                    <h1 style={{ fontSize: '3rem', margin: 0, color: risk.level === 'HIGH' ? 'var(--danger)' : risk.level === 'MEDIUM' ? 'var(--warning)' : 'var(--success)' }}>
                        {risk.overall_score}
                    </h1>
                    <p style={{ fontWeight: 'bold', fontSize: '1.2rem', letterSpacing: '1px' }}>{risk.level} RISK</p>
                </div>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                    * DEMO AI Decision Support (Not Legal Advice)
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                        <strong>Document Risk</strong> <br /><span style={{ color: 'var(--warning)' }}>Score: {risk.document_risk}</span>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                        <strong>Legal Risk</strong> <br /><span style={{ color: 'var(--danger)' }}>Score: {risk.legal_risk}</span>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                        <strong>Ownership Risk</strong> <br /><span style={{ color: 'var(--warning)' }}>Score: {risk.ownership_risk}</span>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                        <strong>Boundary Risk</strong> <br /><span style={{ color: 'var(--success)' }}>Score: {risk.boundary_risk}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default LandDNA;
