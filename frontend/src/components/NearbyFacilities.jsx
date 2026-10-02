import { useState, useEffect } from 'react';
import API_BASE from '../api';

const NearbyFacilities = ({ landId }) => {
    const [facilities, setFacilities] = useState([]);

    useEffect(() => {
        fetch(`${API_BASE}/api/lands/${landId}/nearby-facilities`)
            .then(res => res.json())
            .then(setFacilities)
            .catch(console.error);
    }, [landId]);

    const ICONS = {
        'School': '🏫',
        'Hospital': '🏥',
        'Bank': '🏦',
        'Bus Stop': 's',
        'Railway Station': '🚉'
    };

    return (
        <div className="glass-panel" style={{ marginTop: '2rem' }}>
            <h2>🏢 Nearby Facilities (DEMO)</h2>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                {facilities.map((f, i) => (
                    <div key={i} style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', minWidth: '150px', flex: '1 1 auto' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{ICONS[f.type] || '📍'}</div>
                        <h4 style={{ margin: 0 }}>{f.name}</h4>
                        <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{f.type}</p>
                        <p style={{ margin: '0.5rem 0 0 0', fontWeight: 'bold', color: 'var(--accent-color)' }}>{f.distance_km} km</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default NearbyFacilities;
