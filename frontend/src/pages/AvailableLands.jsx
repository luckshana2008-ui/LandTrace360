import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Tag, MapPin } from 'lucide-react';
import API_BASE from '../api';

const AvailableLands = () => {
    const [lands, setLands] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${API_BASE}/api/lands/for-sale`)
            .then(res => res.json())
            .then(data => {
                setLands(data);
                setLoading(false);
            });
    }, []);

    return (
        <div>
            <h1 className="page-title">Marketplace - Lands For Sale</h1>
            {loading ? <p>Loading lands...</p> : (
                <div className="grid-cards">
                    {lands.map(land => (
                        <div key={land.id} className="glass-panel">
                            <div style={{ background: 'var(--accent-light)', color: 'var(--accent-color)', padding: '0.5rem', borderRadius: '8px', display: 'inline-block', marginBottom: '1rem', fontWeight: 'bold' }}>
                                ₹ {land.asking_price?.toLocaleString('en-IN')}
                            </div>
                            <h3 style={{ marginBottom: '0.5rem' }}>{land.id} - {land.land_type}</h3>
                            <p style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <MapPin size={16} /> {land.location}
                            </p>
                            <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                <Tag size={16} /> {land.area_sq_ft} sq ft.
                            </p>
                            <Link to={`/land/${land.id}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-color)', fontWeight: '600' }}>
                                View Full Details <ArrowRight size={16} />
                            </Link>
                        </div>
                    ))}
                    {lands.length === 0 && <p>No lands available for sale right now.</p>}
                </div>
            )}
        </div>
    );
};
export default AvailableLands;
