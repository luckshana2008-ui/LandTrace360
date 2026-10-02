import { useState } from 'react';
import API_BASE from '../api';

const LandValueEstimator = ({ land, landId }) => {
    const [factors, setFactors] = useState({
        area: land?.area_sq_ft || 1000,
        land_type: land?.land_type || 'Residential',
        road_access: 'Yes',
        water_facility: 'Yes',
        electricity: 'Yes'
    });

    const [result, setResult] = useState(null);

    const handleCalculate = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/lands/${landId}/value-estimate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(factors)
            });
            const data = await res.json();
            setResult(data);
        } catch (error) {
            console.error('Estimate Error:', error);
        }
    };

    return (
        <div className="glass-panel" style={{ marginTop: '2rem' }}>
            <h2>💰 Demo Land Value Estimator</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Estimate based on synthetic rules.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Area (sq ft)</label>
                    <input type="number" className="search-input" value={factors.area} onChange={e => setFactors({ ...factors, area: parseFloat(e.target.value) })} />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Land Type</label>
                    <select className="search-input" value={factors.land_type} onChange={e => setFactors({ ...factors, land_type: e.target.value })}>
                        <option>Residential</option>
                        <option>Commercial</option>
                        <option>Agricultural</option>
                        <option>Industrial</option>
                    </select>
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Road Access</label>
                    <select className="search-input" value={factors.road_access} onChange={e => setFactors({ ...factors, road_access: e.target.value })}>
                        <option>Yes</option>
                        <option>No</option>
                    </select>
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Water Facility</label>
                    <select className="search-input" value={factors.water_facility} onChange={e => setFactors({ ...factors, water_facility: e.target.value })}>
                        <option>Yes</option>
                        <option>No</option>
                    </select>
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Electricity</label>
                    <select className="search-input" value={factors.electricity} onChange={e => setFactors({ ...factors, electricity: e.target.value })}>
                        <option>Yes</option>
                        <option>No</option>
                    </select>
                </div>
            </div>

            <button onClick={handleCalculate} className="btn-primary" style={{ marginTop: '1.5rem', width: '100%' }}>Calculate Estimate</button>

            {result && (
                <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(16,185,129,0.1)', border: '1px solid var(--success)', borderRadius: '8px', textAlign: 'center' }}>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estimated Value</p>
                    <h2 style={{ margin: '0.5rem 0 0 0', fontSize: '2.5rem', color: 'var(--success)' }}>₹{result.estimated_value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h2>
                    <p style={{ margin: '1rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{result.disclaimer}</p>
                </div>
            )}
        </div>
    );
};

export default LandValueEstimator;
